import mongoose from "mongoose";

export const ESTADOS = ['idea', 'planificado', 'en-progreso', 'completado']
export const PRIORIDADES = ['baja', 'media', 'alta']

// Las tareas van embebidas en el plan (no en otra colección): siempre se leen junto a su plan
// y nunca por separado, así una sola consulta trae todo lo que necesita el tablero.
const tareaSchema = mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    completada: {
        type: Boolean,
        default: false,
    },
    fechaLimite: Date,
}, {
    timestamps: true,
});

// Proyecto futuro del planificador del admin. Es privado: no aparece en el portafolio
// público hasta que se publica como Proyecto desde el panel.
const planSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    descripcion: {
        type: String,
        trim: true,
        default: '',
    },
    estado: {
        type: String,
        enum: ESTADOS,
        default: 'idea',
    },
    prioridad: {
        type: String,
        enum: PRIORIDADES,
        default: 'media',
    },
    // Mismo formato que en Proyecto ("React, Node") para poder publicarlo sin convertir nada
    tecnologias: {
        type: String,
        trim: true,
        default: '',
    },
    fechaInicio: Date,
    fechaLimite: Date,
    tareas: [tareaSchema],
    creador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
    },
}, {
    timestamps: true,
});

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
