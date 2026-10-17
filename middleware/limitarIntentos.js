import rateLimit from "express-rate-limit";

// Frena ataques de fuerza bruta contra el login y el envío masivo de correos de recuperación:
// tras `limit` peticiones desde la misma IP en 15 minutos, responde 429 hasta que pase la ventana.
// El mensaje sigue el formato { msg } que el frontend ya muestra en sus alertas.
const crearLimite = (limit, msg) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { msg },
})

export const limiteLogin = crearLimite(10, "Demasiados intentos de inicio de sesión. Espera 15 minutos.")
export const limiteCorreos = crearLimite(5, "Demasiadas solicitudes. Espera 15 minutos antes de pedir otro correo.")
// Formulario de contacto: suficiente para una persona real, corta el spam automatizado
export const limiteContacto = crearLimite(3, "Has enviado varios mensajes seguidos. Inténtalo de nuevo en unos minutos.")
