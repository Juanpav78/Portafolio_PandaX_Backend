import mongoose from "mongoose";
import { autoSlug, campoSitios } from "../helpers/sitios.js";

const proyectoSchema = mongoose.Schema({
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    // Identificador legible para la URL de PandaX Code (/projects/:slug). Se genera del nombre
    // si no se escribe. sparse: los proyectos anteriores a este campo no lo tienen todavía.
    slug:{
        type:String,
        trim:true,
        unique:true,
        sparse:true,
    },
    // Ya no es obligatorio: un proyecto de cliente de PandaX Code puede no tener demo pública
    link:{
        type:String,
        trim:true,
        default:'',
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
    // Captura de cómo se ve el proyecto en el celular (opcional). PandaX Code la muestra en el
    // mockup de celular del hero; sin ella, ese celular no puede enseñar el diseño responsive.
    imagenMovil:{
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
    },
    // Campos que muestra PandaX Code en la tarjeta y el modal del proyecto
    subtitulo:{
        type:String,
        trim:true,
        default:'',
    },
    resumen:{
        type:String,
        trim:true,
        default:'',
    },
    // Etiquetas cortas tipo "Responsive", "SEO optimizado" (highlights en PandaX Code)
    puntosClave:{
        type:[String],
        default:[],
    },
    // En qué webs aparece. Los proyectos que ya existían eran del portafolio.
    sitios: campoSitios(['portafolio']),
    // Permite ocultar un proyecto de las webs públicas sin borrarlo
    publicado:{
        type:Boolean,
        default:true,
    },

},{
    timestamps: true,
});

autoSlug(proyectoSchema, 'nombre')

const Proyecto = mongoose.model("Proyecto", proyectoSchema);

export default Proyecto;