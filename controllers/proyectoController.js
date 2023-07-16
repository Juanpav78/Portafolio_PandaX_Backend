import Proyecto from "../models/Proyecto.js";
import { v2 as cloudinary } from 'cloudinary'
const getProyectos = async (req, res)=>{
    const proyectos = await Proyecto.find();
    res.json({proyectos});
}
const getProyecto = async (req, res)=>{
    const {id} = req.params;

    try {
        const proyecto = await Proyecto.findById(id);

        if(!proyecto){
            const error = new Error("No encontrado");
            return res.status(404).json({msg: error.message});
        }
    
        res.json(proyecto);
        
    } catch (error) {
        const errors = new Error("Id no valido");
        return res.status(404).json({msg: errors.message});
    }
   
}
const createProyecto = async (req, res)=>{
    const proyecto = new Proyecto(req.body)
    const file = req.files.imagen
    const imagen = await cloudUpload(file);
    proyecto.imagen = imagen;
    try {
        const proyectoSave = await proyecto.save();
        res.json(proyectoSave);
    } catch (error) {
        console.log(error);  
    }
}
const updateProyecto = async (req, res)=>{
    const {id} = req.params;

    try {
        const proyecto = await Proyecto.findById(id);

        if(!proyecto){
            const error = new Error("No encontrado");
            return res.status(404).json({msg: error.message});
        }

        proyecto.nombre       = req.body.nombre         || proyecto.nombre;
        proyecto.descripcion  = req.body.descripcion    || proyecto.descripcion;
        proyecto.imagen       = req.body.imagen         || proyecto.imagen;
        proyecto.link         = req.body.link           || proyecto.link;
        proyecto.github       = req.body.github         || proyecto.github;
        proyecto.tipo         = req.body.tipo           || proyecto.tipo;
        proyecto.tecnologias  = req.body.tecnologias    || proyecto.tecnologias;
        proyecto.fechaEntrega = req.body.fechaEntrega   || proyecto.fechaEntrega;

        try {
            const proyectoSave = await proyecto.save();
            res.json(proyectoSave);
        } catch (error) {
            const errors = new Error("Algo salio mal");
            return res.status(404).json({msg: errors.message});
        }
        
        
    } catch (error) {
        const errors = new Error("Id no valido");
        return res.status(404).json({msg: errors.message});
    }

}
const deleteProyecto = async (req, res)=>{
    const {id} = req.params;

    try {
        const proyecto = await Proyecto.findById(id);

        if(!proyecto){
            const error = new Error("No encontrado");
            return res.status(404).json({msg: error.message});
        }

        try {
            await proyecto.deleteOne();
            res.json({msg: "Proyecto Eliminado"});
        } catch (error) {
            console.log(error)
        }
    
        
        
    } catch (error) {
        const errors = new Error("Id no valido");
        return res.status(404).json({msg: errors.message});
    }
}


const cloudUpload =async(file)=>{
    try {
        cloudinary.config({ 
            cloud_name: process.env.CLOUD_NAME, 
            api_key: process.env.CLOUD_KEY, 
            api_secret: process.env.CLOUD_SECRET,
            secure: true
          });

         // Hacemos uso de cloudinary para subir el archivo
        const uploaded = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'images', // Asignamos la carpeta de destino
        });

        // Extraemos la url pública del archivo en cloudinary
        const { secure_url } = uploaded;
            // Devolvemos una respuesta con la url del archivo
        return secure_url;
    } catch (error) {
        console.log(error)
    }

}

export {
    getProyectos,
    getProyecto,
    createProyecto,
    updateProyecto,
    deleteProyecto
};