const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const {authMiddleware} = require('../middlewares/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Obtener notificaciones del usuario
router.get('/', notificationController.getUserNotifications);

// Marcar una notificación como leída
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

// Enviar notificaciones de inasistencia manualmente (solo instructores)
router.post('/attendance/:attendanceId/absence-notifications', notificationController.sendManualAbsenceNotification);

// Crear notificaciones de solicitud de curso para administradores y gestores
router.post('/solicitud-curso', notificationController.crearNotificacionSolicitudCurso);

// Crear notificaciones de invitación a dictar curso para instructores
router.post('/invitacionCursoInstructor', notificationController.crearNotificacionInvitacionCursoInstructor);

// Crear notificación de estado de solicitud de curso (aceptada/rechazada) para empresa
router.post('/solicitudNotificacion', notificationController.createCourseRequestStatusNotification);

// Crear notificacion de material de apoyo subido para aprendices
router.post('/materialApoyo', notificationController.crearNotificacionMaterialApoyo);


module.exports = router; 