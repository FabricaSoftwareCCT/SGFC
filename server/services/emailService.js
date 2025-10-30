require("dotenv").config();
const nodemailer = require("nodemailer");
const Actas = require("../models/Actas"); // Asegúrate de importar el modelo

const moment = require("moment-timezone");
const Usuario = require("../models/User");
const Notificacion = require("../models/Notificacion");

const fs = require("fs");
const path = require("path");
const fechaSolicitud = new Date(
	Date.now() - new Date().getTimezoneOffset() * 60000
);
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.GOOGLE_APP_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

// Función genérica para enviar cualquier tipo de email
const sendEmail = async (email, subject, htmlContent) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: subject,
		html: htmlContent,
		attachments: [
			logoAttachment
		]
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
				reject(err);
			} else {
				console.log("Correo enviado:", info.response);
				resolve(info);
			}
		});
	});
};

const sendRequestCourseEmail = async (req, res) => {
	try {
		const {
			nombreCurso,
			numEmpleados,
			fechaInicio,
			fechaFin,
			curso_ID,
			empresa_ID,
			gestor_ID,
			administrador_ID,
			instructor_ID,
		} = req.body;
		const empresa = JSON.parse(req.body.empresa || "{}");
		const manager = JSON.parse(req.body.manager || "{}");
		const pdfBuffer = req.file.buffer;

		// Guardar el PDF en el sistema de archivos (puedes cambiar la ruta si lo deseas)
		const fs = require("fs");
		const path = require("path");
		const pdfFileName = `solicitud_curso_${Date.now()}.pdf`;
		const pdfPath = path.join(
			__dirname,
			"../uploads/solicitudes",
			pdfFileName
		);

		// Asegúrate de que la carpeta exista
		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfBuffer);

		// Registrar la solicitud en la base de datos
		//console.log("id curso", curso_ID);
		await Actas.create({
			fecha_acta: fechaSolicitud,
			estado_acta: "pendiente",
			fecha_respuesta: null,
			empresa_ID: empresa_ID || empresa.ID, // Usa el ID recibido o el del objeto empresa
			curso_ID: curso_ID || null,
			gestor_ID: gestor_ID || null,
			administrador_ID: administrador_ID || null,
			instructor_ID: instructor_ID || null,
			tipo_acta: "Solicitud",
			pdf_acta: pdfFileName,
		});

		// Enviar el correo
		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.GOOGLE_APP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: `"SGFC" <${process.env.EMAIL_USER}>`,
			to: process.env.EMAIL_USER,
			subject: "Nueva Solicitud de Curso",
			html: `<p>Solicitud de curso: ${nombreCurso}</p>`,
			attachments: [
				{
					filename: "solicitud_curso.pdf",
					content: pdfBuffer,
				},
			],
		});

		res.status(200).json({
			message: "Solicitud enviada y registrada correctamente.",
			pdf_acta: pdfFileName, // <-- Esto envía el nombre real del PDF al frontend
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Error al enviar o registrar la solicitud.",
		});
	}
};

const sendRequestCourseEmailAp = async (req, res) => {
	try {
		const {
			nombreCurso,
			fechaInicio,
			fechaFin,
			aprendiz,
			id,
			curso_ID,
			gestor_ID,
			administrador_ID,
			instructor_ID,
		} = req.body;
		const pdfBuffer = req.file.buffer;

		const fs = require("fs");
		const path = require("path");
		const pdfFileName = `solicitud_curso_aprendiz_${Date.now()}.pdf`;
		const pdfPath = path.join(
			__dirname,
			"../uploads/solicitudes",
			pdfFileName
		);

		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfBuffer);

		// Registrar la solicitud en la base de datos
		await Actas.create({
			fecha_acta: fechaSolicitud,
			estado_acta: "pendiente",
			fecha_respuesta: null,
			empresa_ID: id || null, // Usa el ID recibido o el del objeto empresa
			curso_ID: curso_ID || null,
			gestor_ID: gestor_ID || null,
			administrador_ID: administrador_ID || null,
			instructor_ID: instructor_ID || null,
			tipo_acta: "Solicitud",
			pdf_acta: pdfFileName,
		});

		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.GOOGLE_APP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: `"SGFC" <${process.env.EMAIL_USER}>`,
			to: process.env.EMAIL_USER,
			subject: "Nueva Solicitud de Curso",
			html: `<p>Solicitud de curso: ${nombreCurso}</p>`,
			attachments: [
				{
					filename: "solicitud_curso.pdf",
					content: pdfBuffer,
				},
			],
		});

		res.status(200).json({
			message:
				"Solicitud del aprendiz enviada y registrada correctamente.",
			pdf_acta: pdfFileName,
		});
	} catch (error) {
		console.error(error);
		return res
			.status(500)
			.json({ message: "Error al procesar la solicitud del aprendiz." });
	}
};

