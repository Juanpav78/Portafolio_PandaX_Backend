import express from "express";
const router = express.Router();

import { createUsuario, authUsuario,
     confirmUsuario, resetPassword,
     confirmToken
     } from "../controllers/usuarioController.js";

//Autenticacion, Registro y Confirmación
router.post('/', createUsuario);
router.post('/login', authUsuario);
router.get('/confirmar/:token', confirmUsuario);
router.post('/recover-password', resetPassword);
router.get('/recover-password/:token', confirmToken);
export default router;