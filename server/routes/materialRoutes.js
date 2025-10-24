const express = require("express")
const { authMiddleware } = require("../middlewares/authMiddleware")
const { obtenerMaterialCurso, crearMaterial, actualizarMaterial, eliminarMaterial } = require("../controllers/materialController")
const upload = require("../config/multer")
const router = express.Router()

router.get("/:id", obtenerMaterialCurso)

router.post(
	"/create/:id", 
	authMiddleware, 
	upload.fields([
		{
			name: "document_pdf",
			maxCount: 1,
		},
		{
			name: "video",
			maxCount: 1
		}
	]), 
	crearMaterial
)

router.put("/update/:id", authMiddleware, actualizarMaterial)

router.delete("/delete/:id", authMiddleware, eliminarMaterial)

module.exports = router