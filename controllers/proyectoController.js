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
    let imagen = ""

    try {
        const proyecto = await Proyecto.findById(id);

        if(!proyecto){
            const error = new Error("No encontrado");
            return res.status(404).json({msg: error.message});
        }



        if(req.files != null){  
            //Se elimina de cloudinary la imagen anterior
            await cloudDelete(proyecto.imagen)
            //Se elimina de cloudinary se sube una nueva imagen
            const file = req.files.imagen
            imagen = await cloudUpload(file);
        }else{
            imagen = proyecto.imagen
        }
        
        proyecto.nombre       = req.body.nombre         || proyecto.nombre;
        proyecto.descripcion  = req.body.descripcion    || proyecto.descripcion;
        proyecto.imagen = imagen;
        proyecto.link         = req.body.link           || proyecto.link;
        proyecto.github       = req.body.github         || proyecto.github;
        proyecto.tipo         = req.body.tipo           || proyecto.tipo;
        proyecto.tecnologias  = req.body.tecnologias    || proyecto.tecnologias;
        proyecto.fechaEntrega = req.body.fechaEntrega   || proyecto.fechaEntrega;

        
        const proyectoSave = await proyecto.save();
        res.json(proyectoSave);
        
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
        //Se elimina de cloudinary la imagen anterior
        await cloudDelete(proyecto.imagen)
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


        // Devolvemos una respuesta con la objecto del archivo
        return uploaded;
    } catch (error) {
        console.log(error)
    }

}

const cloudDelete = async(image)=>{
    try {
         cloudinary.config({ 
            cloud_name: process.env.CLOUD_NAME, 
            api_key: process.env.CLOUD_KEY, 
            api_secret: process.env.CLOUD_SECRET,
            secure: true
          });

          cloudinary.uploader.destroy(image.public_id , image.resource_type)
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