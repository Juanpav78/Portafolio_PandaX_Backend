import express from "express";
import dotenv from "dotenv";
import conectarDB from "./config/db.js";
import usuarioRouter from "./routes/usuarioRoutes.js";
import proyectoRouter from "./routes/usuarioRoutes.js";
const app = express();

dotenv.config();
app.use(express.json());
const PORT = process.env.PORT || 4000;

//Routing
app.use('/api/usuarios', usuarioRouter)
app.use('/api/proyectos', proyectoRouter)
conectarDB();
app.listen(PORT , ()=>{
    console.log(`Servidor Corriendo en ${PORT}`)
});