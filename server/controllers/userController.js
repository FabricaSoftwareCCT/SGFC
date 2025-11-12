const User = require("../models/User");
require("dotenv").config();
const crypto = require("crypto");
const {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendPasswordChangeConfirmationEmail,
} = require("../services/emailService");
const { generateToken } = require("../middlewares/generateToken_R");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op, col, json, Sequelize } = require("sequelize");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const vision = require("@google-cloud/vision");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const { createCanvas } = require("canvas");
const { UserServices } = require("../services/Userservices");
const { sendNotification, sendProfileUpdateNotification } = require('../services/notificationService');
const { generateTempPassword } = require("../Helpers/GeneratePassword");


// Registrar usuario
const Empresa = require("../models/empresa"); // Importar el modelo Empresa
const Sena = require("../models/sena"); // Importar el modelo Sena
const Departamento = require("../models/departamento"); // Importar el modelo Departamento
const Ciudad = require("../models/ciudad"); // Importar el modelo Ciudad
const Usuario = require("../models/User");
const { addHistorial } = require("./historialController");
const Curso = require("../models/curso");
const InscripcionCurso = require("../models/InscripcionCurso");
const fotoDefectPerfil = "../Img/userDefect.png"; // Importar la imagen por defecto

//registrar usuario (empresa o aprendiz)
// Registrar usuario
// Registrar usuario
const registerUser = async (req, res) => {
	try {
		const {
			email,
			password,
			accountType,
			documento,
			nombres,
			apellidos,
			celular,
			titulo_profesional,
		} = req.body;

		// Validar datos obligatorios
		if (!email || !password || !accountType) {
			return res
				.status(400)
				.json({
					message:
						"Los campos email, password y accountType son obligatorios",
				});
		}

		// Validar el tipo de cuenta
		const validAccountTypes = ["Aprendiz", "Empresa"];
		if (!validAccountTypes.includes(accountType)) {
			return res
				.status(400)
				.json({ message: "El tipo de cuenta no es válido" });
		}

		// Verificar si el usuario ya existe por email
		const existingUser = await User.findOne({ where: { email } });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "El correo ya está registrado" });
		}

		// Generar token de verificación JWT (no con crypto)
		// const payload = { email };
		// const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
		const payload = { data: { email } };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		// Generar contraseña temporal
		//Configurar para usuarios que necesitan contraseña temporal
		//const tempPassword = Math.random().toString(36).slice(-8);

		// Encriptar la contraseña
		const hashedPassword = await bcrypt.hash(password, 10);

		// Crear nuevo usuario
		const newUser = await User.create({
			email,
			password: hashedPassword,
			accountType,
			documento: documento || null,
			nombres: nombres || null,
			apellidos: apellidos || null,
			celular: celular || null,
			titulo_profesional: titulo_profesional || null,
			verificacion_email: false,
			token,
			foto_perfil: fotoDefectPerfil,
		});

		// Si el tipo de cuenta es Empresa, crear un registro en la tabla Empresa
		if (accountType === "Empresa") {
			const nuevaEmpresa = await Empresa.create({
				NIT: null,
				email_empresa: null,
				nombre_empresa: null,
				direccion: null,
				estado: "inactivo",
				categoria: null,
				telefono: null,
				img_empresa: null,
			});

			newUser.empresa_ID = nuevaEmpresa.ID;
			await newUser.save();
		}

		// Enviar correo de verificación CON la contraseña temporal
		await sendVerificationEmail(email, token, accountType);

		res.status(201).json({
			message:
				"Usuario registrado. Por favor verifica tu correo para obtener tu contraseña temporal.",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error al registrar el usuario" });
	}
};

// Verificar correo
const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		// Validar token
		if (!token) {
			return res.status(400).json({ message: "Token no proporcionado" });
		}

		console.log("Token recibido:", token);

		// Verificar el token JWT
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
			console.log("Token decodificado:", decoded);
		} catch (err) {
			if (err.name === "TokenExpiredError") {
				return res.status(400).json({ message: "Token expirado" });
			}
			console.log("Error al verificar token:", err);
			return res.status(400).json({ message: "Token inválido" });
		}

		const userEmail = decoded.data.email;

		if (!userEmail) {
			return res
				.status(400)
				.json({ message: "Token no contiene email válido" });
		}

		const user = await User.findOne({ where: { email: userEmail } });

		if (!user) {
			return res.status(400).json({ message: "Usuario no encontrado" });
		}

		console.log("Token en la base de datos:", user.token);
		console.log("Token recibido vs token en BD:", token, user.token);

		// Verificar que el token coincida
		if (user.token !== token) {
			return res.status(400).json({ message: "Token no coincide" });
		}

		// Actualizar estado de verificación
		user.verificacion_email = true;
		user.token = null;
		await user.save();

		res.status(200).json({ message: "Correo verificado con éxito" });
	} catch (error) {
		console.error("Error completo al verificar el correo:", error);
		res.status(500).json({ message: "Error al verificar el correo" });
	}
};

const requestNewVerificationEmail = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res
				.status(400)
				.json({ message: "El correo es obligatorio" });
		}

		const user = await User.findOne({ where: { email } });
		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		// Generar nueva contraseña temporal
		const tempPassword = await generateTempPassword();
		const hashedPassword = await bcrypt.hash(tempPassword, 10);

		// Generar nuevo token
		const token = generateToken({ email }, process.env.JWT_SECRET, 5);

		// Actualizar usuario con nuevo token y nueva contraseña temporal
		try {
			await user.update({
				token: token,
				password: hashedPassword,
			});
		} catch (error) {
			console.error("Error al actualizar el usuario:", error);
		}

		// Enviar correo de verificación con la nueva contraseña temporal
		await sendVerificationEmail(email, token, null ,tempPassword);

		res.status(200).json({
			message:
				"Correo de verificación reenviado con nueva contraseña temporal",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Error al reenviar el correo de verificación",
		});
	}
};

// Iniciar sesión
const loginUser = async (req, res) => {
	try {
		const { email, password, remember } = req.body;
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios" });
		}

		const user = await User.findOne({ where: { email } });
		if (!user || !user.verificacion_email) {
			return res
				.status(403)
				.json({
					message: "Credenciales inválidas o correo no verificado.",
				});
		}

		console.log(password, "Datos ingresados: ", user.password);

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res
				.status(400)
				.json({ message: "Usuario o contraseña incorrectos" });
		}

		// Construir el payload del token
		const payload = {
			id: user.ID,
			email: user.email,
			accountType: user.accountType,
			remember: remember,
		};
		if (user.accountType === "Empresa") {
			payload.empresa_ID = user.empresa_ID;
		}

		// Access token (10 min) y Refresh token (7 días)
		const accessToken = jwt.sign(
			payload,
			process.env.JWT_SECRET || "secret",
			{ expiresIn: "10m" }
		);

		const refreshToken = jwt.sign(
			{ id: user.ID },
			process.env.JWT_SECRET || "secret",
			{ expiresIn: "7d" }
		);

		// Guardar tokens en cookies
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: remember ? 15 * 60 * 1000 : null,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		// Agregar empresa_ID si es cuenta tipo Empresa
		let extraData = {};
		if (user.accountType === "Empresa") {
			extraData.empresa_ID = user.empresa_ID;
		}

		// ✅ CORRECCIÓN CRÍTICA: Devolver el accessToken en la respuesta JSON
		res.status(200).json({
			message: "Inicio de sesión exitoso",
			accessToken: accessToken, // ✅ Esto es lo que falta
			id: user.ID,
			email: user.email,
			accountType: user.accountType,
			...extraData,
		});
		return;
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error en el servidor" });
	}
};

const recordLogin = async (req, res) => {
	try {
		const token = req.user;

		if (!token || !token.remember) {
			return res.status(200).json({ session: null });
		}

		const result = await UserServices.GetUser(token);

		if (!result) {
			res.status(401).json({
				msg: "Sesión no recordada o usuario invalido",
			});
		}

		const accessToken = jwt.sign(
			result,
			process.env.JWT_SCRET || "secret",
			{ expiresIn: "10m" }
		);

		const refreshToken = jwt.sign(
			{ id: result.id },
			process.env.JWT_SECRET || "secret",
			{ expiresIn: "7d" }
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		});

		let extraData = {};
		if (result.accountType === "Empresa") {
			extraData.empresa_ID = result.empresa_ID;
		}

		res.status(200).json({
			session: {
				msg: "Inicio de sessión",
				payload: result,
				accountType: result?.accountType,
				...extraData,
			},
		});
		return;
	} catch (err) {
		console.log(err);
		res.status(500).json({ msg: "Error de servidor" });
	}
};
//refrescar el acces web token
const refreshAccessToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			return res.status(401).json({ message: "Refresh token faltante" });
		}

		const decoded = jwt.verify(
			refreshToken,
			process.env.JWT_SECRET || "secret"
		);
		// Buscar usuario para obtener email y accountType
		const user = await User.findByPk(decoded.id);
		if (!user) {
			return res.status(401).json({ message: "Usuario no encontrado" });
		}

		const accessToken = jwt.sign(
			{ id: user.ID, email: user.email, accountType: user.accountType },
			process.env.JWT_SECRET || "secret",
			{ expiresIn: "15m" }
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000, // 15 minutos
		});

		// ✅ También devolver el nuevo accessToken en la respuesta
		res.status(200).json({
			message: "Token renovado",
			accessToken: accessToken, // ✅ Para que el frontend lo guarde
			accountType: user.accountType,
		});
	} catch (error) {
		console.error("Error al refrescar el token:", error);
		res.status(401).json({ message: "Refresh token inválido o expirado" });
	}
};

