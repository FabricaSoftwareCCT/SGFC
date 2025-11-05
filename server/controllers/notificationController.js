const { log } = require('console');
const Notificacion = require('../models/Notificacion');
const User = require("../models/User");
const Curso = require("../models/curso")
const { notify } = require('../routes/userRoutes');
const {sendCreateMaterialApoyo} = require('../services/emailService')
const { sendNotification, sendAbsenceNotifications, sendCourseRequestStatusEmail, getNotificacionesEstado, createNotificacionMaterialApoyo} = require('../services/notificationService');
const { Op } = require('sequelize');
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
		const userId = req?.user?.id;
		if (!userId) {
			return res.status(401).json({
				success: false,
				message: 'Usuario no autenticado.'
			});
		}

		// Validación y saneamiento de query params
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const type = req.query.type;

		if (page < 1 || limit < 1) {
			return res.status(400).json({
				success: false,
				message: 'Parámetros "page" y "limit" deben ser mayores a 0.'
			});
		}

		const offset = (page - 1) * limit;

		const whereClause = { destinatario_ID: userId };
		if (type) {
			whereClause.tipo = type;
		}

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
			limit,
			offset
		});
	   const results = await getNotificacionesEstado(notifications);
		res.status(200).json({
			success: true,
			notifications,
			pagination: {
				total: count,
				totalPages: Math.ceil(count / limit),
				currentPage: page,
				limit
			}
		});

	} catch (error) {
		console.error('Error al obtener notificaciones:', {
			message: error.message,
			stack: error.stack,
			name: error.name,
		});

		// Puedes personalizar respuestas según tipo de error
		if (error.name === 'SequelizeDatabaseError') {
			return res.status(500).json({
				success: false,
				message: 'Error de base de datos al obtener las notificaciones.'
			});
		}

		return res.status(500).json({
			success: false,
			message: 'Ocurrió un error inesperado al obtener las notificaciones.'
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
		const { accountType } = req.user;

		if (
			accountType !== "Empresa" &&
			accountType !== "Aprendiz"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}


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

		//console.log("Notifcación registrada",notificaciones)

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

		const curso = await dbInstance.Curso.findByPk(curso_ID)

		if (!curso) {
			return res.status(404).json({ message: "No se encontró el curso" })
		}

		const dias = JSON.parse(curso.dias_formacion).sort((a, b) => {
			const week = {
				"Lunes": 0,
				"Martes": 1,
				"Miércoles": 2,
				"Jueves": 3,
				"Viernes": 4,
				"Sábado": 5,
				"Domingo": 6
			}
			return week[a] - week[b]
		}).join(", ")

		const slotsFormacion = JSON.parse(curso.slots_formacion)

		console.log(slotsFormacion)

		const isHorary = (h) => {
			return (slotsFormacion.includes(h)) ? "X": ""
		}

		const titulo = "Invitación Curso";
		const bs = `"border: 1px solid rgb(0, 0, 0)"`
		// ["Miércoles-08:00","Lunes-08:00","Lunes-06:00"]
		const mensaje = `
			<p>Has recibido una invitación para dictar el curso: <strong>${curso.nombre_curso}</strong>.</p>
			<p>Inicia el: <strong>${new Date(curso.fecha_inicio).toDateString()}</strong></p>
			<p>Termina el: <strong>${new Date(curso.fecha_fin).toDateString()}</strong></p>
			<p>Días de formación: <strong>${dias}</strong></p>
			<p>Horario: ${!curso.slots_formacion ? "<strong>Sin definir</strong>" : ""}</p>
			${curso.slots_formacion ?
			`<table>
				<tr>
					<td></td>
					<th style=${bs}>Lunes</th>
					<th style=${bs}>Martes</th>
					<th style=${bs}>Miercoles</th>
					<th style=${bs}>Jueves</th>
					<th style=${bs}>Viernes</th>
					<th style=${bs}>Sábado</th>
				</tr>
				<tr>
					<th style=${bs}>6:00</th>
					<td style=${bs}>${isHorary("Lunes-06:00")}</td>
					<td style=${bs}>${isHorary("Martes-06:00")}</td>
					<td style=${bs}>${isHorary("Miércoles-06:00")}</td>
					<td style=${bs}>${isHorary("Jueves-06:00")}</td>
					<td style=${bs}>${isHorary("Viernes-06:00")}</td>
					<td style=${bs}>${isHorary("Sábado-06:00")}</td>
				</tr>
				<tr>
					<th style=${bs}>7:00</th>
					<td style=${bs}>${isHorary("Lunes-07:00")}</td>
					<td style=${bs}>${isHorary("Martes-07:00")}</td>
					<td style=${bs}>${isHorary("Miércoles-07:00")}</td>
					<td style=${bs}>${isHorary("Jueves-07:00")}</td>
					<td style=${bs}>${isHorary("Viernes-07:00")}</td>
					<td style=${bs}>${isHorary("Sábado-07:00")}</td>
				</tr>
				<tr>
					<th style=${bs}>8:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>9:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>10:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>11:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>12:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>13:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>14:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>15:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>16:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>17:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>18:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>19:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>20:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>21:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
				<tr>
					<th style=${bs}>22:00</th>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
					<td style=${bs}></td>
				</tr>
			</table>`: ""}
			<br><p>Por favor, acepta o rechaza la invitación.</p>
		`;
		const tipo = "invitacion_cursoInstructor"

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

		await sendNotification(
			remitente_ID,
			destinatario_ID,
			tipo,
			titulo,
			mensaje,
			curso_ID
		)

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

// crear notificacion de estado de solicitud de curso (aceptada/rechazada) para empresa
const createCourseRequestStatusNotification = async (req, res) => {
	try {
		const { remitente_ID ,actaID, estado} = req.body;
		if (!remitente_ID || !actaID || !estado ) {
			console.log('Faltan datos requeridos:', { actaID, estado }); 
			return res.status(400).json({ message: 'Faltan datos requeridos.' });
		}
		// Buscar el acta para obtener el ID de la empresa (remitente)
		const acta = await dbInstance.Actas.findByPk(actaID);
		if (!acta) {
			return res.status(404).json({ message: 'Acta no encontrada.' });
		}
		const id_empresa = acta.empresa_ID;
		// Buscar el usuario de la empresa
		const usuario = await User.findOne({ where: { empresa_ID: id_empresa } });

		if (!usuario) {
			return res.status(404).json({ message: 'Usuario no encontrado.' });
		}

		// Crear la notificación
		const notificacion = await dbInstance.Notificacion.create({
			remitente_ID,
			destinatario_ID: usuario.dataValues.ID,
			tipo: 'estado_solicitud_curso',
			titulo: `Solicitud de curso ${estado}`,
			mensaje: `La solicitud de curso ha sido ${estado}.`,
			fecha_envio: new Date(),
			estado: 'sin_leer',
			acta_ID: actaID
		});

		await sendCourseRequestStatusEmail(
			usuario.dataValues.ID,
			actaID
		);

		res.status(201).json({
			success: true,
			message: 'Notificación de estado de solicitud de curso creada correctamente',
			notificacion
		});
	} catch (error) {
		console.error('Error al crear notificación de estado de solicitud de curso:', error);
		res.status(500).json({ message: 'Error al crear la notificación' });
	}
}

// crear notificacion de material de apoyo subido para aprendices
const crearNotificacionMaterialApoyo = async (req, res) => {
	try {
		const{ curso_ID} = req.body;

		const remitente_ID = req.user.id;
		
		if (!remitente_ID || !curso_ID) {
			return res.status(400). json({message: 'faltan datos requeridos.'});
		}

		const usuarios = await User.findAll({
			where : {
				verificacion_email : true,
				accountType : {[Op.or] : ["Aprendiz"]}
			},
			attributes : ['email']
		})

		const curso = await Curso.findByPk(curso_ID)
		const emails = usuarios.map(user => user.email);
		const material_link = `http://localhost:5173/cursos/`;
		
		if (emails.length > 0) {
			await sendCreateMaterialApoyo(emails, curso.dataValues.nombre_curso, material_link)
			await createNotificacionMaterialApoyo(remitente_ID, emails, curso);
		}
		return res.status(200).json({message: "se enviaron las notificaciones, del material de apoyo"})
		
	} catch (error) {
		console.error('Error al crear notificación de material de apoyo:', error);
		res.status(500).json({ message: 'Error al crear la notificación' });
	}
}


module.exports = {
	setDb,
	getUserNotifications,
	markNotificationAsRead,
	sendManualAbsenceNotification,
	crearNotificacionSolicitudCurso,
	crearNotificacionInvitacionCursoInstructor,
	createCourseRequestStatusNotification,
	crearNotificacionMaterialApoyo
}; 