import { sitioValido } from "./sitios.js";

// Filtro base de todo contenido público: sólo lo publicado y, si se pide un sitio, sólo lo que
// lo incluye en `sitios`. `publicado: {$ne: false}` (y no `true`) para que los documentos
// creados antes de existir el campo sigan visibles aunque nadie haya corrido la migración.
export const filtroPublico = (site) => {
    const filtro = { publicado: { $ne: false } }
    const sitio = sitioValido(site)
    if (sitio) filtro.sitios = sitio
    return filtro
}

// Los proyectos anteriores a `sitios` eran todos del portafolio: si aún no se migraron (no
// tienen el campo), cuentan como del portafolio y no aparecen en PandaX Code.
export const filtroProyectos = (site) => {
    const filtro = filtroPublico(site)
    if (filtro.sitios === 'portafolio') {
        delete filtro.sitios
        filtro.$or = [{ sitios: 'portafolio' }, { sitios: { $exists: false } }]
    }
    return filtro
}

// ?limit= acotado: sin tope, alguien podría pedir la colección entera de un golpe
export const limite = (valor, maximo = 50) => {
    const n = Number.parseInt(valor, 10)
    return Number.isFinite(n) && n > 0 ? Math.min(n, maximo) : 0
}

const lista = texto => String(texto ?? '').split(',').map(t => t.trim()).filter(Boolean)

// Proyecto guarda sus campos en español (los usa el portafolio y el admin desde hace años);
// PandaX Code espera los nombres en inglés de su README. Se traduce aquí, en un solo lugar,
// en vez de duplicar el modelo o tocar los componentes del frontend.
export const proyectoPublico = (p) => ({
    _id: p._id,
    slug: p.slug,
    title: p.nombre,
    category: p.tipo,
    subtitle: p.subtitulo || '',
    summary: p.resumen || p.descripcion,
    description: p.descripcion,
    objective: p.problema || '',
    result: p.solucion || '',
    highlights: p.puntosClave ?? [],
    technologies: lista(p.tecnologias),
    cover: p.imagen?.secure_url || '',
    images: (p.galeria ?? []).map(img => img.secure_url).filter(Boolean),
    url: p.link || '',
    github: p.github || '',
    featured: Boolean(p.destacado),
    order: p.orden ?? 0,
    sitios: p.sitios?.length ? p.sitios : ['portafolio'],
    // Versión en inglés de los textos largos (la usa el portafolio bilingüe)
    descriptionEn: p.descripcionEn || '',
    objectiveEn: p.problemaEn || '',
    resultEn: p.solucionEn || '',
    createdAt: p.createdAt,
})