//cerrar sesion
const logoutUser = (req, res) => {
	// Verificar si el sistema está apagado
	if (
		process.env.SYSTEM_STATUS === "offline" ||
		process.env.SYSTEM_SHUTDOWN === "true"
	) {
		return res.status(503).json({
			message:
				"El sistema está apagado. No es posible cerrar sesión en este momento.",
		});
	}

	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
	});

	res.status(200).json({ message: "Sesión cerrada correctamente" });
};

// Solicitud de restablecimiento de contraseña
const requestPasswordReset = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			console.log(
				`Intento de recuperación para un correo no registrado: ${email}`
			);
			return res
				.status(404)
				.json({
					message:
						"No se encontró un usuario con ese correo electrónico.",
				});
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
		await user.save();

		// 👉 Imprimir el token en consola
		console.log(`Token generado para ${email}: ${resetToken}`);

		const resetLink = `http://localhost:5173/resetPassword?token=${resetToken}`;
		console.log(`Enviando correo de recuperación a: ${email}`);
		await sendPasswordResetEmail(email, resetLink);

		res.status(200).json({
			message:
				"Se ha enviado un enlace de recuperación a tu correo electrónico.",
		});
	} catch (error) {
		console.error("Error al solicitar recuperación de contraseña:", error);
		res.status(500).json({
			message:
				"Error al procesar la solicitud de recuperación de contraseña.",
		});
	}
};

// Cambiar contraseña con token
const resetPassword = async (req, res) => {
	try {
		const { token } = req.query;
		const { newPassword } = req.body;

		if (!token) {
			return res.status(400).json({ message: "Token no proporcionado" });
		}

		const user = await User.findOne({
			where: {
				resetPasswordToken: token,
				resetPasswordExpires: { [Op.gt]: Date.now() },
			},
		});

		if (!user) {
			return res
				.status(400)
				.json({ message: "Token inválido o expirado" });
		}

		// Encriptar la nueva contraseña
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		user.password = hashedPassword;
		// Limpiar el token usado
		user.resetPasswordToken = null;
		user.resetPasswordExpires = null;

		// Generar un nuevo token de recuperación por si el usuario no hizo el cambio
		const newResetToken = crypto.randomBytes(32).toString("hex");
		user.resetPasswordToken = newResetToken;
		user.resetPasswordExpires = Date.now() + 3600000; // 1 hora más

		await user.save();

		// Enlace para volver a cambiar la contraseña
		const resetLink = `http://localhost:5173/resetPassword?token=${newResetToken}`;
		await sendPasswordChangeConfirmationEmail(user.email, resetLink);

		res.status(200).json({ message: "Contraseña restablecida con éxito" });
	} catch (error) {
		console.error("Error al restablecer la contraseña:", error);
		res.status(500).json({ message: "Error al restablecer la contraseña" });
	}
};

//limpiar tokens expirados
const cleanExpiredTokens = async () => {
	try {
		// Limpia los tokens de recuperación de contraseña expirados
		await User.update(
			{ resetPasswordToken: null, resetPasswordExpires: null },
			{
				where: {
					resetPasswordExpires: { [Op.lt]: Date.now() },
				},
			}
		);
		console.log(
			"Tokens de recuperación expirados limpiados correctamente."
		);
	} catch (error) {
		console.error("Error al limpiar tokens expirados:", error);
	}
};

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
	try {
		const { page, name, doc } = req.query

		let conditions = {
			attributes: {
				exclude: [
					"password",
					"token",
					"resetPasswordToken",
					"resetPasswordExpires",
				],
			},
		}

		if (page) {
			conditions = {
				...conditions,
				offset: parseInt(page) * 10,
				limit: 10
			}
		}

		if (name) {
			conditions = {
				...conditions,
				where: Sequelize.where(
					Sequelize.fn('CONCAT', Sequelize.col('nombres'), ' ', Sequelize.col('apellidos')),
					{ [Op.like]: `%${name}%` }
				),
			}
		}

		if (doc) {
			conditions = {
				...conditions,
				where: {
					documento: {
						[Op.like]: `%${doc}%`
					}
				},
			}
		}

		const users = await User.findAndCountAll(conditions);

		res.status(200).json({
			total: users.count,
			usuarios: users.rows
		});
	} catch (error) {
		console.error("Error al obtener los usuarios:", error);
		res.status(500).json({ message: "Error al obtener los usuarios" });
	}
};

const getUserProfile = async (req, res) => {
	try {
		const userId = req.params.id;

		const usuario = await User.findByPk(userId, {
			include: [
				{
					model: Sena,
					as: "Sena",
					include: [
						{
							model: Ciudad,
							as: "Ciudad",
							attributes: ["ID", "nombre"],
							include: [
								{
									model: Departamento,
									as: "Departamento",
									attributes: ["ID", "nombre"],
								},
							],
						},
					],
				},
				{
					model: Empresa,
					as: "Empresa",
					include: [
						{
							model: Ciudad,
							as: "Ciudad",
							include: [
								{
									model: Departamento,
									as: "Departamento",
								},
							],
						},
					],
				},
			],
		});

		if (!usuario) {
			return res.status(404).json({ error: "Usuario no encontrado" });
		}

		res.json(usuario);
	} catch (error) {
		console.error("Error al obtener el perfil del usuario:", error);
		res.status(500).json({
			error: "Error al obtener el perfil del usuario",
		});
	}
};

//Consultar lista de aprendices
const getAprendices = async (req, res) => {
	try {
		const aprendices = await User.findAll({
			where: { accountType: "Aprendiz" },
			attributes: {
				exclude: [
					"password",
					"token",
					"resetPasswordToken",
					"resetPasswordExpires",
				],
			}, // Excluir datos sensibles
		});

		res.status(200).json(aprendices);
	} catch (error) {
		console.error("Error al obtener la lista de aprendices:", error);
		res.status(500).json({
			message: "Error al obtener la lista de aprendices.",
		});
	}
};

