// Sitios públicos que comparten esta base de datos. Cada contenido indica en cuáles aparece
// con el campo `sitios`; agregar un sitio nuevo es agregarlo aquí.
export const SITIOS = ['code', 'portafolio']

// Definición reutilizable del campo `sitios` para los esquemas de Mongoose. Exige al menos un
// sitio: un contenido sin sitio no se vería en ninguna web y quedaría olvidado en la base.
export const campoSitios = (porDefecto) => ({
    type: [{ type: String, enum: SITIOS }],
    default: porDefecto,
    validate: {
        validator: lista => Array.isArray(lista) && lista.length > 0,
        message: 'Elige al menos un sitio donde mostrar el contenido',
    },
})

// "Diseño Web Ágil" → "diseno-web-agil". Se quitan tildes para que la URL sea legible y estable.
export const slugify = (texto = '') => String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Genera el slug a partir de un campo del documento si no se escribió uno a mano. Va en
// pre('validate') para que el índice único lo compruebe antes de guardar.
export const autoSlug = (schema, campoOrigen) => {
    schema.pre('validate', function () {
        if (!this.slug && this[campoOrigen]) this.slug = slugify(this[campoOrigen])
        else if (this.isModified('slug')) this.slug = slugify(this.slug)
    })
}

// Valor de ?site= aceptado en las rutas; cualquier otra cosa se ignora en vez de devolver
// una lista vacía por un error de escritura.
export const sitioValido = valor => SITIOS.includes(valor) ? valor : null
