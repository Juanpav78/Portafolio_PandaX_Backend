import mongoose from "mongoose";

// "vencida" no se guarda a mano: se deduce al leer (enviada + validUntil ya pasó), así nunca
// queda una cotización marcada como enviada cuando en realidad expiró.
export const ESTADOS_COTIZACION = ['borrador', 'enviada', 'aceptada', 'rechazada']

const itemSchema = mongoose.Schema({
    description: { type: String, required: [true, 'Cada línea necesita una descripción'], trim: true, maxlength: 300 },
    quantity: { type: Number, default: 1, min: [0.01, 'La cantidad debe ser mayor que 0'] },
    unitPrice: { type: Number, default: 0, min: [0, 'El precio no puede ser negativo'] },
    // Servicio del catálogo del que salió la línea (opcional: también hay líneas libres)
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
}, { _id: false });

// Cotización para un cliente. Sin IVA: el total es la suma de las líneas.
const quoteSchema = mongoose.Schema({
    // Consecutivo legible (COT-0001). Lo asigna el controlador al crear.
    numero: { type: Number, unique: true, sparse: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Elige el cliente'] },
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 160 },
    items: {
        type: [itemSchema],
        default: [],
        validate: { validator: items => items.length > 0, message: 'Agrega al menos una línea' },
    },
    currency: { type: String, default: 'COP' },
    estado: { type: String, enum: ESTADOS_COTIZACION, default: 'borrador' },
    validUntil: Date,
    notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.model("Quote", quoteSchema);