//Consultar lista de empresas
// En tu userController.js - modificar getEmpresas
const getEmpresas = async (req, res) => {
  try {
    // Opción A: Traer ambas - usuarios empresa Y empresas sin usuario
    const empresasConUsuario = await User.findAll({
      where: { accountType: 'Empresa' },
      attributes: { exclude: ['password', 'token', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        {
          model: Empresa,
          as: 'Empresa',
          attributes: ['ID', 'NIT', 'email_empresa', 'nombre_empresa', 'direccion', 'estado', 'categoria', 'telefono', 'img_empresa', 'ciudad_ID'],
          include: [
            {
              model: Ciudad,
              as: 'Ciudad',
              attributes: ['ID', 'nombre', 'departamento_ID'],
              include: [
                {
                  model: Departamento,
                  as: 'Departamento',
                  attributes: ['ID', 'nombre']
                }
              ]
            }
          ]
        },
      ],
    });

    // Traer empresas que no tienen usuario asociado
    const empresasSinUsuario = await Empresa.findAll({
      where: {
        ID: {
          [Op.notIn]: empresasConUsuario.map(emp => emp.Empresa?.ID).filter(Boolean)
        }
      },
      include: [
        {
          model: Ciudad,
          as: 'Ciudad',
          attributes: ['ID', 'nombre', 'departamento_ID'],
          include: [
            {
              model: Departamento,
              as: 'Departamento',
              attributes: ['ID', 'nombre']
            }
          ]
        }
      ]
    });

    // Combinar resultados
    const empresasCombinadas = [
      ...empresasConUsuario,
      ...empresasSinUsuario.map(empresa => ({
        ID: empresa.ID, // Usar ID de empresa como ID temporal
        accountType: 'Empresa',
        Empresa: empresa
      }))
    ];

    res.status(200).json(empresasCombinadas);

  } catch (error) {
    console.error("Error al obtener la lista de empresas:", error);
    res.status(500).json({ message: "Error al obtener la lista de empresas." });
  }
};

//obtener empresa(activa) por ID
const getEmpresaByNIT = async (req, res) => {
	try {
		const { NIT } = req.params;
		const empresa = await Empresa.findOne({
			where: {
				NIT,
				estado: "Activo",
			},
		});

		if (!empresa) {
			return res
				.status(404)
				.json({ message: "Empresa no encontrada o no está activa." });
		}

		res.status(200).json(empresa);
	} catch (error) {
		console.error("Error al obtener la empresa:", error);
		res.status(500).json({ message: "Error al obtener la empresa." });
	}
};

// Obtener empresa por ID
const getEmpresaById = async (req, res) => {
	try {
		const { id } = req.params;
		const empresa = await Empresa.findByPk(id);

		if (!empresa) {
			return res.status(404).json({ message: "Empresa no encontrada." });
		}

		res.status(200).json(empresa);
	} catch (error) {
		console.error("Error al obtener la empresa por ID:", error);
		res.status(500).json({ message: "Error al obtener la empresa." });
	}
};

// Consultar lista de instructores
const getInstructores = async (req, res) => {
	try {
		const instructores = await User.findAll({
			where: { accountType: "Instructor" },
			attributes: [
				"ID",
				"email",
				"nombres",
				"apellidos",
				"estado",
				"celular",
				"documento",
				"foto_perfil",
				"titulo_profesional",
			],
		});

		res.status(200).json(instructores);
	} catch (error) {
		console.error("Error al obtener los instructores:", error);
		res.status(500).json({ message: "Error al obtener los instructores." });
	}
};

//Consultar lista de gestores
const getGestores = async (req, res) => {
	try {
		const gestores = await User.findAll({
			where: { accountType: "Gestor" },
			attributes: [
				"ID",
				"email",
				"nombres",
				"apellidos",
				"estado",
				"celular",
				"documento",
				"foto_perfil",
			],
		});

		res.status(200).json(gestores);
	} catch (error) {
		console.error("Error al obtener los gestores:", error);
		res.status(500).json({ message: "Error al obtener los gestores." });
	}
};

//Actualizar perfil segun tipo cuenta
const updateUserProfile = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			email,
			nombres,
			apellidos,
			celular,
			documento,
			estado,
			titulo_profesional,
			tipoDocumento,
		} = req.body;

		// Procesar imagen de perfil si se sube (como base64)
		let foto_perfil = null;
		if (req.files?.foto_perfil?.[0]) {
			// Si viene como archivo
			foto_perfil = req.files.foto_perfil[0].buffer.toString("base64");
		} else if (req.body.foto_perfil) {
			// Si viene como base64 en el body
			foto_perfil = req.body.foto_perfil;
		}

		const token = req.cookies.accessToken;
		if (!token) {
			return res
				.status(401)
				.json({ message: "No autorizado. Debes iniciar sesión." });
		}

		let loggedInUser;
		try {
			loggedInUser = jwt.verify(
				token,
				process.env.JWT_SECRET || "secret"
			);
		} catch (error) {
			return res
				.status(401)
				.json({ message: "Token inválido o expirado." });
		}

		if (!loggedInUser) {
			return res
				.status(401)
				.json({ message: "Token inválido o expirado." });
		}

		const user = await User.findByPk(id, {
			include: [{ model: Empresa, as: "Empresa" }],
		});

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado." });
		}

		// Función para validar email
		const isValidEmail = (email) => {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return emailRegex.test(email);
		};

		// Función para validar que no sean números negativos
		const isValidPositiveNumber = (value) => {
			const num = parseInt(value);
			return !isNaN(num) && num >= 0;
		};

		// Validaciones de formato
		if (email && !isValidEmail(email)) {
			return res
				.status(400)
				.json({ message: "Formato de correo electrónico inválido." });
		}

		if (celular && celular !== user.celular) {
			const existingCelular = await User.findOne({ where: { celular } });
			if (existingCelular) {
				return res
					.status(400)
					.json({
						message: "El número de celular ya está registrado.",
					});
			}
		}

		if (documento && !isValidPositiveNumber(documento)) {
			return res
				.status(400)
				.json({ message: "Número de documento inválido." });
		}

		// Verificación de permisos
		// Administrador puede actualizar cualquier perfil (se maneja abajo)
		// Empresa puede actualizar el suyo (se maneja abajo)
		// Para otros roles (Instructor, Aprendiz): permitir solo si actualiza su propio perfil
		// Gestor se considera con privilegios de administrador
		if (
			loggedInUser.accountType !== "Administrador" &&
			loggedInUser.accountType !== "Empresa" &&
			loggedInUser.accountType !== "Gestor"
		) {
			if (parseInt(id, 10) !== Number(loggedInUser.id)) {
				return res
					.status(403)
					.json({
						message: "No tienes permiso para actualizar perfiles.",
					});
			}
		}

        // ADMINISTRADOR o GESTOR (mismas reglas)
            if (loggedInUser.accountType === "Administrador" || loggedInUser.accountType === "Gestor") {
            // Limpiar valores "null" que vienen del FormData
            const cleanValue = (val) => {
                if (val === "null" || val === null || val === undefined) return null;
                if (typeof val === "string" && val.trim() === "") return null;
                return val;
            };

            // Snapshot de valores originales (para detectar cambios)
            const originalValues = {
                email: user.email,
                nombres: user.nombres,
                apellidos: user.apellidos,
                celular: user.celular,
                documento: user.documento,
                estado: user.estado,
                titulo_profesional: user.titulo_profesional,
                tipoDocumento: user.tipoDocumento,
                foto_perfil: user.foto_perfil,
            };

            const nombresClean = cleanValue(nombres);
            const apellidosClean = cleanValue(apellidos);
            const celularClean = cleanValue(celular);
            const documentoClean = cleanValue(documento);
            const emailClean = cleanValue(email);
            const tipoDocumentoClean = cleanValue(tipoDocumento);

            // Validaciones de campos obligatorios según el tipo de cuenta
            let camposObligatorios = {};
            
            if (user.accountType === "Empresa") {
                // Para empresas, ser más permisivo - solo validar si el campo tiene valor actual
                camposObligatorios = {};
                // Solo validar campos que ya tienen valor en la BD o que se están enviando con valor
                if ((nombres !== undefined && nombresClean) || user.nombres) {
                    camposObligatorios.nombres = nombresClean || user.nombres;
                }
                if ((apellidos !== undefined && apellidosClean) || user.apellidos) {
                    camposObligatorios.apellidos = apellidosClean || user.apellidos;
                }
                if ((celular !== undefined && celularClean) || user.celular) {
                    camposObligatorios.celular = celularClean || user.celular;
                }
                if ((email !== undefined && emailClean) || user.email) {
                    camposObligatorios.email = emailClean || user.email;
                }
            } else {
                // Para otros tipos de usuario (Administrador, Gestor, Instructor, Aprendiz)
                camposObligatorios = {
                nombres: nombresClean,
                apellidos: apellidosClean,
                celular: celularClean,
                email: emailClean
            };
            }

			const camposVacios = [];
			for (const [campo, valor] of Object.entries(camposObligatorios)) {
				if (
					valor !== undefined &&
					(valor === null || valor === "" || valor.trim() === "")
				) {
					camposVacios.push(campo);
				}
			}

			if (camposVacios.length > 0) {
				return res.status(400).json({
					message: `No se pudo guardar el perfil. Los siguientes campos son obligatorios y no pueden estar vacíos: ${camposVacios.join(
						", "
					)}. Intente nuevamente.`,
				});
			}

			// Validaciones únicas
			if (emailClean && emailClean !== user.email) {
				const existingEmail = await User.findOne({ where: { email: emailClean } });
				if (existingEmail) {
					return res
						.status(400)
						.json({
							message:
								"El correo electrónico ya está registrado.",
						});
				}
			}
			if (documentoClean && documentoClean !== user.documento) {
				const existingDocumento = await User.findOne({
					where: { documento: documentoClean },
				});
				if (existingDocumento) {
					return res
						.status(400)
						.json({ message: "El documento ya está registrado." });
				}
			}
			if (celularClean && celularClean !== user.celular) {
				const existingCelular = await User.findOne({
					where: { celular: celularClean },
				});
				if (existingCelular) {
					return res
						.status(400)
						.json({
							message: "El número de celular ya está registrado.",
						});
				}
			}

                // Asignación directa de campos
                if (emailClean) user.email = emailClean;
                if (nombresClean) user.nombres = nombresClean;
                if (apellidosClean) user.apellidos = apellidosClean;
                if (celularClean) user.celular = celularClean;
                if (documentoClean) user.documento = documentoClean;
                if (tipoDocumentoClean) user.tipoDocumento = tipoDocumentoClean;
                if (estado) user.estado = estado;
                if (titulo_profesional) user.titulo_profesional = titulo_profesional;
                if (foto_perfil) user.foto_perfil = foto_perfil;
                if (documento) user.documento = documento;
                if (tipoDocumento) user.tipoDocumento = tipoDocumento;

			// Si se envía información de empresa, permitir que el administrador la actualice también
			if (req.body.empresa && user.Empresa) {
				let empresaData;
				try {
					empresaData =
						typeof req.body.empresa === "string"
							? JSON.parse(req.body.empresa)
							: req.body.empresa;
				} catch (e) {
					return res
						.status(400)
						.json({ message: "Formato de empresa inválido." });
				}

				const {
					NIT,
					categoria,
					direccion,
					email_empresa,
					estado: estadoEmpresa,
					img_empresa,
					nombre_empresa,
					telefono,
					descripcion,
					sitio_web,
					ciudad_ID,
					departamento_ID,
				} = empresaData;

				// Validaciones únicas para Empresa (NIT y email_empresa)
				try {
					const empresaIdActual = user.Empresa.ID;
					if (NIT && NIT !== user.Empresa.NIT) {
						const nitExistente = await Empresa.findOne({
							where: { NIT, ID: { [Op.ne]: empresaIdActual } },
						});
						if (nitExistente) {
							return res
								.status(400)
								.json({
									message:
										"El NIT de la empresa ya está registrado.",
								});
						}
					}
					if (
						email_empresa &&
						email_empresa !== user.Empresa.email_empresa
					) {
						const emailEmpExistente = await Empresa.findOne({
							where: {
								email_empresa,
								ID: { [Op.ne]: empresaIdActual },
							},
						});
						if (emailEmpExistente) {
							return res
								.status(400)
								.json({
									message:
										"El email de la empresa ya está registrado.",
								});
						}
					}
				} catch (e) {
					return res
						.status(500)
						.json({
							message: "Error validando unicidad de empresa.",
						});
				}

				if (NIT !== undefined) user.Empresa.NIT = NIT;
				if (email_empresa !== undefined)
					user.Empresa.email_empresa = email_empresa;
				if (nombre_empresa !== undefined)
					user.Empresa.nombre_empresa = nombre_empresa;
				if (direccion !== undefined) user.Empresa.direccion = direccion;
				if (categoria !== undefined) user.Empresa.categoria = categoria;
				if (telefono !== undefined) user.Empresa.telefono = telefono;
				if (ciudad_ID !== undefined) user.Empresa.ciudad_ID = ciudad_ID;
				if (estadoEmpresa !== undefined) user.Empresa.estado = estadoEmpresa;
				if (descripcion != undefined) user.descripcion = descripcion;
				if (sitio_web != undefined) user.sitio_web = sitio_web;

				if (req.files?.img_empresa?.[0]) {
					user.Empresa.img_empresa =
						req.files.img_empresa[0].buffer.toString("base64");
				} else if (img_empresa !== undefined) {
					user.Empresa.img_empresa = img_empresa;
				}

				await user.Empresa.save();
			}

                // Detectar cambios comparando snapshot vs valores actuales
                const changedFields = [];
                const labels = {
                    email: 'Correo',
                    nombres: 'Nombres',
                    apellidos: 'Apellidos',
                    celular: 'Celular',
                    documento: 'Documento',
                    estado: 'Estado',
                    titulo_profesional: 'Título profesional',
                    tipoDocumento: 'Tipo de documento',
                    foto_perfil: 'Foto de perfil',
                };
                
                let photoChanged = false;
                for (const key of Object.keys(originalValues)) {
                    if (originalValues[key] !== user[key]) {
                        if (key === 'foto_perfil') {
                            photoChanged = true;
                            // Para foto de perfil, solo indicar que cambió sin mostrar el contenido
                            changedFields.push({ 
                                key, 
                                label: labels[key] || key, 
                                before: originalValues[key] ? 'Imagen anterior' : 'Sin imagen', 
                                after: user[key] ? 'Nueva imagen' : 'Sin imagen'
                            });
                        } else {
                            changedFields.push({ 
                                key, 
                                label: labels[key] || key, 
                                before: originalValues[key], 
                                after: user[key]
                            });
                        }
                    }
                }

			await user.save();

                // Enviar notificación sólo si: el usuario objetivo es Gestor y hubo cambios
                if (user.accountType === 'Gestor' && changedFields.length > 0) {
                    try {
                        await sendProfileUpdateNotification(
                            Number(loggedInUser.id) || null, // remitente (admin)
                            user.ID,                           // destinatario (gestor)
                            {                                 // datos del usuario
                                nombres: user.nombres,
                                apellidos: user.apellidos,
                                email: user.email
                            },
                            changedFields,                     // lista de cambios
                            photoChanged                       // si cambió la foto
                        );
                    } catch (notifyErr) {
                        console.error('Error al enviar notificación de actualización de perfil:', notifyErr);
                        // No romper la actualización del perfil por error de notificación
                    }
                }

			return res
				.status(200)
				.json({ message: "Perfil actualizado con éxito." });
		}

		// EMPRESA puede actualizar su propio perfil - CORREGIDO
		if (
			loggedInUser.accountType === "Empresa" &&
			user.accountType === "Empresa"
		) {
			// Validaciones de campos obligatorios para Empresa
			const camposObligatorios = {
				nombres: nombres,
				apellidos: apellidos,
				celular: celular,
				//documento : NIT,
				email: email,
			};

			const camposVacios = [];
			for (const [campo, valor] of Object.entries(camposObligatorios)) {
				if (
					valor !== undefined &&
					(valor === null || valor === "" || valor.trim() === "")
				) {
					camposVacios.push(campo);
				}
			}

			if (camposVacios.length > 0) {
				return res.status(400).json({
					message: `No se pudo guardar el perfil de empresa. Los siguientes campos son obligatorios y no pueden estar vacíos: ${camposVacios.join(
						", "
					)}. Intente nuevamente.`,
				});
			}

			// Validaciones únicas para Empresa (email y documento/NIT)
			if (email && email !== user.email) {
				const existingEmail = await User.findOne({ where: { email } });
				if (existingEmail) {
					return res
						.status(400)
						.json({
							message:
								"El correo electrónico ya está registrado.",
						});
				}
				user.email = email;
			}
			if (nombres) user.nombres = nombres;
			if (apellidos) user.apellidos = apellidos;
			if (celular) user.celular = celular;
			if (documento && documento !== user.documento) {
				const existingDocumento = await User.findOne({
					where: { documento },
				});
				if (existingDocumento) {
					return res
						.status(400)
						.json({
							message: "El NIT/documento ya está registrado.",
						});
				}
				user.documento = documento;
			}
			// Permitir que Empresa cambie su propio estado
			if (estado) {
				user.estado = estado;
			}
			if (foto_perfil) user.foto_perfil = foto_perfil;

			// Actualizar datos de la empresa - MEJORADO
			if (req.body.empresa && user.Empresa) {
				let empresaData;
				try {
					// Si viene como string, parsearlo, si ya es objeto, usarlo directamente
					empresaData =
						typeof req.body.empresa === "string"
							? JSON.parse(req.body.empresa)
							: req.body.empresa;
				} catch (e) {
					return res
						.status(400)
						.json({ message: "Formato de empresa inválido." });
				}

				const {
					NIT,
					categoria,
					direccion,
					email_empresa,
					estado,
					img_empresa,
					nombre_empresa,
					telefono,
					ciudad_ID,
				} = empresaData;

				// Unicidad NIT y email_empresa cuando Empresa actualiza su Empresa
				const empresaIdActual = user.Empresa.ID;
				if (NIT && NIT !== user.Empresa.NIT) {
					const nitExistente = await Empresa.findOne({
						where: { NIT, ID: { [Op.ne]: empresaIdActual } },
					});
					if (nitExistente) {
						return res
							.status(400)
							.json({
								message:
									"El NIT de la empresa ya está registrado.",
							});
					}
					user.Empresa.NIT = NIT;
				}
				if (
					email_empresa &&
					email_empresa !== user.Empresa.email_empresa
				) {
					const emailEmpExistente = await Empresa.findOne({
						where: {
							email_empresa,
							ID: { [Op.ne]: empresaIdActual },
						},
					});
					if (emailEmpExistente) {
						return res
							.status(400)
							.json({
								message:
									"El email de la empresa ya está registrado.",
							});
					}
					user.Empresa.email_empresa = email_empresa;
				}
				if (nombre_empresa)
					user.Empresa.nombre_empresa = nombre_empresa;
				if (direccion) user.Empresa.direccion = direccion;
				if (categoria) user.Empresa.categoria = categoria;
				if (telefono) user.Empresa.telefono = telefono;
				if (ciudad_ID) user.Empresa.ciudad_ID = ciudad_ID;

				// Procesar imagen de empresa si viene en archivos
				if (req.files?.img_empresa?.[0]) {
					user.Empresa.img_empresa =
						req.files.img_empresa[0].buffer.toString("base64");
				} else if (img_empresa) {
					user.Empresa.img_empresa = img_empresa;
				}

				await user.Empresa.save();
			}

			await user.save();
			return res.status(200).json({
				message: "Perfil de empresa actualizado con éxito.",
				user: {
					id: user.id,
					email: user.email,
					nombres: user.nombres,
					apellidos: user.apellidos,
				},
			});
		}

		// EMPRESA puede actualizar a sus empleados (Aprendiz)
		if (
			loggedInUser.accountType === "Empresa" &&
			user.accountType === "Aprendiz"
		) {
			// Validar que el empleado pertenezca a la empresa logueada
			if (user.empresa_ID !== loggedInUser.empresa_ID) {
				return res
					.status(403)
					.json({
						message:
							"No tienes permiso para actualizar este empleado.",
					});
			}

            // Limpiar valores "null" que vienen del FormData
            const cleanValue = (val) => {
                if (val === "null" || val === null || val === undefined) return null;
                if (typeof val === "string" && val.trim() === "") return null;
                return val;
            };

            const nombresClean = cleanValue(nombres);
            const apellidosClean = cleanValue(apellidos);
            const celularClean = cleanValue(celular);
            const documentoClean = cleanValue(documento);
            const emailClean = cleanValue(email);
            const tipoDocumentoClean = cleanValue(tipoDocumento);

			// Validaciones de campos obligatorios para empleados
			const camposObligatorios = {
				nombres: nombresClean,
				apellidos: apellidosClean,
				celular: celularClean,
				documento: documentoClean,
				email: emailClean,
			};

			const camposVacios = [];
			for (const [campo, valor] of Object.entries(camposObligatorios)) {
				if (
					valor !== undefined &&
					(valor === null || valor === "" || valor.trim() === "")
				) {
					camposVacios.push(campo);
				}
			}

			if (camposVacios.length > 0) {
				return res.status(400).json({
					message: `No se pudo guardar el perfil del empleado. Los siguientes campos son obligatorios y no pueden estar vacíos: ${camposVacios.join(
						", "
					)}. Intente nuevamente.`,
				});
			}

			// Validaciones únicas
			if (emailClean && emailClean !== user.email) {
				const existingEmail = await User.findOne({ where: { email: emailClean } });
				if (existingEmail) {
					return res
						.status(400)
						.json({
							message:
								"El correo electrónico ya está registrado.",
						});
				}
			}
			if (documentoClean && documentoClean !== user.documento) {
				const existingDocumento = await User.findOne({
					where: { documento: documentoClean },
				});
				if (existingDocumento) {
					return res
						.status(400)
						.json({ message: "El documento ya está registrado." });
				}
			}
			if (celularClean && celularClean !== user.celular) {
				const existingCelular = await User.findOne({
					where: { celular: celularClean },
				});
				if (existingCelular) {
					return res
						.status(400)
						.json({
							message: "El número de celular ya está registrado.",
						});
				}
			}

            // Asignación directa de campos
            if (emailClean) user.email = emailClean;
            if (nombresClean) user.nombres = nombresClean;
            if (apellidosClean) user.apellidos = apellidosClean;
            if (celularClean) user.celular = celularClean;
            if (documentoClean) user.documento = documentoClean;
            if (estado) user.estado = estado;
            if (tipoDocumentoClean) user.tipoDocumento = tipoDocumentoClean;
            if (foto_perfil) user.foto_perfil = foto_perfil;

			await user.save();
			return res
				.status(200)
				.json({ message: "Perfil de empleado actualizado con éxito." });
		}

		// APRENDIZ puede actualizar su propio perfil
		if (
			loggedInUser.accountType === "Aprendiz" &&
			user.accountType === "Aprendiz"
		) {
			// Validar que el aprendiz solo pueda actualizar su propio perfil
			if (loggedInUser.id !== parseInt(id)) {
				return res
					.status(403)
					.json({
						message:
							"No tienes permiso para actualizar este perfil.",
					});
			}

			if (email && email !== user.email) {
				const existingEmail = await User.findOne({ where: { email } });
				if (existingEmail) {
					return res
						.status(400)
						.json({
							message:
								"El correo electrónico ya está registrado.",
						});
				}

				// Generar token de verificación
				const payload = { email };

				const verificationToken = generateToken(
					payload,
					process.env.JWT_SECRET,
					5
				);
				user.token = verificationToken;
				user.verificacion_email = false;

				// Enviar correo de verificación
				await sendVerificationEmail(email, verificationToken);
				user.email = email;
			}
			if (nombres) user.nombres = nombres;
			if (apellidos) user.apellidos = apellidos;
			if (celular) user.celular = celular;
			if (documento) user.documento = documento;
			if (estado) user.estado = estado;
			if (titulo_profesional)
				user.titulo_profesional = titulo_profesional;
			if (tipoDocumento) user.tipoDocumento = tipoDocumento;
			if (foto_perfil) user.foto_perfil = foto_perfil;

			await user.save();
			return res
				.status(200)
				.json({
					message:
						"Perfil de aprendiz actualizado con éxito. Por favor verifica tu nuevo correo.",
				});
		}

		// Instructor puede actualizar su propio perfil
		if (
			loggedInUser.accountType === "Instructor" &&
			user.accountType === "Instructor"
		) {
			// Validar que el aprendiz solo pueda actualizar su propio perfil
			if (loggedInUser.id !== parseInt(id)) {
				return res
					.status(403)
					.json({
						message:
							"No tienes permiso para actualizar este perfil.",
					});
			}

			if (email && email !== user.email) {
				const existingEmail = await User.findOne({ where: { email } });
				if (existingEmail) {
					return res
						.status(400)
						.json({
							message:
								"El correo electrónico ya está registrado.",
						});
				}

				// Generar token de verificación
				const payload = { email };

				const verificationToken = generateToken(
					payload,
					process.env.JWT_SECRET,
					5
				);
				user.token = verificationToken;
				user.verificacion_email = false;

				// Enviar correo de verificación
				await sendVerificationEmail(email, verificationToken);
				user.email = email;
			}
			if (nombres) user.nombres = nombres;
			if (apellidos) user.apellidos = apellidos;
			if (celular) user.celular = celular;
			if (documento) user.documento = documento;
			if (estado) user.estado = estado;
			if (titulo_profesional)
				user.titulo_profesional = titulo_profesional;
			if (tipoDocumento) user.tipoDocumento = tipoDocumento;
			if (foto_perfil) user.foto_perfil = foto_perfil;

			await user.save();
			return res
				.status(200)
				.json({
					message:
						"Perfil de aprendiz actualizado con éxito. Por favor verifica tu nuevo correo.",
				});
		}

		return res
			.status(403)
			.json({
				message: "No tienes permiso para actualizar este perfil.",
			});
	} catch (error) {
		console.error("Error al actualizar el perfil del usuario:", error);
		return res
			.status(500)
			.json({ message: "Error al actualizar el perfil del usuario." });
	}
};
// Crear Instructor
const createInstructor = async (req, res) => {
	try {
		console.log("Cuerpo de la solicitud:", req.body);
		console.log("Archivo recibido:", req.file);

		const {
			nombres,
			apellidos,
			titulo_profesional,
			celular,
			email,
			documento,
			estado,
		} = req.body;

		// Procesar imagen de perfil si se sube
		let foto_perfil = null;
		if (req.file) {
			// Guardar la imagen en base64 directamente en la base de datos
			foto_perfil = req.file.buffer.toString("base64");
		}

		// Validar datos obligatorios
		if (
			!nombres ||
			!apellidos ||
			!titulo_profesional ||
			!celular ||
			!email ||
			!documento ||
			!estado
		) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		// Verificar si el correo ya está registrado
		const existingEmail = await User.findOne({ where: { email } });
		if (existingEmail) {
			return res
				.status(400)
				.json({ message: "El correo ya está registrado." });
		}

		// Verificar si el documento ya está registrado
		const existingDocumento = await User.findOne({ where: { documento } });
		if (existingDocumento) {
			return res
				.status(400)
				.json({ message: "El documento ya está registrado." });
		}

		// Generar token de verificación
		const payload = { email };
		const token = generateToken(payload, process.env.JWT_SECRET, 5);

		// Generar contraseña temporal (8 caracteres alfanuméricos)
		const tempPassword =  await generateTempPassword();

		// Encriptar la contraseña temporal
		const hashedPassword = await bcrypt.hash(tempPassword, 10);

		// Crear el instructor
		const newInstructor = await User.create({
			nombres,
			apellidos,
			titulo_profesional,
			celular,
			email,
			documento,
			estado,
			foto_perfil,
			sena_ID: 1, //ID Sena
			accountType: "Instructor", // Tipo de cuenta
			password: hashedPassword, // Contraseña encriptada
			verificacion_email: false, // Estado de verificación
			token, // Token de verificación
		});

		// Enviar correo de verificación CON la contraseña temporal
		await sendVerificationEmail(email, token, null, tempPassword);

		res.status(201).json({
			message:
				"Instructor creado con éxito. Se envió un correo con la información de acceso.",
			instructor: newInstructor,
		});
	} catch (error) {
		console.error("Error al crear el instructor:", error);
		res.status(500).json({ message: "Error al crear el instructor." });
	}
};

