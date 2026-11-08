import Reto from "../models/Reto.js";
import { errorAdmin } from "../helpers/crud.js";
import { borrar, subir } from "../helpers/cloudinary.js";

// CRUD de retos para el admin. Llega como multipart (campos + `imagen` opcional) en una sola
// petición, como los proyectos: así, si algo falla al guardar, la imagen recién subida se
// borra de Cloudinary aquí mismo y no quedan archivos huérfanos.

const TIPOS = ['image/png', 'image/jpeg', 'image/webp']
const CAMPOS = ['numero', 'tematica', 'video', 'demo', 'publicado']

// En multipart todo llega como texto: "true"/"false" y números se convierten aquí
const leerCampos = (body) => {
    const datos = {}
    for (const campo of CAMPOS) {
        if (body[campo] === undefined) continue
        if (campo === 'publicado') datos.publicado = body.publicado === true || body.publicado === 'true'
        else if (campo === 'numero') {
            if (String(body.numero).trim() !== '') datos.numero = Number(body.numero)
        }
        else datos[campo] = body[campo]
    }
    return datos
}

const imagenDe = (req) => {
    const archivo = req.files?.imagen
    if (!archivo) return { archivo: null }
    if (Array.isArray(archivo)) return { error: 'Envía una sola imagen' }
    if (!TIPOS.includes(archivo.mimetype)) return { error: 'La imagen debe ser PNG, JPG o WebP' }
    return { archivo }
}

const siguienteNumero = async () => {
    const ultimo = await Reto.findOne().sort({ numero: -1 }).select('numero').lean()
    return (ultimo?.numero ?? 0) + 1
}

const numeroRepetido = (res, error) => error.code === 11000
    ? res.status(400).json({ msg: 'Ya existe un reto con ese número' })
    : null

export const listarRetos = async (req, res) => {
    try {
        res.json(await Reto.find().sort({ numero: -1 }).lean())
    } catch (error) { errorAdmin(res, error, 'Reto') }
}

export const obtenerReto = async (req, res) => {
    try {
        const reto = await Reto.findById(req.params.id)
        if (!reto) return res.status(404).json({ msg: 'Reto no encontrado' })
        res.json(reto)
    } catch (error) { errorAdmin(res, error, 'Reto') }
}

export const crearReto = async (req, res) => {
    const { archivo, error: errorImagen } = imagenDe(req)
    if (errorImagen) return res.status(400).json({ msg: errorImagen })

    let imagen = null
    try {
        const datos = leerCampos(req.body)
        datos.numero ??= await siguienteNumero()
        // Se valida antes de subir: no tiene sentido mandar la imagen a Cloudinary si el
        // documento no se va a poder guardar
        const reto = new Reto(datos)
        await reto.validate()
        if (archivo) reto.imagen = imagen = await subir(archivo)
        res.status(201).json(await reto.save())
    } catch (error) {
        await borrar(imagen)
        numeroRepetido(res, error) ?? errorAdmin(res, error, 'Reto')
    }
}

export const actualizarReto = async (req, res) => {
    const { archivo, error: errorImagen } = imagenDe(req)
    if (errorImagen) return res.status(400).json({ msg: errorImagen })

    let nueva = null
    try {
        const reto = await Reto.findById(req.params.id)
        if (!reto) return res.status(404).json({ msg: 'Reto no encontrado' })
        const vieja = reto.imagen

        reto.set(leerCampos(req.body))
        const quitar = req.body.quitarImagen === 'true' || req.body.quitarImagen === true
        if (quitar) reto.imagen = null
        await reto.validate()
        if (archivo) reto.imagen = nueva = await subir(archivo)
        await reto.save()

        // La imagen anterior sólo se borra cuando lo nuevo ya quedó guardado
        if ((archivo || quitar) && vieja?.public_id) await borrar(vieja)
        res.json(reto)
    } catch (error) {
        await borrar(nueva)
        numeroRepetido(res, error) ?? errorAdmin(res, error, 'Reto')
    }
}

export const eliminarReto = async (req, res) => {
    try {
        const reto = await Reto.findByIdAndDelete(req.params.id)
        if (!reto) return res.status(404).json({ msg: 'Reto no encontrado' })
        await borrar(reto.imagen)
        res.json({ msg: 'Reto eliminado' })
    } catch (error) { errorAdmin(res, error, 'Reto') }
}

// Número sugerido para el formulario de "nuevo reto"
export const siguienteReto = async (req, res) => {
    try {
        res.json({ numero: await siguienteNumero() })
    } catch (error) { errorAdmin(res, error, 'Reto') }
}
