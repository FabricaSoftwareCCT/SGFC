const Notificacion = require('../models/Notificacion');
const User = require("../models/User");
const { sendNotification, sendAbsenceNotifications } = require('../services/notificationService');
let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
    dbInstance = databaseInstance;
};

/**
 * Obtiene las notificaciones de un usuario
 */
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, type } = req.query;

        const whereClause = { destinatario_ID: userId }; if (type) {
            whereClause.tipo = type;
        }

        const offset = (page - 1) * limit;

        const { count, rows: notifications } = await dbInstance.Notificacion.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: dbInstance.Usuario,
                    as: 'remitente',
                    attributes: ['ID', 'nombres', 'apellidos', 'email']
                }
            ],
            order: [['fecha_envio', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            success: true,
            notifications,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las notificaciones'
        });
    }
};

/**
 * Marca una notificación como leída
 */
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await dbInstance.Notificacion.findOne({
            where: {
                ID: notificationId,
                usuario_ID: userId
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada'
            });
        }

        await notification.update({ estado: 'leida' });

        res.status(200).json({
            success: true,
            message: 'Notificación marcada como leída'
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la notificación'
        });
    }
};

/**
 * Envía una notificación de inasistencia manualmente
 */
const sendManualAbsenceNotification = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const instructorId = req.user.id;

        // Obtener el registro de asistencia
        const attendance = await dbInstance.Asistencia.findOne({
            where: {
                ID: attendanceId,
                estado: 'Ausente'
            },
            include: [
                {
                    model: dbInstance.Usuario,
                    as: 'aprendiz',
                    attributes: ['ID', 'nombres', 'apellidos', 'email']
                }
            ]
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Registro de asistencia no encontrado o no es una ausencia'
            });
        }

        const title = `Notificación de Inasistencia`;
        const message = `
            <h2>Notificación de Inasistencia</h2>
            <p>Estimado(a) ${attendance.aprendiz.nombres} ${attendance.aprendiz.apellidos},</p>
            <p>Le informamos que se ha registrado una inasistencia en la fecha ${new Date(attendance.fecha).toLocaleDateString()}.</p>
            <p>Por favor, asegúrese de asistir a las próximas sesiones programadas.</p>
            <p>Saludos cordiales,<br>SGFC</p>
        `;

        await sendNotification(
            attendance.aprendiz.ID,
            'inasistencia',
            title,
            message
        );

        res.status(200).json({
            success: true,
            message: 'Notificación de inasistencia enviada correctamente'
        });
    } catch (error) {
        console.error('Error al enviar notificación manualmente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar la notificación'
        });
    }
};

/**
 * Crea notificaciones de solicitud de curso para administradores y gestores
 */
const crearNotificacionSolicitudCurso = async (req, res) => {
    try {
        const { asunto, mensaje, archivo } = req.body;
        // El remitente es el usuario autenticado (empresa)
        const remitente_ID = req.user.id;

        // Busca todos los usuarios tipo 'Administrador' y 'Gestor'
        const destinatarios = await User.findAll({
            where: {
                accountType: ['Administrador', 'Gestor']
            }
        });

        // Crea una notificación para cada destinatario
        const notificaciones = [];
        for (const destinatario of destinatarios) {
            const notificacion = await Notificacion.create({
                remitente_ID, // ID del usuario empresa que envía la solicitud
                destinatario_ID: destinatario.ID, // ID del admin/gestor que recibe
                tipo: 'solicitud_curso',
                titulo: asunto,
                mensaje,
                fecha_envio: new Date(),
                estado: 'sin_leer',
                archivo // nombre o ruta del PDF
            });
            notificaciones.push(notificacion);
        }

        res.status(201).json({
            success: true,
            message: 'Notificaciones de solicitud de curso creadas correctamente',
            notificaciones
        });
    } catch (error) {
        console.error('Error al crear notificaciones de solicitud de curso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear las notificaciones'
        });
    }
};

/**
 * Crea notificaciones de invitacion a dictar curso para instructores
 */
const crearNotificacionInvitacionCursoInstructor = async (req, res) => {
    try {
        const { remitente_ID, destinatario_ID, curso_ID, invitacion_ID } = req.body;
        if (!remitente_ID || !destinatario_ID || !curso_ID || !invitacion_ID) {
            return res.status(400).json({ message: 'Faltan datos requeridos.' });
        }

        // Busca el curso para el nombre (opcional)
        let cursoNombre = 'Curso';
        if (dbInstance && dbInstance.Curso) {
            const curso = await dbInstance.Curso.findByPk(curso_ID);
            if (curso && curso.nombre_curso) {
                cursoNombre = curso.nombre_curso;
            }
        }

        const titulo = "Invitación Curso";
        const mensaje = `
            <p>Has recibido una invitación para dictar el curso: <strong>${cursoNombre}</strong>.</p>
            <br><p>Por favor, acepta o rechaza la invitación.</p>
        `;

        const notificacion = await dbInstance.Notificacion.create({
            remitente_ID,
            destinatario_ID,
            tipo: 'invitacion_cursoInstructor',
            titulo,
            mensaje,
            fecha_envio: new Date(),
            estado: 'sin_leer',
            curso_ID,
            invitacion_ID // <-- Guardar el ID de la invitación
        });

        res.status(201).json({
            success: true,
            message: 'Notificación creada correctamente',
            notificacion
        });
    } catch (error) {
        console.error('Error al crear notificación de invitación:', error);
        res.status(500).json({ message: 'Error al crear la notificación' });
    }
};

module.exports = {
    setDb,
    getUserNotifications,
    markNotificationAsRead,
    sendManualAbsenceNotification,
    crearNotificacionSolicitudCurso,
    crearNotificacionInvitacionCursoInstructor
}; 