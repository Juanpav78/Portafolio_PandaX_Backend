import nodemailer from 'nodemailer'

export const recuperarPassword = async (datos) =>{
    const{email, nombre, token} = datos;

    var transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
    });

    const info = await transport.sendMail({
        from: '"PandaX" <pandax@correo.com  >',
        to: email,
        subject: "PandaX - Restablece tu contraseña",
        text: "Confirma tu cuenta.",
        html: `
            <h3>Hola ${nombre}, cambia tu password</h3> 
            <p>Click para generar una nueva contraseña en el siguiente enlace: </p>
            <a href="${process.env.FRONTEND_URL}/recover-password/${token}">Cambiar Contraseña</a>
        `
    })
}

export const confirmarUsuario = async (datos) =>{
    const{email, nombre, token} = datos;

    var transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
    });

    const info = await transport.sendMail({
        from: '"PandaX" <pandax@correo.com  >',
        to: email,
        subject: "PandaX - confirmación de usuario.",
        text: "Confirma tu cuenta.",
        html: `
            <h3>Hola ${nombre}, confirma tu cuenta!!!</h3> 
            <p>Tu cuenta esta casi lista, solo debes comprobarla en el siguiente enlace: </p>
            <a href="${process.env.FRONTEND_URL}/confirm/${token}">¡Confirmar cuenta!</a>
        `
    })
}