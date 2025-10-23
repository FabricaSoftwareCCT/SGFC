const express = require("express")
const { authMiddleware } = require("../middlewares/authMiddleware")
const { obtenerMaterialCurso, crearMaterial } = require("../controllers/materialController")
const router = express.Router()

router.get("/:id", obtenerMaterialCurso)

router.post("/create/:id", authMiddleware, crearMaterial)

module.exports = router