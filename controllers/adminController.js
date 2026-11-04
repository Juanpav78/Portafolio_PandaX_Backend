import Service from "../models/Service.js";
import Testimonial from "../models/Testimonial.js";
import Message, { ESTADOS_MENSAJE } from "../models/Message.js";
import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";
import { crearCrud, errorAdmin, filtroListado } from "../helpers/crud.js";
import { SITIOS, sitioValido } from "../helpers/sitios.js";
import { subir } from "../helpers/cloudinary.js";

export const services = crearCrud(Service, {
    entidad: 'Servicio',
    orden: { order: 1, createdAt: 1 },
    campos: ['title', 'slug', 'description', 'icon', 'priceFrom', 'priceSuffix', 'priceLabelPrefix',
        'priceLabel', 'order', 'publicado', 'sitios'],
})

export const testimonials = crearCrud(Testimonial, {
    entidad: 'Testimonio',
    orden: { createdAt: -1 },
    campos: ['name', 'company', 'role', 'text', 'publicado', 'sitios'],
})

// ---------- Proyectos: listado del admin con filtros ----------
// El CRUD con imágenes sigue en proyectoController; aquí sólo el listado filtrable y el
// interruptor de publicado, que no necesitan multipart.
export const listarProyectos = async (req, res) => {
    try {
        const proyectos = await Proyecto.find(filtroListado(req.query))
            .sort({ destacado: -1, orden: 1, fechaEntrega: -1 }).lean()
        res.json(proyectos)
    } catch (error) { errorAdmin(res, error, 'Proyecto') }
}

// Sirve para proyectos, servicios y testimonios: todos tienen `publicado`
const conPublicado = { projects: Proyecto, services: Service, testimonials: Testimonial }
export const cambiarPublicado = coleccion => async (req, res) => {
    try {
        const doc = await conPublicado[coleccion].findByIdAndUpdate(
            req.params.id, { publicado: req.body.publicado === true }, { new: true, runValidators: true })
        if (!doc) return res.status(404).json({ msg: 'No encontrado' })
        res.json(doc)
    } catch (error) { errorAdmin(res, error) }
}

// ---------- Mensajes de contacto ----------
export const listarMensajes = async (req, res) => {
    const filtro = {}
    const sitio = sitioValido(req.query.site)
    if (sitio) filtro.site = sitio
    if (ESTADOS_MENSAJE.includes(req.query.estado)) filtro.estado = req.query.estado
    // Por defecto se ocultan los archivados: son los que ya no requieren atención
    else if (req.query.estado !== 'todos') filtro.estado = { $ne: 'archivado' }
    try {
        res.json(await Message.find(filtro).sort({ createdAt: -1 }).limit(500).lean())
    } catch (error) { errorAdmin(res, error, 'Mensaje') }
}

export const obtenerMensaje = async (req, res) => {
    try {
        const mensaje = await Message.findById(req.params.id)
        if (!mensaje) return res.status(404).json({ msg: 'Mensaje no encontrado' })
        // Abrir un mensaje nuevo lo marca como leído, como en cualquier bandeja de correo
        if (mensaje.estado === 'nuevo') {
            mensaje.estado = 'leído'
            await mensaje.save()
        }
        res.json(mensaje)
    } catch (error) { errorAdmin(res, error, 'Mensaje') }
}

export const cambiarEstadoMensaje = async (req, res) => {
    if (!ESTADOS_MENSAJE.includes(req.body.estado)) {
        return res.status(400).json({ msg: `Estado no válido. Usa: ${ESTADOS_MENSAJE.join(', ')}` })
    }
    try {
        const mensaje = await Message.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true })
        if (!mensaje) return res.status(404).json({ msg: 'Mensaje no encontrado' })
        res.json(mensaje)
    } catch (error) { errorAdmin(res, error, 'Mensaje') }
}

export const eliminarMensaje = async (req, res) => {
    try {
        const mensaje = await Message.findByIdAndDelete(req.params.id)
        if (!mensaje) return res.status(404).json({ msg: 'Mensaje no encontrado' })
        res.json({ msg: 'Mensaje eliminado' })
    } catch (error) { errorAdmin(res, error, 'Mensaje') }
}

// ---------- Resumen del panel ----------
// Conteos por sitio de cada contenido. Un documento en ambos sitios cuenta en los dos.
const contarPorSitio = Model => Promise.all(SITIOS.map(sitio => Model.countDocuments({ sitios: sitio })))
    .then(conteos => Object.fromEntries(SITIOS.map((sitio, i) => [sitio, conteos[i]])))

export const resumen = async (req, res) => {
    try {
        const [nuevos, nuevosPorSitio, proyectos, servicios, testimonios, totalProyectos, ultimos] = await Promise.all([
            Message.countDocuments({ estado: 'nuevo' }),
            Promise.all(SITIOS.map(site => Message.countDocuments({ estado: 'nuevo', site })))
                .then(conteos => Object.fromEntries(SITIOS.map((sitio, i) => [sitio, conteos[i]]))),
            contarPorSitio(Proyecto),
            contarPorSitio(Service),
            contarPorSitio(Testimonial),
            Proyecto.countDocuments(),
            Message.find({ estado: { $ne: 'archivado' } }).sort({ createdAt: -1 }).limit(5).lean(),
        ])
        res.json({
            mensajesNuevos: nuevos,
            mensajesNuevosPorSitio: nuevosPorSitio,
            proyectos: { total: totalProyectos, ...proyectos },
            servicios,
            testimonios,
            ultimosMensajes: ultimos,
        })
    } catch (error) { errorAdmin(res, error) }
}

// ---------- Cuenta ----------
export const cambiarPassword = async (req, res) => {
    const { actual, nuevo } = req.body
    if (!nuevo || String(nuevo).length < 8) return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 8 caracteres' })
    try {
        const usuario = await Usuario.findById(req.usuario._id)
        if (!(await usuario.comprobarPassword(String(actual ?? '')))) {
            return res.status(403).json({ msg: 'La contraseña actual no es correcta' })
        }
        usuario.password = nuevo
        await usuario.save()
        res.json({ msg: 'Contraseña actualizada' })
    } catch (error) { errorAdmin(res, error) }
}

// ---------- Imágenes ----------
// Subida suelta a Cloudinary (campo "imagen"). Los proyectos suben sus imágenes junto con el
// formulario; esta ruta queda para contenidos que sólo necesitan una URL.
export const subirImagen = async (req, res) => {
    const archivo = req.files?.imagen
    if (!archivo) return res.status(400).json({ msg: 'Adjunta una imagen en el campo "imagen"' })
    if (!archivo.mimetype?.startsWith('image/')) return res.status(400).json({ msg: 'El archivo debe ser una imagen' })
    try {
        res.status(201).json(await subir(archivo))
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'No se pudo subir la imagen' })
    }
}
