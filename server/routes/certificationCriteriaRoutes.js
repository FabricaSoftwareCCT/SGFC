const express = require("express")
const { authMiddleware } = require("../middlewares/authMiddleware")
const certificationCriteriaController = require("../controllers/certificationCriteriaController")
const router = express.Router()

router.use(authMiddleware);

// Consultar los criterios de un curso
router.get("/course/:id", certificationCriteriaController.obtenerCriteriosCertificacionCurso)

// Crear criterio de un curso
router.post("/create", certificationCriteriaController.createCriteriosCurso)

// Editar el criterio de un curso
router.put("/update/:id", certificationCriteriaController.updateCriteria)

module.exports = router