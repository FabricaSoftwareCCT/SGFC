const { sendEmail, sendProfileUpdateEmail } = require("./emailService");
const User = require("../models/User");
const Curso = require("../models/curso");
const Actas = require("../models/Actas");
const { Notificacion, Sesion } = require("../models");
const { format } = require("date-fns");
const { Op, where } = require("sequelize");
const { BACKEND_URL } = require("../config/env");

// URL del logo para notificaciones en el navegador
const LOGO_URL = `${BACKEND_URL}/img/sena.png`;

let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

const formatDateTime = (value) => {
	if (!value) {
		return "Sin definir";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Sin definir";
	}
	return date.toLocaleString("es-CO", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const buildListHtml = (items) =>
	items
		.filter((item) => item?.label && item?.value !== undefined && item?.value !== null)
		.map(
			(item) =>
				`<li style="margin: 0.25rem 0;"><strong>${item.label}:</strong> ${item.value}</li>`
		)
		.join("");

const wrapEmailLayout = ({ title, content }) => `
<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="${LOGO_URL}" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">${title}</h1>
                </td>
              </tr>
            </table>
            <div style="padding:1.25rem 0; line-height:1.65; color:#1A1A1A; font-size:1rem;">
              ${content}
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-top:1.25rem; border-top:.0625rem solid #eee; font-size:.75rem; color:#777;">
                  <p style="margin:0;">Copyright © 2025 Fábrica de Software CCT - Regional Quindío</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

const buildActivityMessage = ({
	heading,
	intro,
	activity,
	courseName,
	extraRows = [],
}) => {
	const details = [
		{ label: "Curso", value: courseName || "Sin nombre" },
		{ label: "Título", value: activity?.titulo || "Sin título" },
		{
			label: "Descripción",
			value: activity?.descripcion || "Sin descripción registrada",
		},
		{
			label: "Fecha de publicación",
			value: formatDateTime(activity?.fecha_publicacion),
		},
		{ label: "Fecha límite", value: formatDateTime(activity?.fecha_limite) },
		...extraRows,
	];

	const body = `
		<p style="margin-bottom:1.25rem;">${intro}</p>
		<div style="background:#f7fafc; border:1px solid rgba(15,118,110,0.18); border-radius:.75rem; padding:1rem 1.25rem; margin-bottom:1.25rem;">
			<h3 style="margin:0 0 .65rem 0; font-size:.9rem; text-transform:uppercase; letter-spacing:.08em; color:#0f766e;">Resumen de la actividad</h3>
			<ul style="padding-left:1.2rem; margin:0; color:#1f2933; line-height:1.7;">
				${buildListHtml(details)}
			</ul>
		</div>
		<p style="margin:0;">Ingresa a SGFC para revisar todos los detalles y realizar el seguimiento correspondiente.</p>
	`;

	return wrapEmailLayout({
		title: heading,
		content: body,
	});
};

/**
 * Envía una notificación por email y la registra en la base de datos
 */
const sendNotification = async (
	remitenteId,
	destinatarioId,
	type,
	title,
	message,
	sessionId = null,
	courseId = null
) => {
	try {
		// Obtener el usuario destinatario
		const user = await dbInstance.Usuario.findByPk(destinatarioId);
		if (!user) {
			throw new Error("Usuario destinatario no encontrado");
		}

		// ✅ Crear el registro con TODOS los campos requeridos
		const notification = await dbInstance.Notificacion.create({
			remitente_ID: remitenteId,
			destinatario_ID: destinatarioId,
			usuario_ID: destinatarioId,
			tipo: type,
			titulo: title,
			mensaje: message,
			sesion_ID: sessionId,
			curso_ID: courseId,
			estado: "pendiente",
			fecha_envio: new Date(),
		});

		// Enviar el email (best-effort)
		try {
			await sendEmail(user.email, title, message);
			await notification.update({ estado: "enviada" });
			return { success: true, notification };
		} catch (emailError) {
			await notification.update({ estado: "fallida" });
			console.warn(
				"No se pudo enviar el correo de notificación; la notificación in-app permanece registrada.",
				{ destinatarioId, email: user.email, error: emailError?.message }
			);
			return { success: false, notification, error: emailError };
		}
	} catch (error) {
		console.error("Error al enviar notificación:", error);
		return { success: false, error };
	}
};

const notifyBulk = async ({
	remitenteId = 1,
	destinatarioIds = [],
	type = "actividad",
	title,
	message,
	courseId = null,
}) => {
	const uniqueRecipients = [
		...new Set(
			(destinatarioIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id))
		),
	];

	if (uniqueRecipients.length === 0) {
		return;
	}

	await Promise.all(
		uniqueRecipients.map((destId) =>
			sendNotification(
				remitenteId || 1,
				destId,
				type,
				title,
				message,
				null,
				courseId
			)
		)
	);
};

const notifyActivityEvent = async ({
	remitenteId = 1,
	destinatarioIds = [],
	courseId = null,
	courseName = "",
	activity,
	heading,
	intro,
	extraRows = [],
	type = "actividad",
}) => {
	const activityPlain =
		activity?.get && typeof activity.get === "function"
			? activity.get({ plain: true })
			: activity;

	if (!activityPlain) {
		return;
	}

	const title = `${heading} - ${activityPlain.titulo || "Actividad"}`;
	const message = buildActivityMessage({
		heading,
		intro,
		activity: activityPlain,
		courseName,
		extraRows,
	});

	await notifyBulk({
		remitenteId,
		destinatarioIds,
		type,
		title,
		message,
		courseId,
	});
};

const notifyActivitySubmission = async ({
	remitenteId,
	instructorId,
	courseId,
	courseName,
	activity,
	apprenticeName,
	comment,
	fileName,
	isResubmission = false,
}) => {
	if (!instructorId) {
		return;
	}

	const heading = isResubmission
		? "Reenvío de entrega registrado"
		: "Nueva entrega registrada";
	const intro = isResubmission
		? `${apprenticeName} volvió a enviar su entrega.`
		: `${apprenticeName} envió una entrega para esta actividad.`;

	const extraRows = [
		{ label: "Aprendiz", value: apprenticeName },
		{ label: "Comentario", value: comment || "Sin comentarios" },
		{ label: "Archivo", value: fileName || "Sin archivo adjunto" },
	];

	await notifyActivityEvent({
		remitenteId,
		destinatarioIds: [instructorId],
		courseId,
		courseName,
		activity,
		heading,
		intro,
		extraRows,
	});
};

const notifyActivityReview = async ({
	remitenteId,
	apprenticeId,
	courseId,
	courseName,
	activity,
	reviewStatus,
	feedback,
}) => {
	if (!apprenticeId) {
		return;
	}

	const statusMap = {
		aprobada: "Aprobada",
		rechazada: "Rechazada",
		pendiente: "Pendiente",
	};
	const statusLabel =
		statusMap[(reviewStatus || "").toLowerCase()] || "Pendiente";

	const heading = "Tu entrega fue revisada";
	const intro = `El estado actual de tu entrega es <strong>${statusLabel}</strong>.`;

	const extraRows = [
		{ label: "Estado", value: statusLabel },
		{
			label: "Retroalimentación",
			value: feedback || "Sin comentarios adicionales",
		},
	];

	await notifyActivityEvent({
		remitenteId,
		destinatarioIds: [apprenticeId],
		courseId,
		courseName,
		activity,
		heading,
		intro,
		extraRows,
	});
};

/**
 * Envía notificaciones de inasistencia a los usuarios que no asistieron a una sesión
 */
const sendAbsenceNotifications = async (sessionId) => {
	try {
		// Obtener la sesión con información del curso
		const session = await Sesion.findByPk(sessionId, {
			include: [
				{
					model: Curso,
					attributes: ["ID", "nombre_curso", "ficha"],
				},
			],
		});

		if (!session) {
			throw new Error("Sesión no encontrada");
		}

		// Obtener las inasistencias de la sesión
		const absences = await Asistencia.findAll({
			where: {
				sesion_ID: sessionId,
				estado: "Ausente",
			},
			include: [
				{
					model: Usuario,
					as: "aprendiz",
					attributes: ["ID", "email", "nombres", "apellidos"],
				},
			],
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
                        <li><strong>Curso:</strong> ${
							session.Curso.nombre_curso
						}</li>
                        <li><strong>Ficha:</strong> ${session.Curso.ficha}</li>
                        <li><strong>Fecha:</strong> ${new Date(
							session.fecha
						).toLocaleDateString()}</li>
                        <li><strong>Hora:</strong> ${session.hora_inicio} - ${
					session.hora_fin
				}</li>
                    </ul>
                    <p>Por favor, asegúrese de asistir a las próximas sesiones programadas.</p>
                    <p>Saludos cordiales,<br>SGFC</p>
                `;

				return sendNotification(
					null, // ✅ O el ID del sistema/admin que envía
					user.ID, // ✅ Destinatario correcto
					"inasistencia", // ✅ Tipo
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
			notifications,
		};
	} catch (error) {
		console.error("Error al enviar notificaciones de inasistencia:", error);
		throw error;
	}
};