// Función para enviar el correo de verificación
const sendVerificationEmail = async (email, token, accountType, newPassword, masive) => {
  const enlaceVerificacion = `http://localhost:5173/verificarCorreo?token=${token}`;
  const fs = require('fs');
  const path = require('path');
  const logoPath = path.join(__dirname, '../Img/sena.png');

	// ⭐⭐ NUEVO: Mensaje específico para Aprendiz ⭐⭐
	const mensajeEspecifico =
		accountType === "Aprendiz"
			? `<p style="margin-bottom:.9375rem; background:#fff9e6; padding:10px; border-radius:5px; border-left:4px solid #F7941E;">
         <strong>💡 Para Aprendices:</strong> Después de verificar tu correo, dirígete a tu perfil para completar tu información personal y comenzar a usar la plataforma.
       </p>`
			: "";

    const messagePassword = newPassword != null ?
    `<div style="display: flex; flex-direction: column; gap: 5px; margin-bottom:.9375rem; justify-content:center; align-items:center;">
      <p>Tu contraseña temporal es:</p>
        <strong style="font-size: 15px">${newPassword}</strong>
    </div>` : '';

    const password = masive === true
     ? `<p style="margin-bottom:.9375rem; background:#fff9e6; padding:10px; border-radius:5px; border-left:4px solid #F7941E;">
         <strong>💡 Para Aprendices:</strong> Esta el la contraseña temporal que tendra para acceder al aplicativo (recomendable cambiarla): ${newPassword}.
       </p>`
    : '';

	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Verificación de correo electrónico",
		attachments: [
			{
				filename: "logo.png",
				path: logoPath,
				cid: "logo",
			},
		],
		html: `
<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">Verificación de Correo Electrónico</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
                  <p style="margin-bottom:.9375rem; display: flex; flex-direction: column; gap: 5px;">Gracias por registrarte. Para completar el proceso y activar tu cuenta, por favor haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
                  
                  ${mensajeEspecifico} <!-- ⭐⭐ AQUÍ SE INSERTA EL MENSAJE ESPECÍFICO ⭐⭐ -->
                  
                  ${messagePassword} 

                  <div style="text-align:center; padding:1.25rem 0;">
                    <a href="${enlaceVerificacion}" 
                      style="display:inline-block; background-color:#F7941E; color:#fff !important; padding:.75rem 1.5625rem; border-radius:.3125rem; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:1rem;">
                      Verificar correo
                    </a>
                    ${password}
                  </div>
                  
                  <p style="margin-bottom:.9375rem;">Si no te registraste en nuestros servicios, por favor ignora este correo.</p>
                  <p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
                </td>
              </tr>
            </table>
            <!-- Footer -->
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
`,
	};

	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			console.log("Error al enviar el correo:", err);
		} else {
			console.log("Correo enviado:", info.response);
		}
	});
};
// Función para enviar el correo de recuperación de contraseña

const emailTemplate = `
<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">[title]</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
			[content]
            <!-- Footer -->
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
`

const logoPath = path.join(__dirname, "../Img/sena.png");

const logoAttachment = {
	filename: "logo.png",
	path: logoPath,
	cid: "logo",
}

