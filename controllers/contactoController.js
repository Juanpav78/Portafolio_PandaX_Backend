import { mensajeContacto } from "../helpers/email.js";
import Message from "../models/Message.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Las respuestas llevan un `codigo` además del mensaje: el frontend muestra su propio texto
// traducido (español/inglés) según el código, en vez del mensaje fijo del servidor.
const enviarContacto = async (req, res) => {
    const nombre = String(req.body.nombre ?? '').trim()
    const email = String(req.body.email ?? '').trim()
    const mensaje = String(req.body.mensaje ?? '').trim()

    // Honeypot: campo oculto que una persona nunca ve ni rellena, pero los bots de spam sí.
    // Se responde "enviado" para que el bot no sepa que fue descartado y no lo reintente.
    if (req.body.sitio) return res.json({ codigo: 'enviado', msg: 'Mensaje enviado' })

    if (nombre.length < 2 || nombre.length > 80) return res.status(400).json({ codigo: 'nombre', msg: 'Nombre no válido' })
    if (!EMAIL_VALIDO.test(email)) return res.status(400).json({ codigo: 'email', msg: 'Email no válido' })
    if (mensaje.length < 10 || mensaje.length > 2000) return res.status(400).json({ codigo: 'mensaje', msg: 'El mensaje debe tener entre 10 y 2000 caracteres' })

    // Se guarda primero para que el mensaje aparezca en el admin aunque el correo falle. Si
    // tampoco se pudo guardar, el correo es la única copia y su error decide la respuesta.
    let guardado = false
    try {
        await Message.create({ name: nombre, email, message: mensaje, site: 'portafolio' })
        guardado = true
    } catch (error) {
        console.log('No se pudo guardar el mensaje de contacto:', error.message)
    }

    try {
        await mensajeContacto({ nombre, email, mensaje, sitio: 'portafolio' })
    } catch (error) {
        console.log('Error enviando contacto:', error.message)
        if (!guardado) return res.status(502).json({ codigo: 'error', msg: 'No se pudo enviar el mensaje' })
    }
    res.json({ codigo: 'enviado', msg: 'Mensaje enviado' })
}

export { enviarContacto }