// enviar correo de confirmacion de estado de solicitud de curso
const sendCourseRequestStatusEmail = async (userId, actaID) => {
	try {
		const user = await User.findByPk(userId);

		const acta = await Actas.findByPk(actaID);

		if (!user || !acta) {
			throw new Error("Usuario o estado no encontrado");
		}
		const fechaActa = format(
			new Date(acta.dataValues.fecha_acta),
			"dd/MM/yyyy"
		);

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
		console.error(
			"Error al enviar correo de confirmación de estado de solicitud de curso:",
			error
		);
		throw error;
	}
};

// Crear notificacion a todos los usuario sobre un nuevo curso creado
const sendNotifiCursoApi = async (
	curso,
	emails,
	fecha_inicio,
	fecha_fin,
	estado
) => {
	//consultar el id de lo usuario por email
	try {
		const users = await dbInstance.Usuario.findAll({
			where: {
				email: {
					[Op.in]: emails,
				},
			},
		});
		const userIds = users.map(async (user) => {
			const title = `Nuevo curso disponible - ${curso}`;
			const message = `
            Notificación de Nuevo Curso
            Estimado(a) ${user.nombres} ${
				user.apellidos
			}, Nos complace informarle que un nuevo curso ha sido creado y está disponible para inscripción:
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
				tipo: "nuevo_curso",
				titulo: title,
				mensaje: message,
				fecha_envio: new Date(),
				estado: "pendiente",
			});
			await notificacion.save();
		});
		await Promise.all(userIds);
		return {
			success: true,
			message: "Notificaciones creadas en la base de datos",
		};
	} catch (error) {
		console.error("Error al enviar notificaciones de nuevo curso:", error);
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
				const invitacionRecord =
					await dbInstance.InvitacionCurso.findByPk(
						inv.invitacion_ID
					);

				if (invitacionRecord) {
					const estado = invitacionRecord.estado; // 'aceptada', 'rechazada', 'pendiente'

					if (estado === "aceptada" || estado === "rechazada") {
						await dbInstance.Notificacion.destroy({
							where: { id: inv.ID },
						});
						return null; // la quitamos
					}
				}

				return inv;
			})
		);

		const invitacionesFiltradas = resultados.filter((inv) => inv !== null);

		return invitacionesFiltradas;
	} catch (error) {
		console.error(
			"Error al consultar estado de asignación a curso:",
			error
		);
		throw error;
	}
};

const createNotificacionMaterialApoyo = async (remitente_ID, emails, curso) => {
	try {
		const users = await dbInstance.Usuario.findAll({
			where: {
				email: {
					[Op.in]: emails,
				},
			},
		});
		const userID = users.map(async (user) => {
			const title = `Marial de apoyo del curso - ${curso.dataValues.nombre_curso}`;
			const message = `
            Notificación de Nuevo Curso
            Estimado(a) ${user.nombres} ${
				user.apellidos
			}, Nos complace informarle que un se subio el material de apoyo del curso:
            <br>
            <br>
            Curso: ${curso.dataValues.nombre_curso}
            <br>
            <br>
            Fecha de Inicio: ${new Date(
				curso.dataValues.fecha_inicio
			).toLocaleDateString()}
            <br>
            <br>
            Fecha de Fin: ${new Date(
				curso.dataValues.fecha_fin
			).toLocaleDateString()}
            <br>
            <br>
            Le invitamos a revisarla.
            <br>
            <br>
            Saludos cordiales, SGFC
        `;
			const notificacion = await dbInstance.Notificacion.create({
				remitente_ID: remitente_ID,
				destinatario_ID: user.ID,
				tipo: "nuevo_curso",
				titulo: title,
				mensaje: message,
				fecha_envio: new Date(),
				estado: "pendiente",
			});
			await notificacion.save();
		});
		await Promise.all(userID);
		return {
			success: true,
			message: "Notificaciones creadas en la base de datos",
		};
	} catch (error) {
		return console.log("error al cargar las notificaciones", error);
	}
};

const sendProfileUpdateNotification = async (remitenteId, destinatarioId, userData, changesList, photoChanged = false) => {
    try {
        // Obtener el usuario destinatario
        const user = await dbInstance.Usuario.findByPk(destinatarioId);
        if (!user) {
            throw new Error('Usuario destinatario no encontrado');
        }

        const title = 'Tu perfil fue actualizado por un administrador';
        const changesHtml = changesList.map(cf => `<li><strong>${cf.label}:</strong> ${cf.before ?? '—'} → ${cf.after ?? '—'}</li>`).join('');
        
        const photoSection = photoChanged ? `
            <div style="background-color: rgba(0, 132, 61, 0.1); border-left: 4px solid #00843d; padding: 1rem; margin: 1rem 0; border-radius: 0.5rem;">
                <p style="margin: 0.5rem 0; font-weight: 600; color: #00843d;">
                    <strong>Foto de perfil:</strong> Se ha actualizado tu foto de perfil.
                </p>
                <p style="margin: 0.5rem 0; color: #666;">
                    Puedes ver tu nueva foto en tu perfil de usuario.
                </p>
            </div>
        ` : '';

        const message = `
            <h2>Actualización de Perfil</h2>
            <p>Se realizaron los siguientes cambios en tu perfil:</p>
            <ul>${changesHtml}</ul>
            ${photoSection}
            <p>Si no reconoces esta acción, por favor contacta soporte.</p>
        `;

        // Crear el registro de notificación
        const notification = await dbInstance.Notificacion.create({
            remitente_ID: remitenteId,
            destinatario_ID: destinatarioId,
            usuario_ID: destinatarioId,
            tipo: 'perfil_actualizado',
            titulo: title,
            mensaje: message,
            fecha_envio: new Date(),
            estado: 'pendiente'
        });

        // Enviar el correo personalizado
        try {
            await sendProfileUpdateEmail(user.email, userData, changesList, photoChanged);
            await notification.update({ estado: 'enviada' });
            return { success: true, notification };
        } catch (emailError) {
            await notification.update({ estado: 'fallida' });
            throw emailError;
        }
    } catch (error) {
        console.error('Error al enviar notificación de actualización de perfil:', error);
        throw error;
    }
};


module.exports = {
	setDb,
	sendNotification,
	sendAbsenceNotifications,
	sendCourseRequestStatusEmail,
	sendNotifiCursoApi,
	getNotificacionesEstado,
	createNotificacionMaterialApoyo,
	sendProfileUpdateNotification,
	notifyActivityEvent,
	notifyActivitySubmission,
	notifyActivityReview,
};
