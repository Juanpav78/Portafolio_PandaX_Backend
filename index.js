import express from "express";
import os from "node:os";
import conectarDB from "./config/db.js";
import usuarioRouter from "./routes/usuarioRoutes.js";
import proyectoRouter from "./routes/proyectoRoutes.js";
import planRouter from "./routes/planRoutes.js";
import contactoRouter from "./routes/contactoRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import cors from "cors"
import helmet from "helmet";
import fileupload from "express-fileupload";
import { corsOrigins } from "./config/env.js";

const app = express();

// Render pone un proxy delante de la app: sin esto todas las peticiones parecerían venir de la
// IP del proxy y el límite de intentos de login bloquearía a todos los visitantes a la vez.
app.set('trust proxy', 1);

// Cabeceras de seguridad estándar. La API la consumen otros dominios (portafolio y PandaX Code),
// por eso la política de recursos se abre a cross-origin; el control de acceso real lo hace CORS.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));


app.use(
    fileupload({
        useTempFiles: true,
        tempFileDir: os.tmpdir(),
        createParentPath: true,
        // Corta en el servidor archivos enormes aunque alguien se salte la validación del
        // frontend (2 MB); el margen extra cubre PNG grandes que el navegador no comprime.
        limits: { fileSize: 5 * 1024 * 1024 },
        abortOnLimit: true,
        responseOnLimit: JSON.stringify({ msg: "La imagen supera el tamaño máximo de 5 MB" }),
    }),
);

app.use(express.json());

// En Express 5 req.body queda undefined si la petición no trae un cuerpo que algún parser
// entienda (p. ej. un multipart sólo con archivos o un PATCH vacío). Normalizarlo a {} evita
// que cada controlador tenga que protegerse de `req.body.campo` lanzando un TypeError.
app.use((req, res, next) => {
    req.body ??= {};
    next();
});

// Endpoint de salud: no toca la base de datos para responder rápido. Lo usa el ping periódico
// (GitHub Actions) que evita que Render duerma el servicio por inactividad.
app.get('/api/salud', (req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 4000;
conectarDB();

//Configuracion del Cors
// CORS_ORIGINS (o FRONTEND_URL) admite varios orígenes separados por coma: admin, portafolio y PandaX Code
const whiteList = corsOrigins()

const corsOptions = {

    origin: function(origin, callback){

        // Las peticiones sin origin (health checks, Postman, servidor a servidor) no pasan por CORS
        if(!origin || whiteList.includes(origin)){
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
app.use('/api/planes', planRouter)
app.use('/api/contacto', contactoRouter)
// Panel de administración (protegido con JWT salvo el login)
app.use('/api/admin', adminRouter)
// Rutas públicas compartidas (PandaX Code y portafolio): /api/services, /api/projects…
app.use('/api', publicRouter)

app.listen(PORT , ()=>{
    console.log(`Servidor Corriendo en ${PORT}`)
});
