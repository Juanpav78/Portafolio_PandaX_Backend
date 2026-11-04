import { sitioValido } from "./sitios.js";

// Respuesta de error uniforme para el admin (formato { msg } que ya muestran sus alertas)
export const errorAdmin = (res, error, entidad = 'Elemento') => {
    if (error.name === 'ValidationError') return res.status(400).json({ msg: Object.values(error.errors)[0].message })
    if (error.name === 'CastError') return res.status(404).json({ msg: `${entidad} no encontrado` })
    if (error.code === 11000) return res.status(400).json({ msg: `Ya existe un ${entidad.toLowerCase()} con ese slug` })
    console.log(error)
    return res.status(500).json({ msg: 'Error en el servidor' })
}

// Filtros comunes de los listados del admin: ?site=code|portafolio y ?publicado=true|false
export const filtroListado = (query) => {
    const filtro = {}
    const sitio = sitioValido(query.site)
    if (sitio) filtro.sitios = sitio
    if (query.publicado === 'true') filtro.publicado = true
    if (query.publicado === 'false') filtro.publicado = false
    return filtro
}

// Sólo se copian del body los campos permitidos: pasar req.body entero dejaría escribir
// cualquier cosa (_id, createdAt…) en el documento.
const tomar = (body, campos) => Object.fromEntries(
    campos.filter(c => body[c] !== undefined).map(c => [c, body[c]])
)

// CRUD estándar para los contenidos simples (servicios, testimonios). Los proyectos tienen
// su propio controlador porque manejan imágenes.
export const crearCrud = (Model, { campos, orden, entidad }) => ({
    listar: async (req, res) => {
        try {
            res.json(await Model.find(filtroListado(req.query)).sort(orden).lean())
        } catch (error) { errorAdmin(res, error, entidad) }
    },

    obtener: async (req, res) => {
        try {
            const doc = await Model.findById(req.params.id)
            if (!doc) return res.status(404).json({ msg: `${entidad} no encontrado` })
            res.json(doc)
        } catch (error) { errorAdmin(res, error, entidad) }
    },

    crear: async (req, res) => {
        try {
            res.status(201).json(await Model.create(tomar(req.body, campos)))
        } catch (error) { errorAdmin(res, error, entidad) }
    },

    // findById + save (y no findByIdAndUpdate) para que corran los validadores y el slug
    actualizar: async (req, res) => {
        try {
            const doc = await Model.findById(req.params.id)
            if (!doc) return res.status(404).json({ msg: `${entidad} no encontrado` })
            doc.set(tomar(req.body, campos))
            res.json(await doc.save())
        } catch (error) { errorAdmin(res, error, entidad) }
    },

    eliminar: async (req, res) => {
        try {
            const doc = await Model.findByIdAndDelete(req.params.id)
            if (!doc) return res.status(404).json({ msg: `${entidad} no encontrado` })
            res.json({ msg: `${entidad} eliminado` })
        } catch (error) { errorAdmin(res, error, entidad) }
    },
})
