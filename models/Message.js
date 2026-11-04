import mongoose from "mongoose";
import { SITIOS } from "../helpers/sitios.js";

export const ESTADOS_MENSAJE = ['nuevo', 'leído', 'respondido', 'archivado']

// Mensaje del formulario de contacto. Antes sólo se enviaba por correo; guardarlo permite verlo
// en el admin aunque el correo falle (p. ej. Brevo caído o SMTP bloqueado en Render).
const messageSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, default: '', maxlength: 40 },
    company: { type: String, trim: true, default: '', maxlength: 120 },
    service: { type: String, trim: true, default: '', maxlength: 120 },
    budget: { type: String, trim: true, default: '', maxlength: 60 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    // Autorización de tratamiento de datos (Ley 1581 en Colombia): se guarda como prueba
    consent: { type: Boolean, default: false },
    site: { type: String, enum: SITIOS, required: true },
    estado: { type: String, enum: ESTADOS_MENSAJE, default: 'nuevo' },
}, { timestamps: true });

// El listado del admin siempre filtra por estado y ordena por fecha
messageSchema.index({ estado: 1, createdAt: -1 })

export default mongoose.model("Message", messageSchema);
