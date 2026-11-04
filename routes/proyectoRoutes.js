import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import authOpcional from "../middleware/authOpcional.js";
import {getProyectos,
    getProyecto,
    createProyecto,
    updateProyecto,
    deleteProyecto,
    destacarProyecto,
    ordenarDestacados} from "../controllers/proyectoController.js"

const router = express.Router();

router.route('/')
        .get(authOpcional, getProyectos)
        .post(checkAuth, createProyecto)

// Debe ir antes de '/:id': si no, Express tomaría "orden" como si fuera el id de un proyecto
router.put('/orden', checkAuth, ordenarDestacados)

router.route('/:id')
        .get(checkAuth, getProyecto)
        .put(checkAuth, updateProyecto)
        .delete(checkAuth, deleteProyecto);

router.patch('/:id/destacado', checkAuth, destacarProyecto)

export default router;
