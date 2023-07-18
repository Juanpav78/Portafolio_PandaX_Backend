import express from "express";
import dotenv from "dotenv";
import conectarDB from "./config/db.js";
import usuarioRouter from "./routes/usuarioRoutes.js";
import proyectoRouter from "./routes/proyectoRoutes.js";
import cors from "cors"
import fileupload from "express-fileupload";

const app = express();


app.use(
    fileupload({
        useTempFiles: true,
        tempFileDir: '/tmp/',
        createParentPath: true,
    }),
);
  
dotenv.config();
app.use(express.json());
const PORT = process.env.PORT || 4000;
conectarDB();

//Configuracion del Cors

const whiteList = [process.env.FRONTEND_URL
]

const corsOptions = {

    origin: function(origin, callback){
        console.log(origin)
        console.log(process.env.FRONTEND_URL)
        if(whiteList.includes(origin)){
            // puede consultar la api
            callback(null, true)
        }else{
            // no puede consultar la api
            callback(new Error("Error de cors"))
        }
    }
}

app.use(cors(corsOptions));
//Routing
app.use('/api/usuarios', usuarioRouter)
app.use('/api/proyectos', proyectoRouter)

app.listen(PORT , ()=>{
    console.log(`Servidor Corriendo en ${PORT}`)
});