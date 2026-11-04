// npm run seed → crea el admin, migra los proyectos antiguos y carga el contenido inicial.
// Se puede correr las veces que haga falta: nunca duplica ni pisa lo que ya editaste en el admin
// (los upsert sólo escriben al insertar, con $setOnInsert).
import mongoose from "mongoose";
import conectarDB from "../config/db.js";
import Usuario from "../models/Usuario.js";
import Proyecto from "../models/Proyecto.js";
import Service from "../models/Service.js";
import Testimonial from "../models/Testimonial.js";
import { slugify } from "../helpers/sitios.js";
import { servicios, vibes, testimonios } from "./datos.js";

const log = (...args) => console.log('  ·', ...args)

const crearAdmin = async () => {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    if (!email) throw new Error('Falta ADMIN_EMAIL en el .env')

    const existente = await Usuario.findOne({ email })
    if (existente) {
        // No se toca la contraseña: el seed no debe dejarte fuera de una cuenta que ya usas
        if (!existente.rol || !existente.confirmado) {
            existente.rol ??= 'admin'
            existente.confirmado = true
            await existente.save()
        }
        return log(`Admin ${email} ya existía (contraseña sin cambios)`)
    }

    const password = process.env.ADMIN_PASSWORD
    if (!password || password.length < 8) throw new Error('Falta ADMIN_PASSWORD (mínimo 8 caracteres) para crear el admin')
    await Usuario.create({ nombre: 'Administrador', email, password, confirmado: true, rol: 'admin' })
    log(`Admin ${email} creado`)
}

// Los proyectos creados antes de este cambio no tienen sitios, publicado ni slug
const migrarProyectos = async () => {
    const sinSitios = await Proyecto.updateMany({ sitios: { $exists: false } }, { $set: { sitios: ['portafolio'] } })
    const sinPublicado = await Proyecto.updateMany({ publicado: { $exists: false } }, { $set: { publicado: true } })
    log(`Proyectos migrados: ${sinSitios.modifiedCount} sin sitios, ${sinPublicado.modifiedCount} sin publicado`)

    const sinSlug = await Proyecto.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] })
    for (const proyecto of sinSlug) {
        // Si dos proyectos se llaman igual, el segundo recibe un sufijo para no chocar con el índice único
        const base = slugify(proyecto.nombre) || 'proyecto'
        let slug = base
        for (let n = 2; await Proyecto.exists({ slug, _id: { $ne: proyecto._id } }); n++) slug = `${base}-${n}`
        await Proyecto.updateOne({ _id: proyecto._id }, { $set: { slug } })
    }
    if (sinSlug.length) log(`Slugs generados: ${sinSlug.length}`)
}

const cargarServicios = async () => {
    let nuevos = 0
    for (const servicio of servicios) {
        const r = await Service.updateOne(
            { slug: servicio.slug },
            { $setOnInsert: { ...servicio, publicado: true, sitios: ['code'] } },
            { upsert: true })
        nuevos += r.upsertedCount
    }
    log(`Servicios: ${nuevos} nuevos, ${servicios.length - nuevos} ya existían`)
}

const cargarVibes = async () => {
    // Puede que ya exista en el portafolio creado a mano con otro nombre ("Vibes - Plant") y sin
    // slug: se busca por cualquier nombre que empiece por "Vibes" para no crear un duplicado
    const existente = await Proyecto.findOne({ $or: [{ slug: vibes.slug }, { nombre: /^vibes\b/i }] })
    if (!existente) {
        await Proyecto.create(vibes)
        return log('Proyecto Vibes creado en code + portafolio')
    }
    // Si existe, sólo se agregan los sitios y se completan los campos de PandaX Code vacíos
    existente.sitios = [...new Set([...(existente.sitios ?? []), ...vibes.sitios])]
    for (const campo of ['subtitulo', 'resumen']) if (!existente[campo]) existente[campo] = vibes[campo]
    if (!existente.puntosClave?.length) existente.puntosClave = vibes.puntosClave
    await existente.save()
    log('Proyecto Vibes ya existía: sitios actualizados a code + portafolio')
}

const cargarTestimonios = async () => {
    for (const t of testimonios) {
        await Testimonial.updateOne({ name: t.name, text: t.text }, { $setOnInsert: { ...t, sitios: ['code'] } }, { upsert: true })
    }
    log(`Testimonios: ${testimonios.length} en el archivo de datos`)
}

try {
    await conectarDB()
    console.log(`Seed sobre la base "${mongoose.connection.name}"`)
    await crearAdmin()
    await migrarProyectos()
    await cargarServicios()
    await cargarVibes()
    await cargarTestimonios()
    // Crea los índices únicos (slug) si la colección es nueva, para que el seed deje todo listo
    await Promise.all([Proyecto, Service].map(M => M.createIndexes()))
    console.log('Seed terminado')
} catch (error) {
    console.error('Seed falló:', error.message)
    process.exitCode = 1
} finally {
    await mongoose.disconnect()
}
