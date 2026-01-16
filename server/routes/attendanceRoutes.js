const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const {authMiddleware} = require('../middlewares/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Registrar asistencia para un curso
router.post('/courses/:courseId/register', attendanceController.registerAttendance);

// Actualizar un registro de asistencia específico
router.put('/courses/:courseId/update', attendanceController.updateAttendance);

// Obtener registros de asistencia con filtros
router.get('/courses/:courseId/get', attendanceController.getAttendanceRecords);

module.exports = router; 