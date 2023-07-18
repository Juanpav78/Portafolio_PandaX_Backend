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
    tecnologias:{
        type:String,
        required:true,
        trim:true,
    },
    imagen:{
        type:Object,
        trim:true,
    },
    fechaEntrega:{
        type:Date,
        default:Date.now(),
    }

},{
    timestamps: true,
});

const Proyecto = mongoose.model("Proyecto", proyectoSchema);

export default Proyecto;