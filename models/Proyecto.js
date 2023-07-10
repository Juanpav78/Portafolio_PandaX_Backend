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
        type:String,
        required:true,
        trim:true,
    },
    token:{
        type:String,
    },

},{
    timestamps: true,
});

const Proyecto = mongoose.model("Proyecto", proyectoSchema);