const sendPasswordResetEmail = (email, resetLink) => {
	const fs = require("fs");
	const path = require("path");
	const logoPath = path.join(__dirname, "../Img/sena.png");

	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Recuperación de contraseña",
		attachments: [
			logoAttachment,
		],
		html: emailTemplate
			.replaceAll("[title]", "Restablecimiento de Contraseña")
			.replaceAll("[content]", `
				<table width="100%" cellpadding="0" cellspacing="0">
					<tr>
						<td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
						<p style="margin-bottom:.9375rem;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
						<p style="margin-bottom:.9375rem;">Por favor, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
						<div style="text-align:center; padding:1.25rem 0;">
							<a href="${resetLink}" 
							style="display:inline-block; background-color:#F7941E; color:#fff !important; padding:.75rem 1.5625rem; border-radius:.3125rem; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:1rem;">
							Restablecer contraseña
							</a>
						</div>
						<p style="margin-bottom:.9375rem;">Este enlace es válido por un tiempo limitado. Si no solicitaste un restablecimiento de contraseña, por favor ignora este correo.</p>
						<p style="margin-bottom:.9375rem;">Si tienes problemas para acceder a tu cuenta, por favor contacta a nuestro soporte.</p>
						<p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
						</td>
					</tr>
				</table>	
			`),
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
				reject(err);
			} else {
				console.log("Correo enviado:", info.response);
				resolve(info);
			}
		});
	});
};

// Función para notificar la actualización del curso
const sendCursoUpdatedNotification = (email, curso) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: `El curso "${curso.nombre_curso}" ha sido actualizado`,
		html: `
            <p>Hola,</p>
            <p>Te informamos que el curso <strong>${curso.nombre_curso}</strong> ha sido actualizado.</p>
            <p><strong>Descripción:</strong> ${curso.descripcion}</p>
            <p><strong>Fecha de inicio:</strong> ${curso.fecha_inicio}</p>
            <p><strong>Fecha de fin:</strong> ${curso.fecha_fin}</p>
            <p><strong>Lugar:</strong> ${curso.lugar_formacion}</p>
            <p>Saludos,<br/>SGFC</p>
        `,
	};

	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			console.log("Error al enviar notificación de actualización:", err);
		} else {
			console.log("📨 Notificación enviada:", info.response);
		}
	});
};

