import Client from "../models/Client.js";
import Quote from "../models/Quote.js";
import Payment from "../models/Payment.js";
import Message from "../models/Message.js";
import { errorAdmin } from "../helpers/crud.js";
import { siguienteNumero } from "../models/Contador.js";

// ---------- Utilidades de cálculo ----------
// El total de una cotización se calcula de sus líneas (no se guarda) para que nunca quede
// desincronizado. Con .lean() los virtuals del modelo no viajan, por eso se calcula aquí.
export const totalCotizacion = q => (q.items ?? []).reduce((suma, i) => suma + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0)

// Sólo cuentan los pagos efectivamente recibidos: un pago "pendiente" es una promesa y uno
// "reembolsado" ya no está en caja.
const pagado = pagos => pagos.filter(p => p.estado === 'pagado').reduce((suma, p) => suma + p.amount, 0)

// Escapa el texto del buscador para usarlo dentro de una expresión regular
const escapar = texto => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const CAMPOS_CLIENTE = ['name', 'company', 'email', 'phone', 'taxId', 'notes']
const tomar = (body, campos) => Object.fromEntries(campos.filter(c => body[c] !== undefined).map(c => [c, body[c]]))

// ---------- Clientes ----------
export const listarClientes = async (req, res) => {
    const q = String(req.query.q ?? '').trim()
    const filtro = q
        ? { $or: ['name', 'company', 'email', 'phone'].map(campo => ({ [campo]: new RegExp(escapar(q), 'i') })) }
        : {}
    try {
        const clientes = await Client.find(filtro).sort({ createdAt: -1 }).limit(500).lean()
        // Conteos en una sola consulta por colección en vez de una por cliente
        const ids = clientes.map(c => c._id)
        const [cotizaciones, pagos] = await Promise.all([
            Quote.find({ client: { $in: ids } }, { client: 1, items: 1, estado: 1 }).lean(),
            Payment.find({ client: { $in: ids } }, { client: 1, amount: 1, estado: 1 }).lean(),
        ])
        res.json(clientes.map(c => {
            const suyas = cotizaciones.filter(q => q.client.equals(c._id))
            const susPagos = pagos.filter(p => p.client.equals(c._id))
            return { ...c, cotizaciones: suyas.length, pagado: pagado(susPagos) }
        }))
    } catch (error) { errorAdmin(res, error, 'Cliente') }
}

// Ficha completa: datos del cliente, su historial y el estado de cuenta
export const detalleCliente = async (req, res) => {
    try {
        const cliente = await Client.findById(req.params.id).populate('origin', 'site createdAt message').lean()
        if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' })
        const [cotizaciones, pagos] = await Promise.all([
            Quote.find({ client: cliente._id }).sort({ createdAt: -1 }).lean(),
            Payment.find({ client: cliente._id }).sort({ date: -1 }).lean(),
        ])
        // Lo que el cliente debe: cotizaciones aceptadas menos lo que ya pagó
        const aceptado = cotizaciones.filter(q => q.estado === 'aceptada').reduce((s, q) => s + totalCotizacion(q), 0)
        const recibido = pagado(pagos)
        res.json({
            cliente,
            cotizaciones: cotizaciones.map(q => conTotales(q, pagos)),
            pagos,
            cuenta: { aceptado, pagado: recibido, saldo: Math.max(aceptado - recibido, 0) },
        })
    } catch (error) { errorAdmin(res, error, 'Cliente') }
}

export const crearCliente = async (req, res) => {
    try {
        res.status(201).json(await Client.create(tomar(req.body, CAMPOS_CLIENTE)))
    } catch (error) { errorAdmin(res, error, 'Cliente') }
}

export const actualizarCliente = async (req, res) => {
    try {
        const cliente = await Client.findById(req.params.id)
        if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' })
        cliente.set(tomar(req.body, CAMPOS_CLIENTE))
        res.json(await cliente.save())
    } catch (error) { errorAdmin(res, error, 'Cliente') }
}

