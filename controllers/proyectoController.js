import Proyecto from "../models/Proyecto.js";
import { filtroProyectos } from "../helpers/publico.js";
import { borrar, comoLista, subir } from "../helpers/cloudinary.js";
import { leerBooleano, leerLista } from "../helpers/formulario.js";

const MAX_GALERIA = 8

// Campos donde un valor vacío significa "no cambiar" (el formulario no los envía si están en blanco)
const CAMPOS_TEXTO = ['nombre', 'descripcion', 'github', 'tipo', 'tecnologias', 'fechaEntrega']
// Campos opcionales que sí se pueden vaciar: un "" enviado a propósito se guarda
const CAMPOS_VACIABLES = ['problema', 'solucion', 'descripcionEn', 'problemaEn', 'solucionEn', 'slug', 'subtitulo', 'resumen', 'link']
const CAMPOS_LISTA = ['sitios', 'puntosClave']

const tomarTextos = body => {
    const datos = {}
    CAMPOS_TEXTO.forEach(campo => { if (body[campo]) datos[campo] = body[campo] })
    CAMPOS_VACIABLES.forEach(campo => { if (body[campo] !== undefined) datos[campo] = body[campo] })
    // El formulario llega como multipart (sólo texto): listas y booleanos vienen serializados
    CAMPOS_LISTA.forEach(campo => { if (body[campo] !== undefined) datos[campo] = leerLista(body[campo]) })
    if (body.publicado !== undefined) datos.publicado = leerBooleano(body.publicado)
    if (body.interno !== undefined) datos.interno = leerBooleano(body.interno)
    return datos
}

const responderError = (res, error) => {
    if (error.name === 'ValidationError') return res.status(400).json({ msg: Object.values(error.errors)[0].message })
    if (error.name === 'CastError') return res.status(404).json({ msg: 'Proyecto no encontrado' })
    if (error instanceof SyntaxError) return res.status(400).json({ msg: 'Datos de la galería no válidos' })
    if (error.code === 11000) return res.status(400).json({ msg: 'Ya existe un proyecto con ese slug' })
    console.log(error)
    return res.status(500).json({ msg: error.message?.includes('cloudinary') ? 'No se pudo subir la imagen' : 'Error en el servidor' })
}

const getProyectos = async (req, res)=>{
    // El admin pide ?todos=true y ve también lo oculto y lo de PandaX Code. Se exige el parámetro
    // además del token porque el admin comparte dominio (y token guardado) con el portafolio:
    // sin él, al visitar la web pública con la sesión abierta verías proyectos ocultos.
    const todos = req.esAdmin && req.query.todos === 'true'
    const filtro = todos ? {} : filtroProyectos(req.query.site || 'portafolio')
    // Primero los destacados en su orden manual y después el resto, del más reciente al más antiguo
    const proyectos = await Proyecto.find(filtro).sort({ destacado: -1, orden: 1, fechaEntrega: -1 });
    res.json({proyectos});
}

const getProyecto = async (req, res)=>{
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if(!proyecto) return res.status(404).json({msg: "Proyecto no encontrado"});
        res.json(proyecto);
    } catch (error) {
        responderError(res, error)
    }
}

const createProyecto = async (req, res)=>{
    const portada = req.files?.imagen
    const nuevas = comoLista(req.files?.galeria)
    if(!portada) return res.status(400).json({msg: "La imagen es obligatoria"});
    if(nuevas.length > MAX_GALERIA) return res.status(400).json({msg: `La galería admite máximo ${MAX_GALERIA} imágenes`});

    let subidas = []
    try {
        // Las subidas van en paralelo: con varias capturas, en serie tardaría la suma de todas
        // La captura móvil es opcional: si no llega, su posición queda en null y no se sube nada
        const movil = req.files?.imagenMovil
        subidas = await Promise.all([portada, movil, ...nuevas].map(archivo => archivo ? subir(archivo) : null))
        const [imagen, imagenMovil, ...galeria] = subidas
        const proyecto = new Proyecto({ ...tomarTextos(req.body), imagen, galeria, ...(imagenMovil && { imagenMovil }) })
        res.json(await proyecto.save());
    } catch (error) {
        // Si falla el guardado (p. ej. validación) se limpian las imágenes ya subidas para no
        // dejar archivos huérfanos ocupando espacio en Cloudinary
        await Promise.all(subidas.map(borrar))
        responderError(res, error)
    }
}