const sendCursoUpdatedByManagerNotification = async (curso, gestor) => {
	const gestores = await Usuario.findAll({
		where: {
			accountType: "Gestor"
		}
	})
	gestores.map((u) => {
		const email = u.dataValues.email
		const mailOptions = {
			from: `"SGFC" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: `El manager ${gestor.nombres} ${gestor.apellidos} realizó cambios en el curso ${curso.nombre_curso}`,
			html: `
<p>El manager <b>${gestor.nombres} ${gestor.apellidos}</b> ha realizado cambios en el curso <b>${curso.nombre_curso}</b> a el ${(new Date()).toLocaleString("es-CO")}</p>
			`
		}
		Notificacion.create({
			remitente_ID: gestor.ID, // ✅ Campo requerido
			destinatario_ID: u.dataValues.ID, // ✅ Campo requerido
			usuario_ID: u.dataValues.ID, // Si también necesitas este campo
			tipo: "actualizacion_curso",
			titulo: `El manager ${gestor.nombres} ${gestor.apellidos} realizó cambios en el curso ${curso.nombre_curso}`,
			mensaje: `<p>El manager <b>${gestor.nombres} ${gestor.apellidos}</b> ha realizado cambios en el curso <b>${curso.nombre_curso}</b> a el ${(new Date()).toLocaleString("es-CO")}</p>`,
			estado: "pendiente",
		});
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
			} else {
				console.log("Correo enviado:", info.response);
			}
		});
	})
}

// Función para enviar el correo de confirmación de cambio de contraseña
const sendPasswordChangeConfirmationEmail = (email, resetLink) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Confirmación de cambio de contraseña",
		attachments: [
			{
				filename: "logo.png",
				path: logoPath,
				cid: "logo",
			},
		],
		html: `
<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">Confirmación de cambio de contraseña</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
                  <p style="margin-bottom:.9375rem;">Queremos confirmar que tu contraseña ha sido cambiada exitosamente.</p>
                  <p style="margin-bottom:.9375rem;">Si <strong>no realizaste este cambio</strong>, por favor <a href="mailto:soporte@tudominio.com" style="color: #F7941E;">contacta a nuestro soporte</a> de inmediato para asegurar la seguridad de tu cuenta.</p>
                  <p style="margin-bottom:.9375rem;">También puedes volver a cambiar tu contraseña haciendo clic en el siguiente enlace:</p>
                  <div style="text-align:center; padding:1.25rem 0;">
                    <a href="${resetLink}" 
                      style="display:inline-block; background-color:#F7941E; color:#fff !important; padding:.75rem 1.5625rem; border-radius:.3125rem; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:1rem;">
                      Cambiar contraseña nuevamente
                    </a>
                  </div>
                  <p style="margin-bottom:.9375rem;">Gracias por confiar en nuestros servicios.</p>
                </td>
              </tr>
            </table>
            <!-- Footer -->
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
`,
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
				reject(err);
			} else {
				console.log("Correo enviado:", info.response);
				resolve(info);
			}
		});
	});
};

//Funcion para enviar correo de notificacion de curso creado
const sendCourseCreatedEmail = (
	emails,
	nombre_curso,
	courseLink,
	descripcion,
	estado
) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: emails,
		subject: "Nuevo curso en linea",
		attachments: [
			{
				filename: "logo.png",
				path: logoPath,
				cid: "logo",
			},
		],
		html: `<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">El nuevo Curso: ${nombre_curso}</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
                  <p style="margin-bottom:.9375rem;">Tipo de estado: ${estado}</p>
                  <p style="margin-bottom:.9375rem;">${descripcion}</p>
                  <div style="text-align:center; padding:1.25rem 0;">
                    <a href="${courseLink}" 
                      style="display:inline-block; background-color:#F7941E; color:#fff !important; padding:.75rem 1.5625rem; border-radius:.3125rem; text-decoration:none; font-weight:bold; font-family:Arial,sans-serif; font-size:1rem;">
                      Inscribete ahora
                    </a>
                  </div>
                  
                  <p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
                </td>
              </tr>
            </table>
            <!-- Footer -->
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
</table>`,
	};
	console.log(emails, nombre_curso, courseLink);
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
				reject(err);
			} else {
				console.log("Correo enviado:", info.response);
				resolve(info);
			}
		});
	});
};

// Enviar correo al instructor notificando su asignación
const sendInstructorAssignedEmail = (email, curso) => {
	console.log("Datos de email: ", email);
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: `Has sido asignado al curso: ${curso.nombre_curso}`,
		html: `
      <h2>¡Hola instructor!</h2>
      <p>Has sido asignado al curso: <strong>${curso.nombre_curso}</strong>.</p>
      <p>Fecha de inicio: ${curso.fecha_inicio}</p>
    
      <p>Por favor, revisa tu panel para más información.</p>
    `,
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo al instructor:", err);
				reject(err);
			} else {
				console.log("Correo enviado al instructor:", info.response);
				resolve(info);
			}
		});
	});
};

// Enviar correo al aprendiz notificando su instructor asignado
const sendStudentsInstructorAssignedEmail = (
	emails,
	curso,
	nombreInstructor
) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: emails, // puede ser un string o un array de emails
		subject: `Tu curso ${curso.nombre_curso} ya tiene instructor asignado`,
		html: `
      <h2>¡Buenas noticias!</h2>
      <p>El curso <strong>${curso.nombre_curso}</strong> al que estás inscrito ya tiene un instructor asignado.</p>
      <p><strong>Instructor:</strong> ${nombreInstructor}</p>
      <p>Prepárate para iniciar el aprendizaje. Revisa los detalles en la plataforma.</p>
    `,
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error(
					"Error al enviar el correo a los aprendices:",
					err
				);
				reject(err);
			} else {
				console.log("Correo enviado a los aprendices:", info.response);
				resolve(info);
			}
		});
	});
};

// Exportar ambas funciones

const sendConcertacionActaEmail = async (req, res) => {
	try {
		//  Validaciones básicas
		if (!req.file) {
			return res
				.status(400)
				.json({ message: "No se recibió el archivo PDF" });
		}

		const {
			curso_ID,
			empresa_ID,
			gestor_ID,
			administrador_ID,
			instructor_ID,
			fecha_acta,
			nombreActa,
		} = req.body;

		//  Parsear objetos JSON como respaldo
		let empresaObj = null;
		let managerObj = null;

		try {
			if (req.body.empresa) {
				empresaObj = JSON.parse(req.body.empresa);
			}
		} catch (e) {
			console.log("❌ Error parseando empresa:", e);
		}

		try {
			if (req.body.manager) {
				managerObj = JSON.parse(req.body.manager);
			}
		} catch (e) {
			console.log("❌ Error parseando manager:", e);
		}

		//  Determinar los IDs finales
		const finalEmpresaID =
			empresa_ID || (empresaObj && empresaObj.ID) || null;
		const finalInstructorID =
			instructor_ID || (managerObj && managerObj.ID) || null;
		const finalGestorID = gestor_ID || null; //  Siempre null en este caso

		//  Guardar archivo PDF
		const pdfBuffer = req.file.buffer;
		const fs = require("fs");
		const path = require("path");
		const pdfFileName = `acta_concertacion_${Date.now()}.pdf`;
		const pdfPath = path.join(
			__dirname,
			"../uploads/documentos",
			pdfFileName
		);

		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfBuffer);

		//  Crear el acta en la base de datos
		const nuevaActa = await Actas.create({
			fecha_acta: fecha_acta,
			estado_acta: "pendiente",
			fecha_respuesta: null,
			empresa_ID: finalEmpresaID,
			curso_ID: curso_ID,
			gestor_ID: finalGestorID,
			administrador_ID: administrador_ID,
			instructor_ID: finalInstructorID,
			tipo_acta: "Concertacion",
			pdf_acta: pdfFileName,
		});

		//  Enviar correo con el acta adjunta
		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: "softwareccyt@gmail.com",
				pass: process.env.GOOGLE_APP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: `"SGFC" <${
				process.env.EMAIL_USER || "softwareccyt@gmail.com"
			}>`,
			to: "softwareccyt@gmail.com",
			subject: `Nueva Acta de Concertación: ${
				nombreActa || "Sin Título"
			}`,
			html: `
        <h2>Nueva Acta de Concertación</h2>
        <p><strong>Instructor:</strong> ${
			managerObj
				? `${managerObj.nombres} ${managerObj.apellidos}`
				: "No especificado"
		}</p>
        <p><strong>Email:</strong> ${
			managerObj ? managerObj.email : "No especificado"
		}</p>
        <p><strong>Empresa:</strong> ${
			empresaObj ? empresaObj.nombre_empresa : "No especificada"
		}</p>
        <p><strong>Fecha de creación:</strong> ${new Date(
			fecha_acta
		).toLocaleString()}</p>
        <p><strong>ID del acta:</strong> ${nuevaActa.ID}</p>
        <p>Se ha registrado una nueva acta de concertación en el sistema.</p>
      `,
			attachments: [
				{
					filename: pdfFileName,
					content: pdfBuffer,
				},
			],
		});

		console.log("📧 Email enviado correctamente");

		//  Respuesta exitosa
		res.status(200).json({
			message: "Acta de concertación enviada y registrada correctamente.",
			pdf_acta: pdfFileName,
			acta_id: nuevaActa.ID,
			instructor_ID_guardado: nuevaActa.instructor_ID,
			gestor_ID_guardado: nuevaActa.gestor_ID,
		});
	} catch (error) {
		console.error("❌ Error completo:", error);
		res.status(500).json({
			message: "Error al enviar o registrar el acta de concertación.",
			error: error.message,
		});
	}
};

const sendTrainingPlaceActaEmail = async (req, res) => {
	try {
		//  Validaciones básicas
		if (!req.file) {
			return res
				.status(400)
				.json({ message: "No se recibió el archivo PDF" });
		}

		const {
			curso_ID,
			empresa_ID,
			gestor_ID,
			administrador_ID,
			instructor_ID,
			fecha_acta,
			nombreActa,
		} = req.body;

		//  Parsear objetos JSON como respaldo
		let empresaObj = null;
		let managerObj = null;

		try {
			if (req.body.empresa) {
				empresaObj = JSON.parse(req.body.empresa);
			}
		} catch (e) {
			console.log("❌ Error parseando empresa:", e);
		}

		try {
			if (req.body.manager) {
				managerObj = JSON.parse(req.body.manager);
			}
		} catch (e) {
			console.log("❌ Error parseando manager:", e);
		}

		//  Determinar los IDs finales
		const finalEmpresaID =
			empresa_ID || (empresaObj && empresaObj.ID) || null;
		const finalInstructorID =
			instructor_ID || (managerObj && managerObj.ID) || null;
		const finalGestorID = gestor_ID || null; //  Siempre null en este caso

		//  Guardar archivo PDF
		const pdfBuffer = req.file.buffer;
		const fs = require("fs");
		const path = require("path");
		const pdfFileName = `acta_lugar_formacion_${Date.now()}.pdf`;
		const pdfPath = path.join(
			__dirname,
			"../uploads/documentos",
			pdfFileName
		);

		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfBuffer);

		//  Crear el acta en la base de datos
		const nuevaActa = await Actas.create({
			fecha_acta: fecha_acta,
			estado_acta: "pendiente",
			fecha_respuesta: null,
			empresa_ID: finalEmpresaID,
			curso_ID: curso_ID,
			gestor_ID: finalGestorID,
			administrador_ID: administrador_ID,
			instructor_ID: finalInstructorID,
			tipo_acta: "Lugar_formacion",
			pdf_acta: pdfFileName,
		});

		// ✅ Enviar correo con el acta adjunta
		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: "softwareccyt@gmail.com",
				pass: process.env.GOOGLE_APP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: `"SGFC" <${
				process.env.EMAIL_USER || "softwareccyt@gmail.com"
			}>`,
			to: "softwareccyt@gmail.com",
			subject: `Nueva Acta de Lugar de formacion: ${
				nombreActa || "Sin Título"
			}`,
			html: `
        <h2>Nueva Acta de Lugar de formacion</h2>
        <p><strong>Instructor:</strong> ${
			managerObj
				? `${managerObj.nombres} ${managerObj.apellidos}`
				: "No especificado"
		}</p>
        <p><strong>Email:</strong> ${
			managerObj ? managerObj.email : "No especificado"
		}</p>
        <p><strong>Empresa:</strong> ${
			empresaObj ? empresaObj.nombre_empresa : "No especificada"
		}</p>
        <p><strong>Fecha de creación:</strong> ${new Date(
			fecha_acta
		).toLocaleString()}</p>
        <p><strong>ID del acta:</strong> ${nuevaActa.ID}</p>
        <p>Se ha registrado una nueva acta de Lugar de formacion en el sistema.</p>
      `,
			attachments: [
				{
					filename: pdfFileName,
					content: pdfBuffer,
				},
			],
		});

		console.log("📧 Email enviado correctamente");

		// ✅ Respuesta exitosa
		res.status(200).json({
			message:
				"Acta de Lugar de formacion enviada y registrada correctamente.",
			pdf_acta: pdfFileName,
			acta_id: nuevaActa.ID,
			instructor_ID_guardado: nuevaActa.instructor_ID,
			gestor_ID_guardado: nuevaActa.gestor_ID,
		});
	} catch (error) {
		console.error("❌ Error completo:", error);
		res.status(500).json({
			message:
				"Error al enviar o registrar el acta de lugar de formacion.",
			error: error.message,
		});
	}
};

const sendCreateMaterialApoyo = (emails, nombre_curso, material_link) => {
	const mailOptions = {
		from: `"SGFC" <${process.env.EMAIL_USER}>`,
		to: emails,
		subject: "Nuevo Material de apoyo",
		attachments: [
			{
				filename: "logo.png",
				path: logoPath,
				cid: "logo",
			},
		],
		html: `<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">Nuevo material de apoyo de: ${nombre_curso}</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
                  <p style="margin-bottom:.9375rem;">Puedes ver el material de apoyo en este siguiente link</p>
                  <div style="text-align:center; padding:1.25rem 0;">
                  </div>
                  
                  <p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de Fábrica de Software CCT</p>
                </td>
              </tr>
            </table>
            <!-- Footer -->
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
</table>`,
	};
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.error("Error al enviar el correo:", err);
				reject(err);
			} else {
				console.log("Correo enviado:", info.response);
				resolve(info);
			}
		});
	});
};
// Función para enviar correo de actualización de perfil
const sendProfileUpdateEmail = async (email, userData, changesList, photoChanged = false) => {
  const fs = require('fs');
  const path = require('path');
  const logoPath = path.join(__dirname, '../Img/sena.png');

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

  const mailOptions = {
    from: `"SGFC" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Actualización de Perfil - SGFC",
    attachments: [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }
    ],
    html: `
<table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; margin:0; padding:0;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:37.5rem; background:#fff; margin:1.25rem auto; border-radius:.5rem; box-shadow:0 0 .625rem rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:1.875rem;">
            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:1.25rem; border-bottom:.0625rem solid #eee;">
                  <img src="cid:logo" alt="Logo de Fábrica de Software CCT" style="width:5rem; height:auto; margin-bottom:.9375rem; display:block;">
                  <h1 style="color:#00843D; margin:0; font-size:1.5rem; font-family:Arial,sans-serif;">Actualización de Perfil</h1>
                </td>
              </tr>
            </table>
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:1.25rem 0; line-height:1.6; color:#1A1A1A; font-size:1rem;">
                  <p style="margin-bottom:.9375rem;">Estimado(a) ${userData.nombres} ${userData.apellidos},</p>
                  <p style="margin-bottom:.9375rem;">Te informamos que se han realizado cambios en tu perfil de usuario por parte de un administrador del sistema.</p>
                  
                  ${changesList.length > 0 ? `
                    <h3 style="color:#00843D; margin:1rem 0 0.5rem 0;">Cambios realizados:</h3>
                    <ul style="margin:0.5rem 0; padding-left:1.5rem;">
                      ${changesHtml}
                    </ul>
                  ` : ''}
                  
                  ${photoSection}
                  
                  <div style="background-color: #fff9e6; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #F7941E; margin: 1rem 0;">
                    <p style="margin: 0.5rem 0; font-weight: 600; color: #F7941E;">
                      <strong>Importante:</strong> Si no reconoces estos cambios, por favor contacta al soporte técnico inmediatamente.
                    </p>
                  </div>
                  
                  <p style="margin-bottom:0;">Saludos cordiales,<br>El equipo de SGFC</p>
                </td>
              </tr>
            </table>
            <!-- Footer -->
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
`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error al enviar correo de actualización de perfil:", err);
        reject(err);
      } else {
        console.log("Correo de actualización de perfil enviado:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = {
	sendEmail,
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendPasswordChangeConfirmationEmail,
	sendCourseCreatedEmail,
	sendCursoUpdatedNotification,
	sendStudentsInstructorAssignedEmail,
	sendInstructorAssignedEmail,
	sendRequestCourseEmail,
	sendConcertacionActaEmail,
	sendTrainingPlaceActaEmail,
	sendRequestCourseEmailAp,
	sendCreateMaterialApoyo,
	sendCursoUpdatedByManagerNotification,
	emailTemplate,
	logoAttachment,
  sendProfileUpdateEmail
};
