import express from "express";
import checkAuth from "../middleware/checkAuth.js";
const router = express.Router();

import { createUsuario, authUsuario,
     confirmUsuario, resetPassword,
     confirmToken, newPassword,
     getPerfil,
     } from "../controllers/usuarioController.js";


//Autenticacion, Registro y Confirmación
router.post('/', createUsuario);
router.post('/login', authUsuario);
router.get('/confirmar/:token', confirmUsuario);
router.post('/recover-password', resetPassword);
router.route('/recover-password/:token')
        .get(confirmToken)
        .post(newPassword);

router.get('/perfil', checkAuth, getPerfil);
export default router;