import jwt from "jsonwebtoken";

// Para rutas que sirven a la vez a la web pública y al admin (GET /api/proyectos): si llega un
// token válido marca la petición como del admin, y si no, sigue como visitante sin dar error.
// No consulta la base: basta la firma para decidir qué filtro aplicar a una lectura.
const authOpcional = (req, res, next) => {
    const authorization = req.headers.authorization
    if (authorization?.startsWith("Bearer ")) {
        try {
            req.esAdmin = Boolean(jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET)?.id)
        } catch {
            req.esAdmin = false
        }
    }
    next()
}

export default authOpcional;
