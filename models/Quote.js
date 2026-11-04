import mongoose from "mongoose";

export const ESTADOS_COTIZACION = ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida']

const itemSchema = mongoose.Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    // Servicio del catálogo del que salió la línea (opcional: también hay líneas libres)
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
}, { _id: false });

// Cotización para un cliente. Preparada para la fase de negocio; aún sin rutas.
const quoteSchema = mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true, trim: true },
    items: { type: [itemSchema], default: [] },
    currency: { type: String, default: 'COP' },
    estado: { type: String, enum: ESTADOS_COTIZACION, default: 'borrador' },
    validUntil: Date,
    notes: { type: String, trim: true, default: '' },
}, { timestamps: true, toJSON: { virtuals: true } });

// El total se calcula de las líneas en vez de guardarse: así nunca queda desincronizado
quoteSchema.virtual('total').get(function () {
    return this.items.reduce((suma, item) => suma + item.quantity * item.unitPrice, 0)
})

export default mongoose.model("Quote", quoteSchema);
