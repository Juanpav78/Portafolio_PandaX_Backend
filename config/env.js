// Las variables cambiaron de nombre (MONGO_URI → MONGODB_URI, FRONTEND_URL → CORS_ORIGINS,
// CLOUD_* → CLOUDINARY_*), pero Render sigue configurado con los nombres viejos. Se lee primero
// el nombre nuevo y, si no existe, el viejo: así el despliegue no se rompe mientras se migra.
const leer = (...nombres) => {
    for (const nombre of nombres) {
        const valor = process.env[nombre]?.trim()
        if (valor) return valor
    }
    return ''
}

export const mongoUri = () => leer('MONGODB_URI', 'MONGO_URI')

// Orígenes permitidos por CORS, separados por coma. El primero se usa además como URL base
// del admin en los enlaces de los correos (recuperar contraseña, confirmar cuenta).
export const corsOrigins = () => leer('CORS_ORIGINS', 'FRONTEND_URL')
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''))
    .filter(Boolean)

export const cloudinaryConfig = () => ({
    cloud_name: leer('CLOUDINARY_CLOUD_NAME', 'CLOUD_NAME'),
    api_key: leer('CLOUDINARY_API_KEY', 'CLOUD_KEY'),
    api_secret: leer('CLOUDINARY_API_SECRET', 'CLOUD_SECRET'),
})
