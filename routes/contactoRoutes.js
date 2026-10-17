import express from "express";
import { enviarContacto } from "../controllers/contactoController.js";
import { limiteContacto } from "../middleware/limitarIntentos.js";

const router = express.Router();

// Ruta pública (la usa cualquier visitante), protegida con límite de envíos por IP
router.post('/', limiteContacto, enviarContacto)

export default router;
