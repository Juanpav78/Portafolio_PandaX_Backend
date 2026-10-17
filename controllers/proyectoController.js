import Proyecto from "../models/Proyecto.js";
import { v2 as cloudinary } from 'cloudinary'

const MAX_GALERIA = 8

// Campos donde un valor vacío significa "no cambiar" (el formulario no los envía si están en blanco)
const CAMPOS_TEXTO = ['nombre', 'descripcion', 'link', 'github', 'tipo', 'tecnologias', 'fechaEntrega']
// Campos opcionales que sí se pueden vaciar: un "" enviado a propósito se guarda
const CAMPOS_VACIABLES = ['problema', 'solucion', 'descripcionEn', 'problemaEn', 'solucionEn']

// express-fileupload entrega un objeto si llega un solo archivo con ese nombre y un array si
// llegan varios; se normaliza a array para tratar ambos casos igual.
const comoLista = archivos => !archivos ? [] : Array.isArray(archivos) ? archivos : [archivos]

let configurado = false
const configurarCloudinary = () => {
    if (configurado) return
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_KEY,
        api_secret: process.env.CLOUD_SECRET,
        secure: true
    });
    configurado = true
}

// Sólo se guardan los datos que usa la web. La respuesta completa de Cloudinary trae ~20 campos
// (etiquetas, firma, versión…) que inflarían cada documento y la respuesta de /proyectos.
const subir = async archivo => {
    configurarCloudinary()
    const { secure_url, public_id, resource_type, width, height } =
        await cloudinary.uploader.upload(archivo.tempFilePath, { folder: 'images' })
    return { secure_url, public_id, resource_type, width, height }
}

// Borrar de Cloudinary nunca debe hacer fallar la petición: si una imagen ya no existe o la API
// falla, el proyecto se guarda igual y sólo queda un archivo huérfano que se registra en el log.
const borrar = async imagen => {
    if (!imagen?.public_id) return
    configurarCloudinary()
    try {
        await cloudinary.uploader.destroy(imagen.public_id, { resource_type: imagen.resource_type ?? 'image' })
    } catch (error) {
        console.log('No se pudo borrar de Cloudinary', imagen.public_id, error.message)
    }
}

const tomarTextos = body => {
    const datos = {}
    CAMPOS_TEXTO.forEach(campo => { if (body[campo]) datos[campo] = body[campo] })
    CAMPOS_VACIABLES.forEach(campo => { if (body[campo] !== undefined) datos[campo] = body[campo] })
    return datos
}

const responderError = (res, error) => {
    if (error.name === 'ValidationError') return res.status(400).json({ msg: Object.values(error.errors)[0].message })
    if (error.name === 'CastError') return res.status(404).json({ msg: 'Proyecto no encontrado' })
    if (error instanceof SyntaxError) return res.status(400).json({ msg: 'Datos de la galería no válidos' })
    console.log(error)
    return res.status(500).json({ msg: error.message?.includes('cloudinary') ? 'No se pudo subir la imagen' : 'Error en el servidor' })
}

const getProyectos = async (req, res)=>{
    // Primero los destacados en su orden manual y después el resto, del más reciente al más antiguo
    const proyectos = await Proyecto.find().sort({ destacado: -1, orden: 1, fechaEntrega: -1 });
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
        subidas = await Promise.all([portada, ...nuevas].map(subir))
        const [imagen, ...galeria] = subidas
        const proyecto = new Proyecto({ ...tomarTextos(req.body), imagen, galeria })
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
        const [imagen, ...galeriaNueva] = await Promise.all(
            [portadaNueva, ...nuevas].map(archivo => archivo ? subir(archivo) : null))
        const portadaVieja = imagen ? proyecto.imagen : null

        proyecto.set(tomarTextos(req.body))
        if (imagen) proyecto.imagen = imagen
        proyecto.galeria = [...restantes, ...galeriaNueva]
        const guardado = await proyecto.save();

        // Las imágenes viejas se borran DESPUÉS de guardar: si el guardado fallara, el proyecto
        // seguiría apuntando a ellas y no deben haber desaparecido.
        await Promise.all([portadaVieja, ...eliminadas].map(borrar))
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
        await Promise.all([proyecto.imagen, ...proyecto.galeria].map(borrar))
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
