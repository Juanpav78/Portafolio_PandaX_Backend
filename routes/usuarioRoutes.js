import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import { limiteCorreos, limiteLogin } from "../middleware/limitarIntentos.js";
const router = express.Router();

import { createUsuario, authUsuario,
     confirmUsuario, resetPassword,
     confirmToken, newPassword,
     getPerfil,
     } from "../controllers/usuarioController.js";


//Autenticacion, Registro y Confirmación
router.post('/', limiteCorreos, createUsuario);
router.post('/login', limiteLogin, authUsuario);
router.get('/confirmar/:token', confirmUsuario);
router.post('/recover-password', limiteCorreos, resetPassword);
router.route('/recover-password/:token')
        .get(confirmToken)
        .post(limiteLogin, newPassword);

router.get('/perfil', checkAuth, getPerfil);
export default router;
