import mongoose from "mongoose";
import { autoSlug, campoSitios } from "../helpers/sitios.js";

// Iconos que sabe dibujar PandaX Code (lucide-react). Un valor fuera de la lista no rompería la
// web, pero mostraría el icono por defecto sin avisar; mejor rechazarlo al guardar.
export const ICONOS = ['layout', 'monitor', 'shopping-bag', 'pen-tool', 'code', 'rocket']

const serviceSchema = mongoose.Schema({
    title: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 120 },
    slug: { type: String, trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, enum: ICONOS, default: 'code' },
    // Precio "desde" en pesos, sin formato: el frontend lo formatea según el idioma
    priceFrom: { type: Number, min: 0 },
    priceSuffix: { type: String, trim: true, default: '' },         // "/mes"
    priceLabelPrefix: { type: String, trim: true, default: '' },    // "Planes desde"
    // Si existe, reemplaza al precio (p. ej. "A la medida de tu proyecto")
    priceLabel: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    publicado: { type: Boolean, default: true },
    sitios: campoSitios(['code']),
}, { timestamps: true });

autoSlug(serviceSchema, 'title')

export default mongoose.model("Service", serviceSchema);