// Crear Gestor
const createGestor = async (req, res) => {
	try {
		console.log("Cuerpo de la solicitud:", req.body);
		console.log("Archivo recibido:", req.file);

		const { nombres, apellidos, celular, email, documento, estado } =
			req.body;

		// Procesar imagen de perfil si se sube
		let foto_perfil = null;
		if (req.file) {
			// Guardar la imagen en base64 directamente en la base de datos
			foto_perfil = req.file.buffer.toString("base64");
		}

		// Validar datos obligatorios
		if (
			!nombres ||
			!apellidos ||
			!celular ||
			!email ||
			!documento ||
			!estado
		) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		// Verificar si el correo ya está registrado
		const existingEmail = await User.findOne({ where: { email } });
		if (existingEmail) {
			return res
				.status(400)
				.json({ message: "El correo ya está registrado." });
		}

		// Verificar si el documento ya está registrado
		const existingDocumento = await User.findOne({ where: { documento } });
		if (existingDocumento) {
			return res
				.status(400)
				.json({ message: "El documento ya está registrado." });
		}

		// Generar token de verificación
		const payload = { email };

		const token = generateToken(payload, process.env.JWT_SECRET, 5);

		//Generar la contraseña temporal
		const tempPassword =  await generateTempPassword();

		// Encriptar la contraseña temporal
		const hashedPassword = await bcrypt.hash(tempPassword, 10);

		// Crear el gestor
		const newGestor = await User.create({
			nombres,
			apellidos,
			celular,
			email,
			documento,
			estado,
			foto_perfil,
			sena_ID: 1, // Asignar la sede por defecto
			accountType: "Gestor", // Tipo de cuenta
			password: hashedPassword, // Contraseña encriptada
			verificacion_email: false, // Estado de verificación
			sena_ID: 1,
			token, // Token de verificación
		});

		// Enviar correo de verificación
		await sendVerificationEmail(email, token, null, tempPassword);

		res.status(201).json({
			message:
				"Gestor creado con éxito. Se envió un correo con la información de acceso.",
			gestor: newGestor,
		});
	} catch (error) {
		console.error("Error al crear el gestor:", error);
		if (error.name === "SequelizeUniqueConstraintError") {
			const campos = (error.errors || [])
				.map((e) => e.path)
				.filter(Boolean);
			return res.status(409).json({
				message: "Datos duplicados al crear el gestor.",
				detalles: campos.length
					? `Campos en conflicto: ${campos.join(", ")}`
					: undefined,
			});
		}
		if (error.name === "SequelizeValidationError") {
			const detalles = (error.errors || []).map((e) => ({
				campo: e.path,
				mensaje: e.message,
			}));
			return res.status(400).json({
				message: "Validación fallida al crear el gestor.",
				errores: detalles,
			});
		}
		return res
			.status(500)
			.json({
				message: `Error al crear el gestor: ${
					error.message || "desconocido"
				}`,
			});
	}
};

