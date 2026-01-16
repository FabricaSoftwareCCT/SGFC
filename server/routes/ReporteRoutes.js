const express = require("express");
const router = express.Router();
const { reporteMiddleware } = require("../middlewares/reporteMiddleware");
const { ReporteController } = require("../controllers/ReporteController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/authMiddleware");

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

router.get("/generarReporte", reporteMiddleware, ReporteController.Searchreport);  
router.get("/reporteEficiencia", ReporteController.ReporteEficiencia);
router.get("/ObtenerCursos/admin/:page", ReporteController.GetCursosReporte );

router.get(
    "/asistencia-progreso",
    authorizeRoles(['Administrador', 'Instructor', 'Gestor']),
    ReporteController.GetAttendanceProgressReport
);

// Endpoints para filtrado dinámico
router.get(
    "/courses-by-learner",
    authorizeRoles(['Administrador', 'Instructor', 'Gestor']),
    ReporteController.GetCoursesByLearner
);

router.get(
    "/learners-by-course",
    authorizeRoles(['Administrador', 'Instructor', 'Gestor']),
    ReporteController.GetLearnersByCourse
);

module.exports = router;