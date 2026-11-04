import express from "express";
import { getServices, getProjects, getProjectBySlug, getTestimonials, postContact } from "../controllers/publicController.js";
import { limiteContacto } from "../middleware/limitarIntentos.js";

// Rutas públicas con los nombres que espera PandaX Code (src/api/endpoints.js). Todas aceptan
// ?site=code|portafolio y sólo devuelven contenido publicado.
const router = express.Router();

router.get('/services', getServices)
router.get('/projects', getProjects)
router.get('/projects/:slug', getProjectBySlug)
router.get('/testimonials', getTestimonials)
router.post('/contact', limiteContacto, postContact)

export default router;