// Consultar Empleados por Empresa
const getAprendicesByEmpresa = async (req, res) => {
	try {
		// Verifica el token y obtiene el usuario logueado
		const token = req.cookies.accessToken;
		if (!token) {
			return res
				.status(401)
				.json({ message: "No autorizado. Debes iniciar sesión." });
		}

		const loggedInUser = jwt.verify(
			token,
			process.env.JWT_SECRET || "secret"
		);
		if (!loggedInUser || loggedInUser.accountType !== "Empresa") {
			return res
				.status(403)
				.json({
					message:
						"Solo las empresas pueden acceder a esta información.",
				});
		}

		// Busca la empresa asociada al usuario logueado
		const empresaUser = await User.findByPk(loggedInUser.id, {
			include: [{ model: Empresa, as: "Empresa" }],
		});

		if (!empresaUser || !empresaUser.empresa_ID) {
			return res
				.status(404)
				.json({ message: "Empresa no encontrada o no asociada." });
		}

		// Busca los aprendices relacionados con la empresa
		const aprendices = await User.findAll({
			where: {
				accountType: "Aprendiz",
				empresa_ID: empresaUser.empresa_ID,
			},
			attributes: {
				exclude: [
					"password",
					"token",
					"resetPasswordToken",
					"resetPasswordExpires",
				],
			},
		});

		res.status(200).json(aprendices);
	} catch (error) {
		console.error("Error al obtener los aprendices de la empresa:", error);
		res.status(500).json({
			message: "Error al obtener los aprendices de la empresa.",
		});
	}
};

