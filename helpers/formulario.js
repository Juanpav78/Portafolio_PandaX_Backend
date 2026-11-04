// Los formularios con archivos llegan como multipart, que sólo transporta texto: una lista
// puede venir como JSON ('["code"]'), como texto separado por comas o repetida (array real).
export const leerLista = (valor) => {
    if (Array.isArray(valor)) return valor.map(v => String(v).trim()).filter(Boolean)
    const texto = String(valor ?? '').trim()
    if (!texto) return []
    if (texto.startsWith('[')) return JSON.parse(texto)
    return texto.split(',').map(v => v.trim()).filter(Boolean)
}

export const leerBooleano = (valor) => valor === true || valor === 'true' || valor === '1' || valor === 'on'
