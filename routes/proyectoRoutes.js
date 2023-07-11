import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import {getProyectos,
    getProyecto,
    createProyecto,
    updateProyecto,
    deleteProyecto} from "../controllers/proyectoController.js"

const router = express.Router();

router.route('/')
        .get(getProyectos)
        .post(checkAuth, createProyecto)

router.route('/:id')
        .get(checkAuth, getProyecto)
        .put(checkAuth, updateProyecto)
        .delete(checkAuth, deleteProyecto);


export default router;