// Crear múltiples usuarios desde un archivo Excel
const createMasiveUsers = async (req, res) => {
    
    try {
        const {empresaId} = req.params;

        if (!empresaId) {
            return res.status(400).json({message : "No se tiene el id de la empresa"})
        }
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }

		const Archivo = req.file.buffer;
		// Leer el archivo con xlsx
		const workbook = xlsx.read(Archivo, { type: "buffer" });

		// Obtener la primera hoja
		const nombrePrimeraHoja = workbook.SheetNames[0];
		const hoja = workbook.Sheets[nombrePrimeraHoja];

        if (!hoja) {
            return res.status(400).json({ message: 'El archivo no contiene hojas válidas.' });
        }
       
        const usuarios = xlsx.utils.sheet_to_json(hoja)
        if (usuarios === 0){
            return res.status(400).json({message : "El archivo esta vacio o no contiene datos"})
        }
        console.log(usuarios)
        
        // verificar las columnas necesarias
        const columnasRequeridas = ["nombres", "apellidos", "email", "documento", "celular"]
        const columnasArchivo = Object.keys(usuarios[0])

        const columnasFaltantes = columnasRequeridas.filter(
            (col) => !columnasArchivo.includes(col)
        )

        if (columnasFaltantes.length > 0) {
            return res.status(400).json({
                message: `Faltan columnas requeridas en el archivo o faltan datos: ${columnasFaltantes.join(", ")}`
            })
        }
        
        const filasFaltantes = usuarios.filter((u, index) =>{
            return (
                !u.nombres ||
                !u.apellidos ||
                !u.email ||
                !u.documento ||
                !u.celular ||
                u.nombres.toString().trim() === "" ||
                u.apellidos.toString().trim() === "" ||
                u.email.toString().trim() === "" ||
                u.documento.toString().trim() === "" ||
                u.celular.toString().trim() === ""
            )
        })
        
        if (filasFaltantes.length > 0) {
            return res.status(400).json({
                message : "Algunas filas tienen datos incompletos",
                ejemplo : filasFaltantes.slice(0,3)
            })
        }
       const usuariosLimpios = await Promise.all(
            usuarios.map(async (u) =>{
                const tempPassword = Math.random().toString(36).slice(-8);
                console.log(tempPassword)
                const hashedPassword = await bcrypt.hash(tempPassword, 10)
                return {
                    nombres : u.nombres?.trim(),
                    apellidos : u.apellidos?.trim(),
                    email : u.email?.toLowerCase(),
                    documento : String(u.documento).trim(),
                    celular : String(u.celular).trim(), 
                    password : hashedPassword,
                    accountType : "Aprendiz",
                    empresa_ID : empresaId,
                    passwordP : tempPassword
                }
            })
       )

        // Verificar si hay usuarios duplicados en el archivo
        const duplicados = usuariosLimpios.filter((item, index) => usuariosLimpios.indexOf(item) !== index);
        if (duplicados.length > 0) {
            // Excepción: permitir duplicados si son valores vacíos ("")
            const duplicadosFiltrados = duplicados.filter(item => item !== "");

			if (duplicadosFiltrados.length > 0) {
				return res.status(400).json({
					message:
						"El archivo contiene usuarios duplicados no permitidos.",
					duplicados: duplicadosFiltrados,
				});
			}
		}

        // Verificar si hay usuarios repetidos en la base de datos antes de crear
        const emails = usuariosLimpios.map((e) =>{
            return {
                email : e.email,
                accountType : e.accountType,
                password : e.passwordP
            }
        })
        
        const emailList = await Promise.all(
            emails.map( async (e) =>{
                const newEmail = e.email
                const payload = { data: { newEmail } };
                const  token = generateToken(payload, process.env.JWT_SECRET, 5)
                return {
                    email : newEmail,
                    token : token,
                    accountType : e.accountType,
                    password : e.password,
                    masive: true
                }
            })
        )
        delete usuariosLimpios.passwordP
        const emails2 = emails.map((e) =>{return e.email})
        const existingUsers = await User.findAll({ where: { email: emails2 } });
        if (existingUsers.length > 0) {
            const repetidos = existingUsers.map(user => user.email);
            return res.status(409).json({
                message: "Existen usuarios repetidos en la base de datos.",
                repetidos
            });
        }
        // Crear usuarios con los datos extraídos 
        await  User.bulkCreate(usuariosLimpios, {ignoreDuplicates : true})

		await Promise.all(
			emailList.map((list) => {
				sendVerificationEmail(list.email, list.token, list.password , list.accountType, list.masive);
			})
		);

		return res
			.status(200)
			.json({ menssage: "se insertaron los usuarios con exito" });
	} catch (error) {
		console.error("Error al procesar el archivo:", error);
		return res.status(500).json({ error: "Error al procesar el archivo" });
	}
};

