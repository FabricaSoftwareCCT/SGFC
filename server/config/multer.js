const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage(); // Guarda como buffer

const registerValidationError = (req, cb, message) => {
	req.fileValidationError = message;
	cb(null, false);
};

const fileFilter = (req, file, cb) => {
	console.log("Tipo MIME recibido:", file.mimetype); // 🔍

	if (file.fieldname === 'foto_perfil' || file.fieldname === 'imagen' || file.fieldname === 'img_empresa') {
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/x-icon', 'image/webp'];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Solo se aceptan imágenes (jpeg, jpg, png).'));
		}
	} else if (file.fieldname === 'document_pdf' || file.fieldname === 'pdf') { // <-- Permitir 'pdf'
		if (file.mimetype === 'application/pdf') {
			cb(null, true);
		} else {
			registerValidationError(req, cb, "El archivo seleccionado debe ser un PDF válido.");
		}
	} else if (file.fieldname === 'archivo_xlsx') {
		const validMimetype = [
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		];
		if (validMimetype.includes(file.mimetype)) {
			cb(null, true);
		} else {
			registerValidationError(
				req,
				cb,
				"El archivo debe ser un Excel (.xlsx). Verifica el formato e inténtalo de nuevo."
			);
		}
	} else if (file.fieldname === "video") {
		const validMimetype = [
			'video/mp4'
		];
		if (validMimetype.includes(file.mimetype)) {
			cb(null, true);
		} else {
			registerValidationError(
				req,
				cb,
				"El video debe estar en formato MP4."
			);
		}
	} else if (file.fieldname === "archivo_entrega" || file.fieldname === "archivo_retroalimentacion") {
		const allowedTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/zip',
			'application/x-zip-compressed',
			'application/x-7z-compressed',
			'application/x-rar-compressed',
			'application/x-tar',
			'application/octet-stream',
			'text/plain',
			'image/jpeg',
			'image/png'
		];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			registerValidationError(
				req,
				cb,
				"El archivo no es compatible. Usa PDF, Word, Excel, ZIP/RAR/7Z, imágenes JPG/PNG o archivos de texto."
			);
		}
	} else {
		registerValidationError(
			req,
			cb,
			"El campo de archivo proporcionado no está permitido."
		);
	}
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
