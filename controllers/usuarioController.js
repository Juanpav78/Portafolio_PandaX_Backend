import generateId from "../helpers/generateId.js";
import generateJWT from "../helpers/generateJWT.js";
import Usuario from "../models/Usuario.js"

const usuarios = (req, res)=>{
    res.json({msg: "desde api/usuarios"})
};

const createUsuario =  async (req, res)=>{
    const {email} =req.body;
    const isUser = await Usuario.findOne({email});

    if(isUser){
        const error = new Error('Usuario ya registrado');
        return res.status(400).json({msg:error.message});
    }
    try {
        const usuario = new Usuario(req.body);
        usuario.token = generateId();
        const savedUsuario = await usuario.save();
        res.json({msg: "creando usuarios"})
    } catch (error) {
        console.log(error);
        res.json({msg: "error"})
    }
   
};

const authUsuario =  async (req, res)=>{
     const {email} =req.body;

    //comprobar si el usuario existe
    const isUser = await Usuario.findOne({email});
    if(!isUser){
        const error = new Error('Usuario no existe');
        return res.status(404).json({msg:error.message});
    }
    //comprobar si el usuario esta confirmado
    if(!isUser.confirmado){
        const error = new Error('Cuenta no confirmada');
        return res.status(403).json({msg:error.message});
    }
    //comprobar password
   if (await isUser.comprobarPassword){
        res.json({
            _id     :  isUser._id,
            nombre  :  isUser.nombre,
            email   :  isUser.email,
            token   :  generateJWT(isUser._id),
        })
   }else{
        const error = new Error('El password es incorrecto');
        return res.status(403).json({msg:error.message});
   }
};

const confirmUsuario = async (req, res)=>{
    const {token} = req.params;
    const isUser = await Usuario.findOne({token});

    //comprobar si el usuario tiene token
    if(!isUser){
        const error = new Error('Token no valido');
        return res.status(404).json({msg:error.message});
    }

    try {
        isUser.confirmado = true;
        isUser.token      = "";
        await isUser.save();
        res.json({msg: "Usuario Confirmado Correctamente"})
    } catch (error) {
        console.log(error);
    }
};

const resetPassword = async (req, res)=>{
    const {email} =req.body;

    //comprobar si el usuario existe
    const isUser = await Usuario.findOne({email});
    if(!isUser){
        const error = new Error('Usuario no existe');
        return res.status(404).json({msg:error.message});
    }

    try {
        isUser.token = generateId();
        await isUser.save();
        res.json({msg:"Se ha enviado un email para restablecer el password"})
    } catch (error) {
        console.log(error);
    }
   
};

const confirmToken = async (req, res)=>{
    const {token} = req.params;
    const isToken = await Usuario.findOne({token});

    if(isToken){

    }else{
        
    }
}

export{
    usuarios,
    createUsuario,
    authUsuario,
    confirmUsuario,
    resetPassword,
    confirmToken
};