// No se borra un cliente con historial: se perderían cotizaciones y pagos que sirven de
// registro contable. Primero hay que eliminar esos documentos a propósito.
export const eliminarCliente = async (req, res) => {
    try {
        const [cotizaciones, pagos] = await Promise.all([
            Quote.countDocuments({ client: req.params.id }),
            Payment.countDocuments({ client: req.params.id }),
        ])
        if (cotizaciones || pagos) {
            return res.status(400).json({ msg: `El cliente tiene ${cotizaciones} cotizaciones y ${pagos} pagos. Elimínalos antes de borrarlo.` })
        }
        const cliente = await Client.findByIdAndDelete(req.params.id)
        if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' })
        res.json({ msg: 'Cliente eliminado' })
    } catch (error) { errorAdmin(res, error, 'Cliente') }
}

// Convierte un mensaje de contacto en cliente. Si ya existe uno con ese correo se reutiliza
// (devuelve existente: true) en vez de duplicarlo.
export const clienteDesdeMensaje = async (req, res) => {
    try {
        const mensaje = await Message.findById(req.params.mensajeId)
        if (!mensaje) return res.status(404).json({ msg: 'Mensaje no encontrado' })

        const existente = mensaje.email && await Client.findOne({ email: mensaje.email.toLowerCase() })
        if (existente) return res.json({ cliente: existente, existente: true })

        const cliente = await Client.create({
            name: mensaje.name,
            email: mensaje.email,
            phone: mensaje.phone,
            company: mensaje.company,
            // Lo que pidió queda como primera nota, para no tener que volver al mensaje
            notes: [mensaje.service && `Interesado en: ${mensaje.service}`, mensaje.budget && `Presupuesto: ${mensaje.budget}`]
                .filter(Boolean).join('\n'),
            origin: mensaje._id,
        })
        res.status(201).json({ cliente, existente: false })
    } catch (error) { errorAdmin(res, error, 'Mensaje') }
}

// ---------- Cotizaciones ----------
const DIAS_VIGENCIA = 15

// Estado que se muestra: una enviada cuyo plazo ya pasó se presenta como "vencida"
const estadoVisible = q => q.estado === 'enviada' && q.validUntil && new Date(q.validUntil) < new Date() ? 'vencida' : q.estado

const conTotales = (q, pagos = []) => {
    const total = totalCotizacion(q)
    const recibido = pagado(pagos.filter(p => String(p.quote) === String(q._id)))
    return { ...q, total, pagado: recibido, saldo: Math.max(total - recibido, 0), estadoVisible: estadoVisible(q) }
}

// Sólo se aceptan los campos esperados de cada línea; números a Number para que "1.200.000"
// escrito como texto no llegue a la base como string
const limpiarItems = items => (Array.isArray(items) ? items : []).map(i => ({
    description: String(i.description ?? '').trim(),
    quantity: Number(i.quantity ?? 1),
    unitPrice: Number(i.unitPrice ?? 0),
    ...(i.service && { service: i.service }),
}))

const datosCotizacion = body => ({
    ...tomar(body, ['client', 'title', 'notes', 'validUntil', 'estado']),
    ...(body.items !== undefined && { items: limpiarItems(body.items) }),
})

