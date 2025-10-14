const express = require("express")
const { authMiddleware } = require("../middlewares/authMiddleware")
const certificationCriteriaController = require("../controllers/certificationCriteriaController")
const router = express.Router()

router.use(authMiddleware)

// Consultar los criterios de un curso
router.get("/course/:id", certificationCriteriaController.obtenerCriteriosCertificacionCurso)

module.exports = router