const express = require("express")
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware")
const certificationCriteriaController = require("../controllers/certificationCriteriaController")
const router = express.Router()

router.use(authMiddleware);

// Consultar los criterios de un curso
router.get("/course/:id", certificationCriteriaController.obtenerCriteriosCertificacionCurso)

// Crear criterio de un curso
router.post("/create", certificationCriteriaController.createCriteriosCurso)

// Editar el criterio de un curso
router.put("/update/:id", certificationCriteriaController.updateCriteria)

// Ver los criterios de un aprendiz
router.get("/course/:course/aprendiz/:id", authorizeRoles(['Administrador', 'Gestor', "Instructor", "Empresa"]), certificationCriteriaController.getAprenticeCriteria)

// Actualizar el estado de la certificación del aprendiz
router.put("/course/:course/update/:id", certificationCriteriaController.updateAprenticeCertificationStatus)

module.exports = router