// Consultar empleados (aprendices) por empresa_ID
const getEmpleadosByEmpresaId = async (req, res) => {
	try {
		const { empresaId } = req.params;

		if (!empresaId) {
			return res
				.status(400)
				.json({ message: "El ID de la empresa es obligatorio." });
		}

		// Buscar aprendices que tengan el empresa_ID igual al proporcionado
		const empleados = await User.findAll({
			where: {
				accountType: "Aprendiz",
				empresa_ID: empresaId,
			},
			attributes: {
				exclude: [
					"password",
					"token",
					"resetPasswordToken",
					"resetPasswordExpires",
				],
			},
		});

		res.status(200).json({ success: true, empleados });
	} catch (error) {
		console.error("Error al obtener los empleados de la empresa:", error);
		res.status(500).json({
			message: "Error al obtener los empleados de la empresa.",
		});
	}
};

// Crear empleado (Aprendiz) asociado a una empresa
const createEmpleado = async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			email,
			tipoDocumento,
			documento,
			celular,
			estado,
			titulo_profesional,
			password,
		} = req.body;
		const { empresaId } = req.params;

		// Validar datos obligatorios
		if (
			!nombres ||
			!apellidos ||
			!email ||
			!tipoDocumento ||
			!documento ||
			!celular ||
			!estado ||
			!empresaId
		) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		// Verificar si el correo ya está registrado
		const existingEmail = await User.findOne({ where: { email } });
		if (existingEmail) {
			return res
				.status(400)
				.json({ message: "El correo ya está registrado." });
		}

		// Verificar si el documento ya está registrado
		const existingDocumento = await User.findOne({ where: { documento } });
		if (existingDocumento) {
			return res
				.status(400)
				.json({ message: "El documento ya está registrado." });
		}

		// Verificar que la empresa exista
		const empresa = await Empresa.findByPk(empresaId);
		if (!empresa) {
			return res.status(404).json({ message: "Empresa no encontrada." });
		}

		// Procesar imagen de perfil si se sube
		let foto_perfil = null;
		if (req.file) {
			foto_perfil = req.file.buffer.toString("base64");
		}

		// Generar token de verificación
		const payload = { email };

		const token = generateToken(payload, process.env.JWT_SECRET, 5);

        //Generar contraseña temporal
        const tempPassword = password == null || password == undefined ? await generateTempPassword() : password;

		// Encriptar la contraseña (si no se envía, usar una por defecto)
		const hashedPassword = await bcrypt.hash(
			tempPassword,
			10
		);

		// Crear el empleado (Aprendiz)
		const newEmpleado = await User.create({
			nombres,
			apellidos,
			email,
			tipoDocumento,
			documento,
			celular,
			estado,
			titulo_profesional: titulo_profesional || null,
			foto_perfil,
			accountType: "Aprendiz",
			empresa_ID: empresaId,
			password: hashedPassword,
			verificacion_email: false,
			token,
		});

		// Enviar correo de verificación
        if(password == null || password == undefined){
            await sendVerificationEmail(email, token, "Aprendiz", tempPassword);
        }else{
    		await sendVerificationEmail(email, token);
        }
            

		res.status(201).json({
			message: "Empleado creado con éxito. Por favor verifica tu correo.",
			empleado: newEmpleado,
		});
	} catch (error) {
		console.error("Error al crear el empleado:", error);
		res.status(500).json({ message: "Error al crear el empleado." });
	}
};

// Obtener todos los empleados para administradores con filtros avanzados
const getAllEmpleadosForAdmin = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			search = "",
			empresaId = "",
			estado = "",
			tipoDocumento = "",
		} = req.query;

		const offset = (page - 1) * limit;

		// Construir condiciones de búsqueda
		const whereConditions = {
			accountType: "Aprendiz",
		};

		// Filtro por empresa
		if (empresaId) {
			whereConditions.empresa_ID = empresaId;
		}

		// Filtro por estado
		if (estado) {
			whereConditions.estado = estado;
		}

		// Filtro por tipo de documento
		if (tipoDocumento) {
			whereConditions.tipoDocumento = tipoDocumento;
		}

		// Búsqueda por nombre, apellido, documento o email
		if (search) {
			whereConditions[Op.or] = [
				{ nombres: { [Op.like]: `%${search}%` } },
				{ apellidos: { [Op.like]: `%${search}%` } },
				{ documento: { [Op.like]: `%${search}%` } },
				{ email: { [Op.like]: `%${search}%` } },
			];
		}

		// Obtener empleados con información de empresa
		const { count, rows: empleados } = await User.findAndCountAll({
			where: whereConditions,
			include: [
				{
					model: Empresa,
					as: "Empresa",
					attributes: ["ID", "nombre_empresa", "NIT"],
				},
			],
			attributes: {
				exclude: [
					"password",
					"token",
					"resetPasswordToken",
					"resetPasswordExpires",
				],
			},
			limit: parseInt(limit),
			offset: parseInt(offset),
			order: [["nombres", "ASC"]],
		});

		const totalPages = Math.ceil(count / limit);

		let listaEmpleados = []

		for (let empleado of empleados) {
			const cursos =
				(await InscripcionCurso.findAll({
					where: {
						aprendiz_ID: empleado.ID
					},
					include: [
						{
							model: Curso,
							attributes: ["nombre_curso"]
						}
					]
				})).map((c) => c.dataValues.Curso.dataValues.nombre_curso)
			listaEmpleados.push({
				...empleado.dataValues,
				cursos
			})
		}

		res.status(200).json({
			success: true,
			empleados: listaEmpleados,// TODO,
			pagination: {
				currentPage: parseInt(page),
				totalPages,
				totalItems: count,
				itemsPerPage: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Error al obtener empleados para administrador:", error);
		res.status(500).json({ message: "Error al obtener los empleados." });
	}
};

// Obtener todas las empresas para el selector de administradores
const getAllEmpresasForAdmin = async (req, res) => {
	try {
		const empresas = await Empresa.findAll({
			attributes: ["ID", "nombre_empresa", "NIT", "estado"],
			where: { estado: "activo" },
			order: [["nombre_empresa", "ASC"]],
		});

		res.status(200).json({ success: true, empresas });
	} catch (error) {
		console.error("Error al obtener empresas:", error);
		res.status(500).json({ message: "Error al obtener las empresas." });
	}
};

// Crear empleado para cualquier empresa (solo administradores)
const createEmpleadoForAdmin = async (req, res) => {
	try {
		const {
			nombres,
			apellidos,
			email,
			tipoDocumento,
			documento,
			celular,
			estado,
			titulo_profesional,
			password,
			empresaId,
		} = req.body;

		// Validar datos obligatorios
		if (
			!nombres ||
			!apellidos ||
			!email ||
			!tipoDocumento ||
			!documento ||
			!celular ||
			!estado ||
			!empresaId
		) {
			return res
				.status(400)
				.json({ message: "Todos los campos son obligatorios." });
		}

		// Verificar si el correo ya está registrado
		const existingEmail = await User.findOne({ where: { email } });
		if (existingEmail) {
			return res
				.status(400)
				.json({ message: "El correo ya está registrado." });
		}

		// Verificar si el documento ya está registrado
		const existingDocumento = await User.findOne({ where: { documento } });
		if (existingDocumento) {
			return res
				.status(400)
				.json({ message: "El documento ya está registrado." });
		}

		// Verificar que la empresa exista
		const empresa = await Empresa.findByPk(empresaId);
		if (!empresa) {
			return res.status(404).json({ message: "Empresa no encontrada." });
		}

		// Procesar imagen de perfil si se sube
		let foto_perfil = null;
		if (req.file) {
			foto_perfil = req.file.buffer.toString("base64");
		}

		// Generar token de verificación
		const payload = { email };
		const token = generateToken(payload, process.env.JWT_SECRET, 5);

        //Generar contraseña temporal
        const tempPassword = await generateTempPassword();

		const hashedPassword = await bcrypt.hash(
			tempPassword,
			10
		);

		// Crear el empleado (Aprendiz)
		const newEmpleado = await User.create({
			nombres,
			apellidos,
			email,
			tipoDocumento,
			documento,
			celular,
			estado,
			titulo_profesional: titulo_profesional || null,
			foto_perfil,
			accountType: "Aprendiz",
			empresa_ID: empresaId,
			password: hashedPassword,
			verificacion_email: false,
			token,
		});

		// Enviar correo de verificación
		await sendVerificationEmail(email, token, "Aprendiz", tempPassword);

		res.status(201).json({
			message: "Empleado creado con éxito. Por favor verifica tu correo.",
			empleado: newEmpleado,
		});
	} catch (error) {
		console.error("Error al crear el empleado:", error);
		res.status(500).json({ message: "Error al crear el empleado." });
	}
};

//validacion de tipo de documento y numero de documento por pdf del documento cargado
const detectarTextoOCR = async (imagePath) => {
	const client = new vision.ImageAnnotatorClient();
	const imageBuffer = fs.readFileSync(imagePath);
	const [result] = await client.textDetection({
		image: { content: imageBuffer },
	});
	return result.fullTextAnnotation.text || "";
};

const subirDocumentoIdentidad = async (req, res) => {
	try {
		const userId = req.params.id;
		const pdfFile = req.file;

		if (!pdfFile)
			return res
				.status(400)
				.json({ message: "No se ha enviado ningún archivo." });

		// Guardar PDF
		const pdfFileName = `documento_${Date.now()}.pdf`;
		const pdfPath = path.join(
			__dirname,
			"../uploads/documentos",
			pdfFileName
		);
		fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
		fs.writeFileSync(pdfPath, pdfFile.buffer);

		const tempDir = path.join(__dirname, "../uploads/temp");
		fs.mkdirSync(tempDir, { recursive: true });

		async function pdfToPng(pdfPath, outDir) {
			// Cargar el PDF
			const pdf = await pdfjsLib.getDocument({ url: pdfPath }).promise;

			// Obtener la primera página
			const page = await pdf.getPage(1);

			// Definir escala (más grande = mejor resolución)
			const viewport = page.getViewport({ scale: 1.5 });

			// Crear canvas
			const canvas = createCanvas(viewport.width, viewport.height);
			const context = canvas.getContext("2d");

			// Renderizar página en el canvas
			await page.render({ canvasContext: context, viewport }).promise;

			// Exportar como PNG (buffer en memoria)
			const imageBuffer = canvas.toBuffer("image/png");

			// Guardar en disco
			const imagePath = path.join(outDir, "page-1.png");
			fs.writeFileSync(imagePath, imageBuffer);

			return imagePath;
		}

		//Guardar como imagen PNG
		const imagePath = await pdfToPng(pdfPath, tempDir);

		// Realizar OCR con Google Vision
		const rawText = await detectarTextoOCR(imagePath);
		const lowerText = rawText
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");

		// Detectar tipo de documento
		let tipoDetectado = "pendiente";
		if (/cedula\s+de\s+ciudadania/.test(lowerText))
			tipoDetectado = "CedulaCiudadania";
		else if (/tarjeta\s+de\s+identidad/.test(lowerText))
			tipoDetectado = "TarjetaIdentidad";
		else if (
			/permiso\s+por\s+proteccion\s+temporal/.test(lowerText) ||
			/\bppt\b/.test(lowerText)
		)
			tipoDetectado = "PPT";
		else if (
			/cedula\s+de\s+extranjeria/.test(lowerText) ||
			/extranjero/.test(lowerText)
		)
			tipoDetectado = "CedulaExtranjeria";

		// Detectar número de documento después de palabras clave
		let documento = null;
		const lines = rawText.split(/\r?\n/);
		const keywords = ["número", "numero", "nuip", "n°", "no", "#"];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].toLowerCase();
			for (const key of keywords) {
				if (line.includes(key)) {
					const words = lines[i].split(/\s+/);
					const index = words.findIndex((w) =>
						w.toLowerCase().includes(key)
					);
					if (index !== -1) {
						for (let j = index + 1; j < words.length; j++) {
							const clean = words[j].replace(/\./g, ""); // eliminar puntos
							const numMatch = clean.match(/^\d{6,12}$/);
							if (numMatch) {
								documento = numMatch[0];
								break;
							}
						}
					}
				}
				if (documento) break;
			}
			if (documento) break;
		}

		// Actualizar el usuario
		await User.update(
			{
				pdf_documento: pdfFileName,
				tipoDocumento: tipoDetectado,
				documento: documento || null,
			},
			{ where: { ID: userId } }
		);

		res.status(200).json({
			message: "Documento procesado con OCR",
			tipoDetectado,
			documento: documento || "No detectado",
		});
	} catch (error) {
		console.error("Error al procesar documento:", error);
		res.status(500).json({
			message: "Error al procesar el documento con OCR.",
		});
	}
};

