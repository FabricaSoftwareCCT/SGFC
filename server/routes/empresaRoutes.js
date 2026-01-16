const express = require("express")
const router = express.Router()
const upload = require("../config/multer")
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware")
const { ActualizarEmpresa } = require("../controllers/empresaController")

router.put(
	"/actualizar/:id",
	authMiddleware,
	authorizeRoles(['Administrador']),
	upload.fields([
		{ name: 'img_empresa', maxCount: 1 }
	]),
	ActualizarEmpresa
)

module.exports = router
