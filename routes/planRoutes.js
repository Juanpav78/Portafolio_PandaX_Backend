import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import {
    getPlanes, createPlan, updatePlan, deletePlan,
    addTarea, updateTarea, deleteTarea,
} from "../controllers/planController.js";

const router = express.Router();

// El planificador es privado: todas sus rutas requieren sesión
router.use(checkAuth)

router.route('/')
        .get(getPlanes)
        .post(createPlan)

router.route('/:id')
        .put(updatePlan)
        .delete(deletePlan)

router.post('/:id/tareas', addTarea)
router.route('/:id/tareas/:tareaId')
        .put(updateTarea)
        .delete(deleteTarea)

export default router;