const checkProfileComplete = async (req, res) => {
	try {
		const token = req.cookies.accessToken;
		if (!token) {
			return res.status(401).json({ message: "No autorizado" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
		const user = await User.findByPk(decoded.id, {
			include: [{ model: Empresa, as: "Empresa" }],
		});

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		let isComplete = true;
		let missingFields = [];

		// Validar según tipo de cuenta
		if (user.accountType === "Aprendiz") {
			const required = ["nombres", "apellidos", "celular", "email"];
			missingFields = required.filter((field) => !user[field]);
			isComplete = missingFields.length === 0;
		} else if (user.accountType === "Empresa" && user.Empresa) {
			const required = [
				"nombre_empresa",
				"NIT",
				"direccion",
				"telefono",
				"email_empresa",
			];
			missingFields = required.filter((field) => !user.Empresa[field]);
			isComplete = missingFields.length === 0;
		}

		res.json({
			isComplete,
			missingFields,
			accountType: user.accountType,
			userId: user.id,
		});
	} catch (error) {
		console.error("Error verificando perfil:", error);
		res.status(500).json({ message: "Error verificando perfil" });
	}
};

const createEmpresa = async (req, res) => {
    try {
        const {
            nombre_empresa,
            NIT,
            categoria,
            direccion,
            telefono,
			descripcion,
            email_empresa,
            departamento_ID,
            ciudad_ID,
            estado = 'activo',
			sitio_web
        } = req.body;

		const { email } = req.params;

		console.log(email)

		if(!email){
			return res.status(400).json({
				message: 'Es necesario el email del manager'
			})
		}

        // Validar datos obligatorios
        if (!nombre_empresa || !NIT || !categoria || !direccion || !telefono || !email_empresa || !ciudad_ID) {
            return res.status(400).json({ 
                message: 'Todos los campos marcados con * son obligatorios' 
            });
        }

		let newEmpresa = { ...req.body};

        // Procesar imagen si se sube
        if (req.file) {
            newEmpresa.image = req.file.buffer.toString('base64');
        } else if (req.body.img_empresa) {
            newEmpresa.image = req.body.img_empresa;
        }

        // Crear la empresa
		const nuevaEmpresa = await UserServices.CreateEmpresaByAdmin(email, newEmpresa);

        res.status(201).json({ 
            message: 'Empresa creada con éxito',
            empresa: nuevaEmpresa 
        });

    } catch (error) {
        console.error('Error al crear empresa:', error);
        
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ 
                message: 'Error de validación', 
                errors 
            });
        }
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                message: 'La ciudad o departamento seleccionado no existe' 
            });
        }

        res.status(500).json({ 
            message: 'Error interno al crear la empresa',
            error: error.message 
        });
      }
};

const changeRole = async (req, res) => {
	try {
		const { id } = req.params
		const { role } = req.body
		const adminId = req.user.id

		const user = await Usuario.findByPk(id)

		if (!user) {
			return res.status(200).json({
				message: "El usuario no existe"
			})
		}

		if (!role) {
			return res.status(401).json({
				message: "Se debe especificar el rol"
			})
		}

		if (role === 'Empresa') {
			return res.status(401).json({
				message: "No se puede cambiar el rol del usuario a empresa"
			})
		}

		user.update({
			accountType: role
		})

		addHistorial(adminId, {
			usuario: id
		}, `El administrador [nombre] ([id]) ha cambiado el rol de "[usuario]" ([usuario_id]) a ${role}`)

		res.status(200).json({
			message: "Se ha actualizado el usuario con exito"
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({
			message: "Error interno al cambiar el rol del usuario",
			error: error.message
		})		
	}
}

module.exports = {
	subirDocumentoIdentidad,
	getEmpresaById,
	createEmpleado,
	getEmpleadosByEmpresaId,
	refreshAccessToken,
	getAprendicesByEmpresa,
	registerUser,
	verifyEmail,
	loginUser,
	requestPasswordReset,
	resetPassword,
	getAllUsers,
	getUserProfile,
	getAprendices,
	getEmpresas,
	getInstructores,
	getGestores,
	updateUserProfile,
	createInstructor,
	createGestor,
	logoutUser,
	cleanExpiredTokens,
	createMasiveUsers,
	getEmpresaByNIT,
	requestNewVerificationEmail,
	checkProfileComplete,
	recordLogin,
	getAllEmpleadosForAdmin,
	getAllEmpresasForAdmin,
	createEmpleadoForAdmin,
    createEmpresa,
	changeRole
};