export const listarCotizaciones = async (req, res) => {
    const filtro = {}
    if (req.query.client) filtro.client = req.query.client
    try {
        const cotizaciones = await Quote.find(filtro).sort({ numero: -1 }).populate('client', 'name company').lean()
        const pagos = await Payment.find({ quote: { $in: cotizaciones.map(q => q._id) } }, { quote: 1, amount: 1, estado: 1 }).lean()
        let resultado = cotizaciones.map(q => conTotales(q, pagos))
        // "vencida" no existe en la base: el filtro por estado se aplica sobre el estado visible
        if (req.query.estado) resultado = resultado.filter(q => q.estadoVisible === req.query.estado)
        res.json(resultado)
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

export const detalleCotizacion = async (req, res) => {
    try {
        const cotizacion = await Quote.findById(req.params.id).populate('client').lean()
        if (!cotizacion) return res.status(404).json({ msg: 'Cotización no encontrada' })
        const pagos = await Payment.find({ quote: cotizacion._id }).sort({ date: -1 }).lean()
        res.json({ ...conTotales(cotizacion, pagos), pagos })
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

export const crearCotizacion = async (req, res) => {
    try {
        if (!(await Client.exists({ _id: req.body.client }))) return res.status(400).json({ msg: 'Elige un cliente válido' })
        // Se valida antes de pedir número: si fallara después, se gastaría un consecutivo
        const vence = new Date(Date.now() + DIAS_VIGENCIA * 864e5)
        const cotizacion = new Quote({ validUntil: vence, ...datosCotizacion(req.body) })
        await cotizacion.validate()
        cotizacion.numero = await siguienteNumero('cotizacion', Quote)
        await cotizacion.save()
        res.status(201).json(cotizacion)
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

export const actualizarCotizacion = async (req, res) => {
    try {
        const cotizacion = await Quote.findById(req.params.id)
        if (!cotizacion) return res.status(404).json({ msg: 'Cotización no encontrada' })
        if (req.body.client && !(await Client.exists({ _id: req.body.client }))) return res.status(400).json({ msg: 'Elige un cliente válido' })
        cotizacion.set(datosCotizacion(req.body))
        res.json(await cotizacion.save())
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

export const cambiarEstadoCotizacion = async (req, res) => {
    try {
        const cotizacion = await Quote.findById(req.params.id)
        if (!cotizacion) return res.status(404).json({ msg: 'Cotización no encontrada' })
        cotizacion.estado = req.body.estado
        // Reenviar una vencida le da un plazo nuevo en vez de dejarla expirada al instante
        if (req.body.estado === 'enviada' && cotizacion.validUntil && cotizacion.validUntil < new Date()) {
            cotizacion.validUntil = new Date(Date.now() + DIAS_VIGENCIA * 864e5)
        }
        res.json(await cotizacion.save())
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

// Con pagos registrados se conserva: borrarla dejaría pagos apuntando a nada
export const eliminarCotizacion = async (req, res) => {
    try {
        const pagos = await Payment.countDocuments({ quote: req.params.id })
        if (pagos) return res.status(400).json({ msg: `La cotización tiene ${pagos} pagos registrados. Elimínalos antes o márcala como rechazada.` })
        const cotizacion = await Quote.findByIdAndDelete(req.params.id)
        if (!cotizacion) return res.status(404).json({ msg: 'Cotización no encontrada' })
        res.json({ msg: 'Cotización eliminada' })
    } catch (error) { errorAdmin(res, error, 'Cotización') }
}

// ---------- Pagos ----------
// Colombia no tiene horario de verano: el desfase con UTC es siempre -05:00. Los meses y las
// fechas se calculan en hora de Bogotá para que un pago del 30 a las 9 p. m. no caiga en el
// mes siguiente por estar el servidor en UTC.
const ZONA = '-05:00'
export const rangoMes = (mes) => {
    const [anio, numero] = String(mes).split('-').map(Number)
    const inicio = new Date(`${anio}-${String(numero).padStart(2, '0')}-01T00:00:00${ZONA}`)
    const siguiente = numero === 12 ? `${anio + 1}-01` : `${anio}-${String(numero + 1).padStart(2, '0')}`
    return { $gte: inicio, $lt: new Date(`${siguiente}-01T00:00:00${ZONA}`) }
}
export const mesActual = () => new Date(Date.now() - 5 * 36e5).toISOString().slice(0, 7)

// El formulario envía "YYYY-MM-DD": se guarda al mediodía de Bogotá para que no cambie de día
const leerFecha = valor => /^\d{4}-\d{2}-\d{2}$/.test(String(valor)) ? new Date(`${valor}T12:00:00${ZONA}`) : valor

const datosPago = body => {
    const datos = tomar(body, ['client', 'quote', 'amount', 'method', 'estado', 'notes'])
    if (body.date !== undefined) datos.date = leerFecha(body.date)
    if (datos.amount !== undefined) datos.amount = Number(datos.amount)
    // "" desde el select significa "sin cotización"
    if (datos.quote === '' || datos.quote === null) datos.quote = undefined
    return datos
}

// Un pago ligado a una cotización debe ser del mismo cliente; si no, el saldo de ambos mentiría
const validarRelacion = async ({ client, quote }) => {
    if (!client || !(await Client.exists({ _id: client }))) return 'Elige un cliente válido'
    if (quote) {
        const cotizacion = await Quote.findById(quote).select('client').lean()
        if (!cotizacion) return 'La cotización no existe'
        if (String(cotizacion.client) !== String(client)) return 'La cotización elegida es de otro cliente'
    }
    return null
}

export const listarPagos = async (req, res) => {
    const filtro = {}
    if (req.query.client) filtro.client = req.query.client
    if (req.query.quote) filtro.quote = req.query.quote
    if (/^\d{4}-\d{2}$/.test(req.query.mes ?? '')) filtro.date = rangoMes(req.query.mes)
    try {
        const pagos = await Payment.find(filtro).sort({ date: -1 }).limit(1000)
            .populate('client', 'name company').populate('quote', 'numero title').lean()
        res.json({ pagos, recibido: pagado(pagos) })
    } catch (error) { errorAdmin(res, error, 'Pago') }
}

export const detallePago = async (req, res) => {
    try {
        const pago = await Payment.findById(req.params.id).lean()
        if (!pago) return res.status(404).json({ msg: 'Pago no encontrado' })
        res.json(pago)
    } catch (error) { errorAdmin(res, error, 'Pago') }
}

export const crearPago = async (req, res) => {
    const datos = datosPago(req.body)
    try {
        const problema = await validarRelacion(datos)
        if (problema) return res.status(400).json({ msg: problema })
        res.status(201).json(await Payment.create(datos))
    } catch (error) { errorAdmin(res, error, 'Pago') }
}

export const actualizarPago = async (req, res) => {
    try {
        const pago = await Payment.findById(req.params.id)
        if (!pago) return res.status(404).json({ msg: 'Pago no encontrado' })
        const datos = datosPago(req.body)
        const problema = await validarRelacion({ client: datos.client ?? pago.client, quote: 'quote' in datos ? datos.quote : pago.quote })
        if (problema) return res.status(400).json({ msg: problema })
        pago.set(datos)
        if ('quote' in datos && !datos.quote) pago.quote = undefined
        res.json(await pago.save())
    } catch (error) { errorAdmin(res, error, 'Pago') }
}

export const eliminarPago = async (req, res) => {
    try {
        const pago = await Payment.findByIdAndDelete(req.params.id)
        if (!pago) return res.status(404).json({ msg: 'Pago no encontrado' })
        res.json({ msg: 'Pago eliminado' })
    } catch (error) { errorAdmin(res, error, 'Pago') }
}

// ---------- Resumen de negocio para el panel ----------
export const resumenNegocio = async () => {
    const [pagosMes, aceptadas, enviadas] = await Promise.all([
        Payment.find({ estado: 'pagado', date: rangoMes(mesActual()) }, { amount: 1, estado: 1 }).lean(),
        Quote.find({ estado: 'aceptada' }, { items: 1 }).lean(),
        Quote.find({ estado: 'enviada' }, { validUntil: 1 }).lean(),
    ])
    const pagosAceptadas = await Payment.find({ quote: { $in: aceptadas.map(q => q._id) }, estado: 'pagado' }, { quote: 1, amount: 1, estado: 1 }).lean()
    const porCobrar = aceptadas.reduce((s, q) => s + conTotales(q, pagosAceptadas).saldo, 0)
    return {
        ingresosMes: pagado(pagosMes),
        porCobrar,
        // Enviadas que siguen vigentes: las que esperan respuesta del cliente
        cotizacionesPorResponder: enviadas.filter(q => !q.validUntil || new Date(q.validUntil) >= new Date()).length,
    }
}
