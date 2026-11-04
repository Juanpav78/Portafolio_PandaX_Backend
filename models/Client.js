import mongoose from "mongoose";

// Cliente de PandaX Code. Preparado para la fase de negocio (cotizaciones y pagos); todavía no
// tiene rutas ni pantallas.
const clientSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    // NIT o cédula, necesario para facturar
    taxId: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    // Mensaje de contacto del que salió el cliente, para saber qué canal trae negocio
    origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

export default mongoose.model("Client", clientSchema);
