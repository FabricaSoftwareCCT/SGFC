const express = require("express");
const router = express.Router();
const cursoController = require("../controllers/cursoController");
const {authMiddleware} = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const { crearOActualizarInscripcion } = require('../controllers/inscripcionCursoController');
// filepath: [userRoutes.js](http://_vscodecontentref_/2)

// Rutas públicas (no requieren autenticación)
router.get("/cursos", cursoController.getAllCursos);
router.get('/searchCurso', cursoController.getCursoByNameOrFicha)
router.get("/cursos/:id", cursoController.getCursoById); // Obtener curso por ID
router.get('/empresa/:empresaId', cursoController.getCursosByEmpresaId);
// Asignar curso a instructor
router.post('/asignaciones', cursoController.asignarInstructorAlCurso);

// Disponibilidad de instructor
router.get('/instructores/:instructor_ID/disponibilidad', cursoController.verificarDisponibilidadInstructor);


//ruta que requieren autorizacion
router.use(authMiddleware);

router.post("/cursos", upload.single("imagen"), cursoController.createCurso);

// Actualizar un curso
router.put("/cursos/:id", upload.single("imagen"), cursoController.updateCurso);

// Obtener cursos asignados a un instructor
router.get('/cursos-asignados/:instructor_ID', cursoController.obtenerCursosAsignadosAInstructor);

// Obtener participantes de un curso
router.get('/cursos/:courseId/participants', cursoController.getCursoParticipants);

// Ruta para crear o actualizar el estado de una inscripción (solo administradores)
router.put('/inscripciones', crearOActualizarInscripcion);

//enviar invitacion de curso a instructor
router.post('/enviarInvitacionCursoInstructor', cursoController.enviarInvitacionCurso);

// cambiar el estado de la invitacion a un curso (instructor)
router.put('/cambiarEstadoInvitacion/:invitacionId', cursoController.cambiarEstadoInvitacion);

module.exports = router;