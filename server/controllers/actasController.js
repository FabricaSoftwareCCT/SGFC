const Actas = require('../models/Actas');
const path = require('path');
const fs = require('fs');
const Notificacion = require('../models/Notificacion');
const { sendEmail, emailTemplate } = require('../services/emailService');
const Usuario = require('../models/User');

const getAllActas = async (req, res) => {
	try {
		const actas = await Actas.findAll();
		res.status(200).json(actas);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error al obtener las actas.' });
	}
};

const uploadPdfRadicado = async (req, res) => {
	try {
		const actaId = req.params.id;
		const pdfBuffer = req.file.buffer;
		const pdfFileName = `radicado_${Date.now()}.pdf`;
		const pdfPath = path.join(__dirname, '../uploads/solicitudes', pdfFileName);

		// Guarda el archivo en el sistema de archivos
		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfBuffer);

		// Actualiza la columna pdf_radicado en la base de datos
		await Actas.update(
			{ pdf_radicado: pdfFileName },
			{ where: { ID: actaId } }
		);

		res.status(200).json({ message: 'PDF radicado subido correctamente.', pdf_radicado: pdfFileName });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error al subir el PDF radicado.' });
	}
};

const updateEstadoActa = async (req, res) => {
	try {
		const actaId = req.params.id;
		const { estado_acta, observacion } = req.body;
		await Actas.update(
			{ estado_acta, observacion },
			{ where: { ID: actaId } }
		);
		const actaActualizada = await Actas.findOne({ where: { ID: actaId } });
		res.status(200).json({ message: 'Estado actualizado correctamente.', acta: actaActualizada.estado_acta });
	} catch (error) {
		res.status(500).json({ message: 'Error al actualizar el estado.' });
	}
};

const rejectCourseRequest = async (req, res) => {
	try {
		const notifId = req.params.id
		const { accountType, id } = req.user
		const { justification } = req.body

		if (!accountType || accountType !== "Administrador") {
			return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
		}

		const requestNotification = await Notificacion.findByPk(notifId)

		if (!requestNotification) {
			return res.status(404).json({ message: 'No se encontró la notificación' })
		}

		const personWhoRequests = (await Usuario.findByPk(requestNotification.dataValues.remitente_ID)).dataValues

		const message = emailTemplate
			.replaceAll("[title]", "Se ha rechazado la solicitud de curso")
			.replaceAll("[content]", `
				<table width="100%" cellpadding="0" cellspacing="0">
					<tr>
						<p>Estimado(a) ${personWhoRequests.nombres} ${personWhoRequests.apellidos}, se ha rechazado su solicitud de creación de curso complementario.</p>
						<br>
						<b>Motivo:</b><p>${justification}</p>
						<br>
						<b>Fecha: </b><span>${new Date().toLocaleString("es-CO")}</span>
						<br>
						<p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
						</td>
					</tr>
				</table>	
			`)

		await Notificacion.create({
			remitente_ID: id,
			destinatario_ID: requestNotification.dataValues.remitente_ID,
			usuario_ID: requestNotification.dataValues.remitente_ID,
			tipo: "otro",
			titulo: "Se ha rechazado la solicitud de curso",
			mensaje: `
				<h2>Se ha rechazado la solicitud de curso</h2>
				<p>Estimado(a) ${personWhoRequests.nombres} ${personWhoRequests.apellidos}, se ha rechazado su solicitud de creación de curso complementario.</p>
				<br>
				<b>Motivo:</b><p>${justification}</p>
				<br>
				<b>Fecha: ${new Date().toLocaleString("es-CO")}</b>	
				<br>
			`,
			estado: "pendiente",
		})

		await Notificacion.update({
			estado: "leida"
		}, {
			where: {
				ID: notifId
			}
		})

		await sendEmail(
			personWhoRequests.email,
			"Se rechazó la solicitud de curso",
			message
		)

		res.status(200).json({ message: 'Se ha rechazado la solicitud con exito' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error al rechazar la solicitud de curso' })
	}
}

const acceptCourseRequest = async (req, res) => {
	try {
		const notifId = req.params.id
		const { accountType, id } = req.user

		if (!accountType || accountType !== "Administrador") {
			return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
		}

		const requestNotification = await Notificacion.findByPk(notifId)
		if (!requestNotification) {
			return res.status(404).json({ message: 'No se encontró la notificación' })
		}

		const personWhoRequests = (await Usuario.findByPk(requestNotification.dataValues.remitente_ID)).dataValues

		const message = emailTemplate
			.replaceAll("[title]", "Se ha aceptado la solicitud de curso")
			.replaceAll("[content]", `
				<table width="100%" cellpadding="0" cellspacing="0">
					<tr>
						<p>Estimado(a) ${personWhoRequests.nombres} ${personWhoRequests.apellidos}, se ha aceptado su solicitud de creación de curso complementario.</p>
						<br>
						<p>Se le va a notificar cuando el curso complementario se haya creado.</p>
						<br>
						<br>
						<b>Fecha: </b><span>${new Date().toLocaleString("es-CO")}</span>
						<br>
						<p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
						</td>
					</tr>
				</table>	
			`)

		await Notificacion.update({
			estado: "leida"
		}, {
			where: {
				ID: notifId
			}
		})

		await Notificacion.create({
			remitente_ID: id,
			destinatario_ID: requestNotification.dataValues.remitente_ID,
			usuario_ID: requestNotification.dataValues.remitente_ID,
			tipo: "otro",
			titulo: "Se ha aceptado la solicitud de curso",
			mensaje: `
				<h2>Se ha aceptado la solicitud de curso</h2>
				<p>Estimado(a) ${personWhoRequests.nombres} ${personWhoRequests.apellidos}, se ha aceptado su solicitud de creación de curso complementario.</p>
				<br>
				<p>Se le va a notificar cuando el curso complementario se haya creado.</p>
				<br>
				<b>Fecha: ${new Date().toLocaleString("es-CO")}</b>	
			`,
			estado: "pendiente",
		})

		await sendEmail(
			personWhoRequests.email,
			"Se aceptó la solicitud de curso",
			message
		)

		res.status(200).json({ message: 'Se ha aceptar la solicitud con exito' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error al aceptar la solicitud de curso' })
	}
}

module.exports = {
	getAllActas,
	uploadPdfRadicado,
	updateEstadoActa,
	rejectCourseRequest,
	acceptCourseRequest
};