const updateProyecto = async (req, res)=>{
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if(!proyecto) return res.status(404).json({msg: "Proyecto no encontrado"});

        // galeriaEliminar llega como JSON (array de public_id) porque el multipart sólo transporta texto
        const aEliminar = JSON.parse(req.body.galeriaEliminar || '[]')
        const nuevas = comoLista(req.files?.galeria)
        const restantes = proyecto.galeria.filter(img => !aEliminar.includes(img.public_id))
        const eliminadas = proyecto.galeria.filter(img => aEliminar.includes(img.public_id))
        if(restantes.length + nuevas.length > MAX_GALERIA){
            return res.status(400).json({msg: `La galería admite máximo ${MAX_GALERIA} imágenes`});
        }

        // Antes cualquier archivo adjunto reemplazaba la portada; ahora sólo el campo "imagen"
        const portadaNueva = req.files?.imagen
        const movilNueva = req.files?.imagenMovil
        const [imagen, imagenMovil, ...galeriaNueva] = await Promise.all(
            [portadaNueva, movilNueva, ...nuevas].map(archivo => archivo ? subir(archivo) : null))
        const portadaVieja = imagen ? proyecto.imagen : null
        // La captura móvil se reemplaza al subir otra o se quita con quitarImagenMovil=true
        const quitarMovil = req.body.quitarImagenMovil === 'true'
        const movilVieja = (imagenMovil || quitarMovil) ? proyecto.imagenMovil : null

        proyecto.set(tomarTextos(req.body))
        if (imagen) proyecto.imagen = imagen
        if (imagenMovil) proyecto.imagenMovil = imagenMovil
        else if (quitarMovil) proyecto.imagenMovil = undefined
        proyecto.galeria = [...restantes, ...galeriaNueva]
        const guardado = await proyecto.save();

        // Las imágenes viejas se borran DESPUÉS de guardar: si el guardado fallara, el proyecto
        // seguiría apuntando a ellas y no deben haber desaparecido.
        await Promise.all([portadaVieja, movilVieja, ...eliminadas].map(borrar))
        res.json(guardado);
    } catch (error) {
        responderError(res, error)
    }
}

const deleteProyecto = async (req, res)=>{
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if(!proyecto) return res.status(404).json({msg: "Proyecto no encontrado"});
        await proyecto.deleteOne();
        await Promise.all([proyecto.imagen, proyecto.imagenMovil, ...proyecto.galeria].map(borrar))
        res.json({msg: "Proyecto eliminado"});
    } catch (error) {
        responderError(res, error)
    }
}

const destacarProyecto = async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if(!proyecto) return res.status(404).json({msg: "Proyecto no encontrado"});
        proyecto.destacado = Boolean(req.body.destacado)
        if (proyecto.destacado) {
            // Un destacado nuevo va al final de la lista para no desordenar lo ya organizado
            const ultimo = await Proyecto.findOne({ destacado: true }).sort({ orden: -1 })
            proyecto.orden = (ultimo?.orden ?? -1) + 1
        }
        res.json(await proyecto.save());
    } catch (error) {
        responderError(res, error)
    }
}

// Recibe los ids de los destacados en el orden deseado y guarda su posición. bulkWrite manda
// todas las actualizaciones en una sola ida y vuelta a MongoDB en lugar de una por proyecto.
const ordenarDestacados = async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ msg: 'Se esperaba una lista de ids' })
    try {
        await Proyecto.bulkWrite(ids.map((_id, orden) => ({
            updateOne: { filter: { _id, destacado: true }, update: { orden } },
        })))
        res.json({ msg: 'Orden guardado' })
    } catch (error) {
        responderError(res, error)
    }
}

export {
    getProyectos,
    getProyecto,
    createProyecto,
    updateProyecto,
    deleteProyecto,
    destacarProyecto,
    ordenarDestacados,
};
