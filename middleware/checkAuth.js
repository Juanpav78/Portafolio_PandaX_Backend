import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const checkAuth = async (req, res, next)=>{
    const authorization = req.headers.authorization;
    if(!authorization?.startsWith("Bearer ")){
        return res.status(401).json({msg: "Token no valido"})
    }

    try {
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = await Usuario.findById(decoded.id).select(
            "-password -confirmado -token -createdAt -updatedAt -__v");
    } catch {
        // Firma inválida o token caducado (expira a los 30 días)
        return res.status(401).json({msg: "Sesión no válida, inicia sesión de nuevo"})
    }

    // Un token bien firmado de un usuario que ya no existe no debe dar acceso: sin esta
    // comprobación las rutas protegidas recibirían req.usuario = null y seguirían adelante.
    if(!req.usuario){
        return res.status(401).json({msg: "Usuario no encontrado"})
    }

    next();
}

export default checkAuth;
