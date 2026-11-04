import mongoose from "mongoose";

export const ESTADOS_PAGO = ['pendiente', 'pagado', 'reembolsado']
export const METODOS_PAGO = ['transferencia', 'efectivo', 'nequi', 'daviplata', 'tarjeta', 'otro']

// Pago (o abono) de un cliente, opcionalmente ligado a la cotización que cubre. Preparado para
// la fase de negocio; aún sin rutas.
const paymentSchema = mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'COP' },
    method: { type: String, enum: METODOS_PAGO, default: 'transferencia' },
    estado: { type: String, enum: ESTADOS_PAGO, default: 'pendiente' },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
