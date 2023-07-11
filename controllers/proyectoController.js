import Proyecto from "../models/Proyecto.js";

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

export {
    getProyectos,
    getProyecto,
    createProyecto,
    updateProyecto,
    deleteProyecto
};