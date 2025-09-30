const { sendEmail } = require('./emailService');
const User = require("../models/User");
const Curso = require('../models/curso');
const Actas = require('../models/Actas');
const { Notificacion,  Sesion } = require('../models');
const { format } = require('date-fns');
const { Op, where } = require('sequelize');

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

// enviar correo de confirmacion de estado de solicitud de curso
const sendCourseRequestStatusEmail = async (userId, actaID) => {
    try {
        const user = await User.findByPk(userId);

        const acta = await Actas.findByPk(actaID);
        
        if (!user || !acta) {
            throw new Error('Usuario o estado no encontrado');
        }
        const fechaActa = format(new Date(acta.dataValues.fecha_acta), 'dd/MM/yyyy');
        
        const title = `Estado de su solicitud - ${acta.dataValues.estado_acta}`;
        const message = `
            <h2>Notificación de Estado de Solicitud</h2>
            <p>Estimado(a) ${user.nombres} ${user.apellidos},</p>
            <p>Le informamos que el estado de su solicitud para el curso <strong>${acta.dataValues.curso_ID}</strong> es: <strong>${acta.dataValues.estado_acta}</strong>.</p>
            <p>Detalles del acta:</p>
            <ul>
                <li><strong>Fecha del Acta:</strong> ${fechaActa}</li>
            </ul>
            <p>Por favor, no dude en contactarnos si tiene alguna pregunta.</p>
            <p>Saludos cordiales,<br>SGFC</p>
        `;

        sendEmail(user.email, title, message);
    } catch (error) {
        console.error('Error al enviar correo de confirmación de estado de solicitud de curso:', error);
        throw error;
    }
};

// Crear notificacion a todos los usuario sobre un nuevo curso creado
const sendNotifiCursoApi = async (curso, emails, fecha_inicio, fecha_fin, estado) => {
    //consultar el id de lo usuario por email
    try {
        const users = await dbInstance.Usuario.findAll({
            where: {
                email: {
                    [Op.in]: emails
                }
            }
        });
        const userIds = users.map(async user => {
            const title = `Nuevo curso disponible - ${curso}`;
            const message = `
            Notificación de Nuevo Curso
            Estimado(a) ${user.nombres} ${user.apellidos}, Nos complace informarle que un nuevo curso ha sido creado y está disponible para inscripción:
            <br>
            <br>
            Curso: ${curso}
            <br>
            Tipo de estado: ${estado}
            <br>
            <br>
            Fecha de Inicio: ${new Date(fecha_inicio).toLocaleDateString()}
            <br>
            <br>
            Fecha de Fin: ${new Date(fecha_fin).toLocaleDateString()}
            <br>
            <br>
            Le invitamos a inscribirse lo antes posible para asegurar su lugar.
            <br>
            <br>
            Saludos cordiales, SGFC
        `;
       const notificacion = await dbInstance.Notificacion.create({
            remitente_ID: 1,
            destinatario_ID: user.ID,
            tipo: 'nuevo_curso',
            titulo: title,
            mensaje: message,
            fecha_envio: new Date(),
            estado: 'pendiente'
        });
        await notificacion.save();
       });
        await Promise.all(userIds);
        return { success: true, message: 'Notificaciones creadas en la base de datos' };
    } catch (error) {
        console.error('Error al enviar notificaciones de nuevo curso:', error);
        throw error;
    }
};

// consultar por invitacion_ID y quitarla si esta rechazada o aceptada
const getNotificacionesEstado = async (invitaciones) => {
    try {
        const resultados = await Promise.all(
            invitaciones.map(async (inv) => {

                if (!inv.invitacion_ID) {
                    return inv;
                }

                // Consultamos en BD
                const invitacionRecord = await dbInstance.InvitacionCurso.findByPk(inv.invitacion_ID);

                if (invitacionRecord) {
                    const estado = invitacionRecord.estado; // 'aceptada', 'rechazada', 'pendiente'

                    if (estado === 'aceptada' || estado === 'rechazada') {
                        await dbInstance.Notificacion.destroy({
                            where: { id: inv.ID }
                        });
                        return null; // la quitamos
                    }
                }


                return inv;
            })
        );

        const invitacionesFiltradas = resultados.filter(inv => inv !== null);

        return invitacionesFiltradas;
    } catch (error) {
        console.error('Error al consultar estado de asignación a curso:', error);
        throw error;
    }
};


module.exports = {
    setDb,
    sendNotification,
    sendAbsenceNotifications,
    sendCourseRequestStatusEmail,
    sendNotifiCursoApi,
    getNotificacionesEstado
}; 