import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import { limiteLogin } from "../middleware/limitarIntentos.js";
import { authUsuario, getPerfil } from "../controllers/usuarioController.js";
import {
    createProyecto, updateProyecto, deleteProyecto, getProyecto, destacarProyecto, ordenarDestacados,
} from "../controllers/proyectoController.js";
import {
    services, testimonials, listarProyectos, cambiarPublicado,
    listarMensajes, obtenerMensaje, cambiarEstadoMensaje, eliminarMensaje,
    resumen, cambiarPassword, subirImagen,
} from "../controllers/adminController.js";
import {
    listarClientes, detalleCliente, crearCliente, actualizarCliente, eliminarCliente, clienteDesdeMensaje,
    listarCotizaciones, detalleCotizacion, crearCotizacion, actualizarCotizacion, cambiarEstadoCotizacion, eliminarCotizacion,
} from "../controllers/negocioController.js";

// Panel de administración. Todo lo que hay aquí, salvo el login, exige sesión. Las rutas
// antiguas (/api/proyectos, /api/usuarios) siguen funcionando para no romper lo desplegado.
const router = express.Router();

router.post('/login', limiteLogin, authUsuario)

router.use(checkAuth)

router.get('/perfil', getPerfil)
router.put('/password', cambiarPassword)
router.get('/resumen', resumen)
router.post('/upload', subirImagen)

// Proyectos: el CRUD con imágenes reutiliza el controlador existente (multipart)
router.route('/projects')
    .get(listarProyectos)
    .post(createProyecto)
// Antes de '/:id' para que "orden" no se tome como id
router.put('/projects/orden', ordenarDestacados)
router.route('/projects/:id')
    .get(getProyecto)
    .put(updateProyecto)
    .delete(deleteProyecto)
router.patch('/projects/:id/destacado', destacarProyecto)
router.patch('/projects/:id/publicado', cambiarPublicado('projects'))

// Servicios y testimonios: CRUD JSON estándar
for (const [ruta, crud] of [['services', services], ['testimonials', testimonials]]) {
    router.route(`/${ruta}`).get(crud.listar).post(crud.crear)
    router.route(`/${ruta}/:id`).get(crud.obtener).put(crud.actualizar).delete(crud.eliminar)
    router.patch(`/${ruta}/:id/publicado`, cambiarPublicado(ruta))
}

// Mensajes: no se crean desde el admin, llegan por el formulario de contacto
router.get('/messages', listarMensajes)
router.route('/messages/:id')
    .get(obtenerMensaje)
    .delete(eliminarMensaje)
router.patch('/messages/:id/estado', cambiarEstadoMensaje)
// Convierte el mensaje en cliente (o devuelve el que ya existe con ese correo)
router.post('/messages/:mensajeId/cliente', clienteDesdeMensaje)

// ---------- Negocio ----------
router.route('/clients')
    .get(listarClientes)
    .post(crearCliente)
router.route('/clients/:id')
    .get(detalleCliente)
    .put(actualizarCliente)
    .delete(eliminarCliente)

router.route('/quotes')
    .get(listarCotizaciones)
    .post(crearCotizacion)
router.route('/quotes/:id')
    .get(detalleCotizacion)
    .put(actualizarCotizacion)
    .delete(eliminarCotizacion)
router.patch('/quotes/:id/estado', cambiarEstadoCotizacion)

export default router;
