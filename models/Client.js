import mongoose from "mongoose";

// Cliente de PandaX Code. Agrupa sus cotizaciones y pagos (ver controllers/negocioController.js).
const clientSchema = mongoose.Schema({
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
    company: { type: String, trim: true, default: '' },
    // Opcional (hay clientes que sólo dan teléfono), pero si se escribe debe ser válido
    email: {
        type: String, trim: true, lowercase: true, default: '',
        validate: { validator: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'El correo no es válido' },
    },
    phone: { type: String, trim: true, default: '' },
    // NIT o cédula, necesario para facturar
    taxId: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    // Mensaje de contacto del que salió el cliente, para saber qué canal trae negocio
    origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

export default mongoose.model("Client", clientSchema);
