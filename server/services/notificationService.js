const { sendEmail } = require('./emailService');
const { Notificacion, Usuario, Sesion, Curso } = require('../models');
const { format } = require('date-fns');
const { Op } = require('sequelize');

let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
    dbInstance = databaseInstance;
};

/**
 * Envía una notificación por email y la registra en la base de datos
 */
const sendNotification = async (remitenteId, destinatarioId, type, title, message, sessionId = null, courseId = null) => {
    try {
        // Obtener el usuario destinatario
        const user = await dbInstance.Usuario.findByPk(destinatarioId);
        if (!user) {
            throw new Error('Usuario destinatario no encontrado');
        }

        // ✅ Crear el registro con TODOS los campos requeridos
        const notification = await dbInstance.Notificacion.create({
            remitente_ID: remitenteId,        // ✅ Campo requerido
            destinatario_ID: destinatarioId,  // ✅ Campo requerido
            usuario_ID: destinatarioId,       // Si también necesitas este campo
            tipo: type,
            titulo: title,
            mensaje: message,
            sesion_ID: sessionId,
            curso_ID: courseId,
            estado: 'pendiente'
        });

        // Enviar el email
        try {
            await sendEmail(user.email, title, message);
            await notification.update({ estado: 'enviada' });
            return { success: true, notification };
        } catch (emailError) {
            await notification.update({ estado: 'fallida' });
            throw emailError;
        }
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        throw error;
    }
};

/**
 * Envía notificaciones de inasistencia a los usuarios que no asistieron a una sesión
 */
const sendAbsenceNotifications = async (sessionId) => {
    try {
        // Obtener la sesión con información del curso
        const session = await Sesion.findByPk(sessionId, {
            include: [{
                model: Curso,
                attributes: ['ID', 'nombre_curso', 'ficha']
            }]
        });

        if (!session) {
            throw new Error('Sesión no encontrada');
        }

        // Obtener las inasistencias de la sesión
        const absences = await Asistencia.findAll({
            where: {
                sesion_ID: sessionId,
                estado: 'Ausente'
            },
            include: [{
                model: Usuario,
                as: 'aprendiz',
                attributes: ['ID', 'email', 'nombres', 'apellidos']
            }]
        });

        // Enviar notificaciones a cada usuario ausente
        const notifications = await Promise.all(
            absences.map(async (absence) => {
                const user = absence.aprendiz;
                const title = `Inasistencia registrada - ${session.Curso.nombre_curso}`;
                const message = `
                    <h2>Notificación de Inasistencia</h2>
                    <p>Estimado(a) ${user.nombres} ${user.apellidos},</p>
                    <p>Le informamos que se ha registrado una inasistencia en la siguiente sesión:</p>
                    <ul>
                        <li><strong>Curso:</strong> ${session.Curso.nombre_curso}</li>
                        <li><strong>Ficha:</strong> ${session.Curso.ficha}</li>
                        <li><strong>Fecha:</strong> ${new Date(session.fecha).toLocaleDateString()}</li>
                        <li><strong>Hora:</strong> ${session.hora_inicio} - ${session.hora_fin}</li>
                    </ul>
                    <p>Por favor, asegúrese de asistir a las próximas sesiones programadas.</p>
                    <p>Saludos cordiales,<br>SGFC</p>
                `;

                return sendNotification(
                    null,           // ✅ O el ID del sistema/admin que envía
                    user.ID,        // ✅ Destinatario correcto
                    'inasistencia', // ✅ Tipo
                    title,
                    message,
                    sessionId,
                    session.curso_ID
                );
            })
        );

        return {
            success: true,
            notificationsSent: notifications.length,
            notifications
        };
    } catch (error) {
        console.error('Error al enviar notificaciones de inasistencia:', error);
        throw error;
    }
};

module.exports = {
    setDb,
    sendNotification,
    sendAbsenceNotifications
}; 