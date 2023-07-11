import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const checkAuth = async (req, res, next)=>{
    const authorization = req.headers.authorization;
    const bearer = authorization?.startsWith("Bearer")
    let token;
    if (authorization && bearer){
        try {
            token = authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.usuario = await Usuario.findById(decoded.id).select(
                "-password -confirmado -token -createdAt -updatedAt -__v");

            return next();
        } catch (error) {
            return res.status(404).json({msg: "hubo un error"})
        }
    }
    if(!token){
        const error = new Error('Token no valido')
        return res.status(401).json({msg:error.message})
    }
    next();
}

export default checkAuth;