import generateId from "../helpers/generateId.js";
import generateJWT from "../helpers/generateJWT.js";
import Usuario from "../models/Usuario.js"
import { confirmarUsuario, recuperarPassword} from "../helpers/email.js"

const createUsuario =  async (req, res)=>{
    // El panel es de un solo administrador: cualquier cuenta confirmada puede editar y borrar
    // proyectos, así que el registro queda cerrado salvo que se active a propósito en el .env
    // (p. ej. para recrear la cuenta si se pierde el acceso).
    if(process.env.REGISTRO_ABIERTO !== 'true'){
        return res.status(403).json({msg: "El registro de nuevas cuentas está cerrado"});
    }

    const {nombre, email, password} = req.body;
    const isUser = await Usuario.findOne({email});

    if(isUser){
        const error = new Error('Usuario ya registrado');
        return res.status(400).json({msg:error.message});
    }
    try {
        // Sólo se toman los campos esperados: pasar req.body completo permitiría enviar
        // { confirmado: true } y saltarse la verificación por email.
        const usuario = new Usuario({nombre, email, password});
        usuario.token = generateId();
        await usuario.save();

        await confirmarUsuario({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        res.json({msg: "Usuario creado correctamente, revisa tu email para confirmarla"})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "No se pudo crear la cuenta"})
    }
   
};

const authUsuario =  async (req, res)=>{
     const {email, password} =req.body;

    //comprobar si el usuario existe
    const usuario = await Usuario.findOne({email});
    if(!usuario){
        const error = new Error('Usuario no existe');
        return res.status(404).json({msg:error.message});
    }
    //comprobar si el usuario esta confirmado
    if(!usuario.confirmado){
        const error = new Error('Cuenta no confirmada');
        return res.status(403).json({msg:error.message});
    }
    //comprobar password
   if (await usuario.comprobarPassword(password)){
        res.json({
            _id     :  usuario._id,
            nombre  :  usuario.nombre,
            email   :  usuario.email,
            rol     :  usuario.rol ?? 'admin',
            token   :  generateJWT(usuario._id),
        })
   }else{
        const error = new Error('El password es incorrecto');
        return res.status(403).json({msg:error.message});
   }
};

const confirmUsuario = async (req, res)=>{
    const {token} = req.params;
    const usuario = await Usuario.findOne({token});

    //comprobar si el usuario tiene token
    if(!usuario){
        const error = new Error('Token no valido');
        return res.status(404).json({msg:error.message});
    }

    try {
        usuario.confirmado = true;
        usuario.token      = "";
        await usuario.save();
        res.json({msg: "Usuario Confirmado Correctamente"})
    } catch (error) {
        console.log(error);
    }
};

const resetPassword = async (req, res)=>{
    const {email} =req.body;

    //comprobar si el usuario existe
    const usuario = await Usuario.findOne({email});
    if(!usuario){
        const error = new Error('Usuario no existe');
        return res.status(404).json({msg:error.message});
    }

    try {
        usuario.token = generateId();
        await usuario.save();
        // Se espera al envío: sin await, un fallo del SMTP quedaba como promesa rechazada sin
        // manejar (que en Node tumba el proceso) y además se respondía "enviado" sin serlo.
        await recuperarPassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        res.json({msg:"Se ha enviado un email para restablecer el password"})
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "No se pudo enviar el correo, inténtalo más tarde"})
    }
   
};

const confirmToken = async (req, res)=>{
    const {token} = req.params;
    const usuario = await Usuario.findOne({token});

    if(usuario){
        res.json({msg: "Token valido y el usuario existe"})
    }else{
        const error = new Error("token no valido");
        return res.status(404).json({msg:error.message});
    }
}

const newPassword = async (req, res)=>{
    const {token} = req.params;
    const {password} = req.body;
    const usuario = await Usuario.findOne({token});

    if(usuario){
        usuario.password = password;
        usuario.token = "";
        try {
            await usuario.save()
            res.json({msg: "Password cambiado de forma exitosa"})
        } catch (error) {
            console.log(error)
        }
        
    }else{
        const error = new Error("usuario no valido");
        return res.status(404).json({msg:error.message});
    }
}

const getPerfil = (req, res)=>{
    const {usuario} = req;
    res.json(usuario)
};


export{
    createUsuario,
    authUsuario,
    confirmUsuario,
    resetPassword,
    confirmToken,
    newPassword,
    getPerfil
};