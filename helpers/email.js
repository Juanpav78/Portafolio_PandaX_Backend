import nodemailer from 'nodemailer'

// Hay dos formas de enviar, según lo que esté configurado en el .env:
//  - BREVO_API_KEY → API HTTP de Brevo. Es la que funciona en producción: el plan gratis de
//    Render bloquea los puertos SMTP (25/465/587), pero no las peticiones HTTPS normales.
//  - Si no, SMTP con nodemailer (Gmail, Mailtrap…): útil en local.
const usarBrevo = () => Boolean(process.env.BREVO_API_KEY)

// El transporte SMTP se crea la primera vez que se necesita, no al importar el módulo,
// para no abrir configuración SMTP inútil cuando se usa Brevo.
let transporte
const smtp = () => {
    if (transporte) return transporte
    const puerto = Number(process.env.EMAIL_PORT)
    transporte = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: puerto,
        // 465 → TLS desde el inicio; 587/2525 → conexión normal que pasa a TLS con STARTTLS
        secure: puerto === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
    return transporte
}

// Con Gmail y con Brevo el remitente debe ser una dirección verificada (tu cuenta), o el
// correo se rechaza o acaba en spam. Por eso nunca se usa el email del visitante como "De:";
// para poder contestarle directamente se pone en replyTo.
const remitente = () => ({ name: 'PandaX', email: process.env.EMAIL_FROM || process.env.EMAIL_USER })

export const enviarCorreo = async ({ para, asunto, html, texto, responderA }) => {
    if (usarBrevo()) {
        const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({
                sender: remitente(),
                to: [{ email: para }],
                ...(responderA && { replyTo: responderA }),
                subject: asunto,
                htmlContent: html,
                textContent: texto,
            }),
        })
        // fetch no lanza error con respuestas 4xx/5xx: hay que comprobarlo a mano
        if (!respuesta.ok) throw new Error(`Brevo respondió ${respuesta.status}: ${await respuesta.text()}`)
        return
    }

    const { name, email } = remitente()
    await smtp().sendMail({
        from: `"${name}" <${email}>`,
        to: para,
        ...(responderA && { replyTo: `"${responderA.name}" <${responderA.email}>` }),
        subject: asunto,
        html,
        text: texto,
    })
}

// Todo texto que escribe un visitante se escapa antes de meterlo en el HTML del correo:
// si no, alguien podría inyectar enlaces o HTML engañoso en los mensajes que te llegan.
const escapar = (texto = '') => texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Plantilla HTML con estilos en línea: la mayoría de clientes de correo (Gmail incluido)
// ignoran las hojas de estilo y las etiquetas <style>.
const plantilla = ({ titulo, cuerpo, textoBoton, url }) => `
<div style="background:#06060a;padding:40px 16px;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#12121c;border:1px solid #272738;border-radius:16px;padding:32px;color:#f3f3f7">
    <p style="margin:0 0 24px;font-size:20px;font-weight:bold">PandaX<span style="color:#ff6a3d">/&gt;</span></p>
    <h1 style="margin:0 0 12px;font-size:22px">${titulo}</h1>
    <div style="margin:0 0 28px;color:#a0a0b4;line-height:1.6">${cuerpo}</div>
    ${url ? `<a href="${url}" style="display:inline-block;background:#ff6a3d;color:#06060a;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px">${textoBoton}</a>` : ''}
  </div>
</div>`

const urlFrontend = () => process.env.FRONTEND_URL.split(',')[0]

export const recuperarPassword = ({ email, nombre, token }) => {
    const url = `${urlFrontend()}/recover-password/${token}`
    return enviarCorreo({
        para: email,
        asunto: 'PandaX - Restablece tu contraseña',
        texto: `Hola ${nombre}, crea una nueva contraseña en: ${url}`,
        html: plantilla({
            titulo: `Hola ${escapar(nombre)}`,
            cuerpo: 'Recibimos una solicitud para cambiar tu contraseña. Usa el botón para crear una nueva. Si no fuiste tú, ignora este correo.',
            textoBoton: 'Cambiar contraseña',
            url,
        }),
    })
}

export const confirmarUsuario = ({ email, nombre, token }) => {
    const url = `${urlFrontend()}/confirm/${token}`
    return enviarCorreo({
        para: email,
        asunto: 'PandaX - Confirma tu cuenta',
        texto: `Hola ${nombre}, confirma tu cuenta en: ${url}`,
        html: plantilla({ titulo: `¡Hola ${escapar(nombre)}!`, cuerpo: 'Tu cuenta está casi lista, sólo falta confirmarla.', textoBoton: 'Confirmar cuenta', url }),
    })
}

// Mensaje del formulario de contacto del portafolio. Llega a tu bandeja con "Responder"
// apuntando al visitante, así contestas desde tu correo sin copiar direcciones.
export const mensajeContacto = ({ nombre, email, mensaje }) => enviarCorreo({
    para: process.env.CONTACTO_EMAIL || remitente().email,
    asunto: `Nuevo mensaje de ${nombre} desde tu portafolio`,
    responderA: { email, name: nombre },
    texto: `${nombre} <${email}> escribió:\n\n${mensaje}`,
    html: plantilla({
        titulo: 'Nuevo mensaje desde el portafolio',
        cuerpo: `<p style="margin:0 0 12px"><strong style="color:#f3f3f7">${escapar(nombre)}</strong> &lt;${escapar(email)}&gt;</p>
                 <p style="margin:0;white-space:pre-line;color:#f3f3f7">${escapar(mensaje)}</p>`,
    }),
})
