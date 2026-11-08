import Service from "../models/Service.js";
import Proyecto from "../models/Proyecto.js";
import Testimonial from "../models/Testimonial.js";
import Message from "../models/Message.js";
import Reto from "../models/Reto.js";
import { filtroPublico, filtroProyectos, limite, proyectoPublico } from "../helpers/publico.js";
import { sitioValido } from "../helpers/sitios.js";
import { mensajeContacto } from "../helpers/email.js";

// Rutas que consumen las webs públicas (PandaX Code y portafolio). Las respuestas son arrays u
// objetos planos y los errores llevan `message`, que es lo que lee src/api/client.js de PandaX Code.

const fallo = (res, error, status = 500) => {
    if (status === 500) console.log(error)
    return res.status(status).json({ message: status === 500 ? 'Error en el servidor' : error })
}

// Campos internos que ninguna web pública necesita ver
const OCULTOS = '-__v -publicado'

export const getServices = async (req, res) => {
    try {
        const services = await Service.find(filtroPublico(req.query.site))
            .sort({ order: 1, createdAt: 1 }).select(OCULTOS).lean()
        res.json(services)
    } catch (error) { fallo(res, error) }
}

export const getProjects = async (req, res) => {
    const { site, featured, limit } = req.query
    const filtro = filtroProyectos(site)
    if (featured === 'true') filtro.destacado = true
    try {
        const proyectos = await Proyecto.find(filtro)
            .sort({ destacado: -1, orden: 1, fechaEntrega: -1 })
            .limit(limite(limit))
            .lean()
        res.json(proyectos.map(proyectoPublico))
    } catch (error) { fallo(res, error) }
}

export const getProjectBySlug = async (req, res) => {
    try {
        const proyecto = await Proyecto.findOne({ ...filtroProyectos(req.query.site), slug: req.params.slug }).lean()
        if (!proyecto) return fallo(res, 'Proyecto no encontrado', 404)
        res.json(proyectoPublico(proyecto))
    } catch (error) { fallo(res, error) }
}

export const getTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find(filtroPublico(req.query.site))
            .sort({ createdAt: -1 }).select(OCULTOS).lean()
        res.json(testimonials)
    } catch (error) { fallo(res, error) }
}

// Retos para el muro de PandaX Code, del más reciente al más antiguo. La imagen va como URL más
// su tamaño: el muro reserva el alto de cada tarjeta antes de que cargue y no salta.
export const getRetos = async (req, res) => {
    try {
        const retos = await Reto.find({ publicado: { $ne: false } }).sort({ numero: -1 }).limit(100).lean()
        res.json(retos.map(r => ({
            _id: r._id,
            numero: r.numero,
            tematica: r.tematica,
            imagen: r.imagen?.secure_url ?? '',
            ancho: r.imagen?.width ?? null,
            alto: r.imagen?.height ?? null,
            video: r.video,
            demo: r.demo,
        })))
    } catch (error) { fallo(res, error) }
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const texto = (valor, max) => String(valor ?? '').trim().slice(0, max)

export const postContact = async (req, res) => {
    const body = req.body
    const datos = {
        name: texto(body.name, 80),
        email: texto(body.email, 120),
        phone: texto(body.phone, 40),
        company: texto(body.company, 120),
        service: texto(body.service, 120),
        budget: texto(body.budget, 60),
        message: String(body.message ?? '').trim(),
        consent: body.consent === true,
        site: sitioValido(body.site) ?? 'code',
    }

    // Honeypot: PandaX Code descarta "website" en el navegador, pero un bot que llame a la API
    // directamente podría enviarlo. Se responde éxito para que no lo reintente.
    if (body.website) return res.json({ ok: true, message: 'Mensaje enviado' })

    if (datos.name.length < 2) return fallo(res, 'Escribe tu nombre', 400)
    if (!EMAIL_VALIDO.test(datos.email)) return fallo(res, 'Escribe un correo válido', 400)
    if (datos.message.length < 10 || datos.message.length > 2000) return fallo(res, 'El mensaje debe tener entre 10 y 2000 caracteres', 400)
    if (!datos.consent) return fallo(res, 'Debes aceptar la política de tratamiento de datos', 400)

    try {
        const mensaje = await Message.create(datos)
        // El aviso por correo es secundario: el mensaje ya quedó guardado y se ve en el admin, así
        // que un fallo de Brevo/SMTP no debe hacerle creer al visitante que no se envió.
        mensajeContacto({ nombre: datos.name, email: datos.email, mensaje: datos.message, sitio: datos.site, extra: datos })
            .catch(error => console.log('Aviso de contacto por correo falló:', error.message))
        res.status(201).json({ ok: true, message: 'Mensaje enviado', id: mensaje._id })
    } catch (error) { fallo(res, error) }
}
