import mongoose from "mongoose";

// Retos de PandaX Code: una temática al azar y una landing nueva para ella. Se publican en
// redes y llenan el muro de la sección Retos de la web. Sólo existen en PandaX Code, por eso
// no llevan `sitios` como proyectos, servicios y testimonios.

const urlOpcional = (campo) => ({
    type: String,
    trim: true,
    default: '',
    validate: {
        validator: valor => !valor || /^https?:\/\/\S+$/i.test(valor),
        message: `${campo} debe ser una URL completa (https://…)`,
    },
})

const retoSchema = mongoose.Schema({
    // Lo pone el controlador (el siguiente libre) si no se escribe a mano
    numero: { type: Number, required: true, min: [1, 'El número debe ser 1 o mayor'], unique: true },
    tematica: { type: String, required: [true, 'La temática es obligatoria'], trim: true, maxlength: 120 },
    // Mismo formato que las imágenes de Proyecto (helpers/cloudinary.js → subir)
    imagen: {
        type: { secure_url: String, public_id: String, resource_type: String, width: Number, height: Number },
        default: null,
    },
    video: urlOpcional('El enlace al video'),
    demo: urlOpcional('El enlace a la demo'),
    publicado: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Reto", retoSchema);
