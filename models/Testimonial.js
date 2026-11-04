import mongoose from "mongoose";
import { campoSitios } from "../helpers/sitios.js";

const testimonialSchema = mongoose.Schema({
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 80 },
    company: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    text: { type: String, required: [true, 'El testimonio es obligatorio'], trim: true, maxlength: 1000 },
    publicado: { type: Boolean, default: true },
    sitios: campoSitios(['code']),
}, { timestamps: true });

export default mongoose.model("Testimonial", testimonialSchema);
