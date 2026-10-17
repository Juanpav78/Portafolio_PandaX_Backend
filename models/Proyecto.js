import mongoose from "mongoose";

const proyectoSchema = mongoose.Schema({
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    link:{
        type:String,
        required:true,
        trim:true
    },
    github:{
        type:String,
        trim:true
    },
    descripcion:{
        type:String,
        required:true,
        trim:true,
    },
    tipo:{
        type:String,
        required:true,
        trim:true,
    },
    // Caso de estudio (opcional): qué problema había y cómo se resolvió. Es lo que convierte
    // una captura bonita en una prueba de criterio técnico para quien revisa el portafolio.
    problema:{
        type:String,
        trim:true,
        default:'',
    },
    solucion:{
        type:String,
        trim:true,
        default:'',
    },
    tecnologias:{
        type:String,
        required:true,
        trim:true,
    },
    // Versión en inglés de los textos largos (opcional). El sitio público la muestra cuando el
    // visitante elige inglés y, si está vacía, cae al texto en español.
    descripcionEn:{
        type:String,
        trim:true,
        default:'',
    },
    problemaEn:{
        type:String,
        trim:true,
        default:'',
    },
    solucionEn:{
        type:String,
        trim:true,
        default:'',
    },
    // Portada: la imagen de la tarjeta y la primera de la galería del modal
    imagen:{
        type:Object,
    },
    // Capturas adicionales, en el orden en que se muestran después de la portada
    galeria:{
        type:[Object],
        default:[],
    },
    // Los destacados aparecen primero en la home, ordenados a mano por `orden` (0, 1, 2…)
    destacado:{
        type:Boolean,
        default:false,
    },
    orden:{
        type:Number,
        default:0,
    },
    fechaEntrega:{
        type:Date,
        default:Date.now,
    }

},{
    timestamps: true,
});

const Proyecto = mongoose.model("Proyecto", proyectoSchema);

export default Proyecto;