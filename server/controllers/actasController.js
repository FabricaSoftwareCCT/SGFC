const Actas = require('../models/Actas');
const path = require('path');
const fs = require('fs');
const Notificacion = require('../models/Notificacion');
const { sendEmail } = require('../services/emailService');
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
		const { estado_acta } = req.body;
		await Actas.update(
			{ estado_acta },
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

		await Notificacion.create({
			remitente_ID: id,
			destinatario_ID: requestNotification.dataValues.remitente_ID,
			usuario_ID: requestNotification.dataValues.remitente_ID,
			tipo: "otro",
			titulo: "Se rechazó la solicitud de curso",
			mensaje: `Se ha rechazado la solicitud de curso.<br><br><b>Motivo:</b> ${justification}`,
			estado: "pendiente",
		})

		await Notificacion.update({
			estado: "leida"
		}, {
			where: {
				ID: notifId
			}
		})

		const personWhoRequests = (await Usuario.findByPk(requestNotification.dataValues.remitente_ID)).dataValues

		await sendEmail(
			personWhoRequests.email,
			"Se rechazó la solicitud de curso",
			`Un administrador ha rechazado tu solicitud de creación de curso.<br><b>Motivo: </b>${justification}`
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
		const { accountType } = req.user

		if (!accountType || accountType !== "Administrador") {
			return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
		}

		const requestNotification = await Notificacion.findByPk(notifId)
		if (!requestNotification) {
			return res.status(404).json({ message: 'No se encontró la notificación' })
		}

		const personWhoRequests = (await Usuario.findByPk(requestNotification.dataValues.remitente_ID)).dataValues

		await Notificacion.update({
			estado: "leida"
		}, {
			where: {
				ID: notifId
			}
		})

		await sendEmail(
			personWhoRequests.email,
			"Se aceptó la solicitud de curso",
			`Un administrador ha aceptado tu solicitud de creación de curso. Se le va a notificar una vez este sea creado.`
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