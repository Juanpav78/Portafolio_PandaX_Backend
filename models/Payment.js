import mongoose from "mongoose";

export const ESTADOS_PAGO = ['pendiente', 'pagado', 'reembolsado']
export const METODOS_PAGO = ['transferencia', 'nequi', 'daviplata', 'efectivo', 'tarjeta', 'otro']

// Pago (o abono) de un cliente, opcionalmente ligado a la cotización que cubre. Sólo los
// "pagado" suman en caja; "pendiente" sirve para anotar un abono acordado que aún no llega.
const paymentSchema = mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Elige el cliente'] },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    amount: { type: Number, required: [true, 'Escribe el monto'], min: [1, 'El monto debe ser mayor que 0'] },
    currency: { type: String, default: 'COP' },
    method: { type: String, enum: { values: METODOS_PAGO, message: 'Método de pago no válido' }, default: 'transferencia' },
    // Lo habitual es registrar un pago cuando ya llegó
    estado: { type: String, enum: { values: ESTADOS_PAGO, message: 'Estado no válido' }, default: 'pagado' },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
}, { timestamps: true });

paymentSchema.index({ date: -1 })

export default mongoose.model("Payment", paymentSchema);
