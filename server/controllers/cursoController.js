const Curso = require("../models/curso");
const User = require("../models/User");
const Empresa = require('../models/empresa'); // Importar el modelo Empresa
const Notificacion = require('../models/Notificacion');
const path = require("path");
const AsignacionCursoInstructor = require("../models/AsignacionCursoInstructor");
const { sendCourseCreatedEmail, sendCursoUpdatedByManagerNotification, sendStudentsInstructorAssignedEmail, sendInstructorAssignedEmail, sendInstructorUnassignedEmail } = require("../services/emailService");
const { Router } = require("express");
const upload = require("../config/multer");
const { sendCursoUpdatedNotification } = require('../services/emailService');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const InscripcionCurso = require('../models/InscripcionCurso');
const InvitacionCurso = require('../models/InvitacionCurso');
const Usuario = require("../models/User");
const { sendNotification, sendNotifiCursoApi } = require("../services/notificationService");


let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

// Asignar un instructor a un curso
const asignarInstructorAlCurso = async (req, res) => {
	const transaction = await dbInstance.sequelize.transaction();

	try {
        const { instructor_ID, curso_ID, force } = req.body;

        // Permisos: solo Admin o Gestor
        const { accountType } = req.user || {};
        if (accountType !== 'Administrador' && accountType !== 'Gestor') {
            await transaction.rollback();
            return res.status(403).json({ message: 'No tienes permisos para asignar instructores.' });
        }

		if (!instructor_ID || !curso_ID) {
			return res.status(400).json({ message: "El ID del instructor y del curso son obligatorios." });
		}

		// Validar existencia del instructor
		const instructor = await Usuario.findByPk(instructor_ID, { transaction });
		if (!instructor || instructor.accountType !== "Instructor") {
			await transaction.rollback();
			return res.status(404).json({ message: "Instructor no encontrado o no válido" });
		}

		// Validar disponibilidad (estado activo)
		if (instructor.estado !== 'activo') {
			await transaction.rollback();
			return res.status(409).json({ message: "El instructor no está disponible (estado inactivo)." });
		}

        // Validar existencia del curso (incluir Instructor para lecturas posteriores si se requiere)
        const curso = await Curso.findByPk(curso_ID, { transaction });
		if (!curso) {
			await transaction.rollback();
			return res.status(404).json({ message: "Curso no encontrado" });
		}

        // Verificar si ya existe una asignación para este instructor y curso
        const asignacionExistente = await AsignacionCursoInstructor.findOne({
            where: { instructor_ID, curso_ID },
            transaction
        });

        if (asignacionExistente) {
            // Si fue rechazada previamente, permitir recuperar con confirmación
            if (asignacionExistente.estado === 'rechazada') {
                if (!force) {
                    await transaction.rollback();
                    return res.status(409).json({
                        message: 'Este instructor ya rechazó previamente la invitación para este curso. ¿Desea asignarlo nuevamente?',
                        code: 'REJECTED_EXISTS'
                    });
                }
                // Actualizar a aceptada
                asignacionExistente.estado = 'aceptada';
                asignacionExistente.fecha_asignacion = new Date();
                await asignacionExistente.save({ transaction });

                // Actualizar curso con el instructor
                curso.instructor_ID = instructor_ID;
                await curso.save({ transaction });

                await transaction.commit();

                // Notificación in-app al instructor por reasignación
                try {
                    const remitenteId = Number(req.user?.ID) || Number(instructor_ID);
                    await Notificacion.create({
                        remitente_ID: remitenteId,
                        destinatario_ID: instructor_ID,
                        usuario_ID: instructor_ID,
                        tipo: 'curso_asignado',
                        titulo: `Asignación al curso ${curso.nombre_curso}`,
                        mensaje: `Has sido asignado nuevamente al curso "${curso.nombre_curso}".`,
                        estado: 'pendiente',
                    });
                } catch (e) {
                    console.warn('No se pudo crear notificación in-app (reasignación):', e?.message);
                }

                return res.status(200).json({
                    message: 'Instructor reasignado (estado actualizado a aceptada).',
                    asignacion: asignacionExistente,
                    curso
                });
            }
            await transaction.rollback();
            return res.status(400).json({ message: "El instructor ya está asignado a este curso." });
        }

        // Validar si el curso ya tiene otro instructor asignado
        if (curso.instructor_ID && Number(curso.instructor_ID) !== Number(instructor_ID)) {
            const instructorActual = await Usuario.findByPk(curso.instructor_ID, { attributes: ['ID', 'nombres', 'apellidos'], transaction });
            await transaction.rollback();
            return res.status(409).json({
                message: 'El curso ya tiene un instructor asignado.',
                conflictWith: instructorActual ? { id: instructorActual.ID, nombre: `${instructorActual.nombres || ''} ${instructorActual.apellidos || ''}`.trim() } : { id: curso.instructor_ID }
            });
        }

        // Crear la asignación en la tabla asignacion_curso_instructor
		const nuevaAsignacion = await AsignacionCursoInstructor.create({
			instructor_ID,
			curso_ID,
			estado: 'aceptada',
			fecha_asignacion: new Date()
		}, { transaction });

		// Actualizar el curso con el instructor asignado
		curso.instructor_ID = instructor_ID;
		await curso.save({ transaction });

        await transaction.commit();

        // Notificación in-app al instructor por nueva asignación
        try {
            const remitenteId = Number(req.user?.ID) || Number(instructor_ID);
            await Notificacion.create({
                remitente_ID: remitenteId,
                destinatario_ID: instructor_ID,
                usuario_ID: instructor_ID,
                tipo: 'curso_asignado',
                titulo: `Asignación al curso ${curso.nombre_curso}`,
                mensaje: `Has sido asignado al curso "${curso.nombre_curso}".`,
                estado: 'pendiente',
            });
        } catch (e) {
            console.warn('No se pudo crear notificación in-app (asignación):', e?.message);
        }

        // Notificar por email al instructor y a los aprendices (best-effort)
        try {
            const findInstructor = await User.findByPk(instructor_ID, { attributes: ['email', 'nombres', 'apellidos'] });
            const cursoInfo = await Curso.findByPk(curso_ID);
            if (findInstructor?.email && cursoInfo) {
                await sendInstructorAssignedEmail(findInstructor.email, cursoInfo);
                // Notificar a aprendices activos del curso
                const inscripciones = await dbInstance.InscripcionCurso.findAll({
                    where: { curso_ID, estado_inscripcion: 'activo' },
                    include: [{ model: dbInstance.Usuario, as: 'aprendiz', attributes: ['email'] }]
                });
                const emailsAprendices = inscripciones.map(i => i?.aprendiz?.email).filter(Boolean);
                const nombreInstructor = `${findInstructor.nombres || ''} ${findInstructor.apellidos || ''}`.trim();
                if (emailsAprendices.length > 0) {
                    await sendStudentsInstructorAssignedEmail(emailsAprendices, cursoInfo, nombreInstructor);
                }
            }
        } catch (e) {
            console.warn('No se pudieron enviar emails de notificación:', e?.message);
        }

        res.status(200).json({
			message: "Instructor asignado correctamente al curso.",
			asignacion: nuevaAsignacion,
			curso
		});
	} catch (error) {
		await transaction.rollback();
		console.error("Error al asignar instructor al curso:", error);
		res.status(500).json({ message: "Error interno al asignar el instructor al curso." });
	}
};

//consultar cursos asignador a un instructor
const obtenerCursosAsignadosAInstructor = async (req, res) => {
	const { instructor_ID } = req.params;

	try {
		if (!instructor_ID) {
			return res
				.status(400)
				.json({ mensaje: "El ID del instructor es obligatorio" });
		}
		const asignaciones = await AsignacionCursoInstructor.findAll({
			where: {
				[Sequelize.Op.and]: [
					{instructor_ID: instructor_ID},
					{estado: "aceptada"}
				]
			},
			include: [
				{
					model: Curso,
					attributes: ["ID", "nombre_curso", "descripcion", "imagen", "ficha"],
				}
			]
		});
		res.status(200).json(asignaciones);
	} catch (error) {
		console.error("Error al obtener los cursos asignados:", error);
		res
			.status(500)
			.json({ mensaje: "Error interno al obtener los cursos asignados" });
	}
};

// Crear un curso (solo para administradores)
const createCurso = async (req, res) => {
	try {
		const { accountType } = req.user; // ← ESTA LÍNEA TIENE EL PROBLEMA
		console.log("Este es el tipo de cuenta", accountType);
		
		if (accountType !== "Administrador" && accountType !== "Gestor" && accountType !== "Instructor") {
			return res.status(403).json({ message: "No tienes permisos para crear cursos" });
		}

		const {
			nombre_curso,
			descripcion,
			tipo_oferta,
			ficha,
			estado,
			fecha_inicio,
			fecha_fin,
			hora_inicio,
			hora_fin,
			dias_formacion,
			lugar_formacion,
			slots_formacion,
			cupos_disponibles,
			duracion_dias,
			modalidad,
			empresa_ID // Esperado solo si tipo_oferta es "Cerrada"
		} = req.body;

		// ✅ Validación estricta del tipo de oferta
		const tipoOfertaValida = ["Cerrada", "Abierta"];
		if (!tipoOfertaValida.includes(tipo_oferta)) {
			return res.status(400).json({
				message: "El tipo de oferta debe ser 'Cerrada' o 'Abierta'."
			});
		}

		// ✅ Validación de empresa_ID si es oferta cerrada
		let finalEmpresaID = null;
		if (tipo_oferta === "Cerrada") {
			if (!empresa_ID || isNaN(Number(empresa_ID))) {
				return res.status(400).json({
					message: "Debe proporcionar un ID de empresa válido para una oferta cerrada."
				});
			}

			const empresa = await Empresa.findByPk(empresa_ID);

			if (!empresa) {
				return res.status(404).json({
					message: `No se encontró una empresa con el ID ${empresa_ID}.`
				});
			}

			finalEmpresaID = empresa_ID;
		}

		// ✅ Validaciones generales del curso
		if (!ficha || isNaN(Number(ficha))) {
			return res.status(400).json({ message: "El campo ficha es obligatorio y debe ser un número." });
		}

		const cursoExistente = await Curso.findOne({ where: { ficha } });
		if (cursoExistente) {
			return res.status(409).json({ message: "Ya existe un curso con la misma ficha." });
		}

		if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
			return res.status(400).json({ message: "La fecha de inicio debe ser anterior a la fecha de fin." });
		}

		if (typeof dias_formacion !== 'string') {
			return res.status(400).json({ message: "El campo dias_formacion debe ser un string." });
		}

		let image = null;
		if (req.file) {
			image = req.file.buffer.toString('base64');
		}

		let slotsFormacionString = null;
		if (slots_formacion) {
			slotsFormacionString = Array.isArray(slots_formacion)
				? JSON.stringify(slots_formacion)
				: slots_formacion;
		}

		const sena_ID = 1;

		// ✅ Crear el curso
		const nuevoCurso = await Curso.create({
			nombre_curso,
			descripcion,
			tipo_oferta,
			ficha,
			estado,
			fecha_inicio,
			fecha_fin,
			hora_inicio,
			hora_fin,
			dias_formacion,
			lugar_formacion,
			imagen: image,
			sena_ID,
			empresa_ID: finalEmpresaID,
			slots_formacion: slotsFormacionString,
			duracion_dias,
			cupos_disponibles,
			modalidad
		});

		res.status(201).json({ message: "Curso creado con éxito.", curso: nuevoCurso });

		// ✅ Enviar notificación por email (opcional)
		const usuarios = await User.findAll({
			where: {
				verificacion_email: true,
				accountType: { [Op.or]: ['Empresa', 'Aprendiz'] },
			},
			attributes: ['email'],
		});

		const Idcurso = await Curso.findByPk(nuevoCurso.ID, { attributes: ['ID'] }).then(c => c.ID);

		if(Idcurso == null){
			res.status(500).json({ message: "Error al obtener el curso recién creado." });
			return;
		}

		const emails = usuarios.map(user => user.email);
		if (emails.length > 0) {
			const courseLink = `http://localhost:5173/cursos/${Idcurso}`;
			await sendCourseCreatedEmail(emails, nombre_curso, courseLink, descripcion, estado);
			await sendNotifiCursoApi(nombre_curso, emails, fecha_inicio, fecha_fin, estado);
		}

	} catch (error) {
		console.error("Error al crear el curso:", error);

		if (error.name === "SequelizeValidationError") {
			return res.status(400).json({ message: "Error de validación.", errors: error.errors });
		}

		res.status(500).json({ message: "Error al crear el curso." });
	}
};

// Actualizar un curso (solo para administradores)
const updateCurso = async (req, res) => {
	try {
		const { accountType } = req.user;
		const userId = req.user.id;
		const { id } = req.params;
		const {
			nombre_curso,
			descripcion,
			tipo_oferta,
			ficha,
			fecha_inicio,
			fecha_fin,
			hora_inicio,
			hora_fin,
			dias_formacion,
			lugar_formacion,
			estado,
			slots_formacion,
			empresa_ID,
			duracion_dias,
			modalidad
		} = req.body;

		const userData = await User.findByPk(userId);
		if (accountType === "Empresa") {
			if (!userData.dataValues.empresa_ID)
				return res.status(403).json({ message: "No tienes permisos para actualizar cursos sin una empresa." });
			const cursoTemp = (await Curso.findByPk(id)).dataValues;
			if (userData.dataValues.empresa_ID !== cursoTemp.empresa_ID)
				return res.status(403).json({ message: "No tienes permisos para actualizar cursos de otra empresa." });
		}
		if (accountType !== "Administrador" & accountType !== "Gestor" && accountType !== "Empresa") {
			return res.status(403).json({ message: "No tienes permisos para actualizar cursos." });
		}
		const isManager = accountType === "Empresa"

		// Validar que el curso exista
		const curso = await Curso.findByPk(id);
		if (!curso) {
			return res.status(404).json({ message: "Curso no encontrado." });
		}

		// Verificar si se envió una nueva imagen
		let image = curso.imagen;
		if (req.file) {
			image = req.file.buffer.toString('base64');
		}

		// 🟨 Validar empresa si tipo_oferta es "Cerrada"
		let finalEmpresaID = null;
		if (tipo_oferta === "Cerrada") {
			if (!empresa_ID || isNaN(Number(empresa_ID))) {
				return res.status(400).json({
					message: "Debe proporcionar un ID de empresa válido para una oferta cerrada.",
				});
			}

			const empresa = await Empresa.findByPk(empresa_ID);
			if (!empresa) {
				return res.status(404).json({
					message: `No se encontró una empresa con el ID ${empresa_ID}.`,
				});
			}

			finalEmpresaID = empresa_ID;
		}

		// 🧩 Preparar datos para actualización
		const datosActualizacion = {
			nombre_curso,
			descripcion,
			tipo_oferta,
			ficha,
			dias_formacion,
			lugar_formacion,
			estado,
			duracion_dias,
			modalidad,
			empresa_ID: tipo_oferta === "Cerrada" ? finalEmpresaID : null, // ✅ Actualizar o limpiar
		};

		if (fecha_inicio && fecha_fin) {
			datosActualizacion.fecha_inicio = fecha_inicio;
			datosActualizacion.fecha_fin = fecha_fin;
		}

		if (hora_inicio && hora_fin) {
			datosActualizacion.hora_inicio =
				hora_inicio.includes(":") && hora_inicio.split(":").length === 2
					? hora_inicio + ":00"
					: hora_inicio;
			datosActualizacion.hora_fin =
				hora_fin.includes(":") && hora_fin.split(":").length === 2
					? hora_fin + ":00"
					: hora_fin;
		}

		if (image) {
			datosActualizacion.imagen = image;
		}

		if (slots_formacion) {
			datosActualizacion.slots_formacion = Array.isArray(slots_formacion)
				? JSON.stringify(slots_formacion)
				: slots_formacion;
		}

		// ✅ Actualizar curso en la base de datos
		await curso.update(datosActualizacion);

		// 📨 Notificar por email
		const usuarios = await User.findAll({
			where: {
				verificacion_email: true,
				accountType: { [Op.or]: ["Empresa", "Aprendiz"] },
			},
			attributes: ["email"],
		});

		const emails = usuarios.map((user) => user.email);
		if (emails.length > 0) {
			await sendCursoUpdatedNotification(emails, curso);
		}

		if (isManager) {
			await sendCursoUpdatedByManagerNotification(curso.dataValues, userData.dataValues);
		}

		res.status(200).json({
			message: `Curso actualizado con éxito. Notificaciones enviadas a ${emails.length} usuarios.`,
			curso,
			validaciones_aplicadas: {
				fechas: !!(fecha_inicio && fecha_fin),
				horas: !!(hora_inicio && hora_fin),
				empresa: tipo_oferta === "Cerrada",
			},
		});
	} catch (error) {
		console.error("Error al actualizar el curso:", error);
		res.status(500).json({ message: "Error al actualizar el curso." });
	}
};

// Obtener todos los cursos
const getAllCursos = async (req, res) => {
	try {
		const cursos = await Curso.findAll(); // Obtener todos los cursos
		res.status(200).json(cursos);
	} catch (error) {
		console.error("Error al obtener los cursos:", error);
		res.status(500).json({ message: "Error al obtener los cursos." });
	}
};

const getCursoByNameOrFicha = async (req, res) => {
	try {
		const { input } = req.query;

		if (!input) {
			return res.status(400).json({ message: "El campo 'input' es obligatorio." });
		}

        const curso = await Curso.findAll({
			where: {
				[Op.or]: [
					{
						nombre_curso: {
							[Op.like]: `%${input}%`
						}
					},
					{
						ficha: {
							[Op.like]: `%${input}%`
						}
					}
				]
            },
            include: [{
                model: Usuario,
                as: 'Instructor',
                attributes: ['ID', 'nombres', 'apellidos']
            }]
		});

		if (!curso || curso.length === 0) {
			return res.status(404).json({ message: "Curso no encontrado" });
		}

		res.status(200).json(curso);

	} catch (error) {
		console.error("Error al obtener curso: ", error);
		res.status(500).json({ message: "Error al obtener el curso." });
	}
};

// Nuevo controlador para transformacion
const uploadImagesBase64 = async (req, res) => {
	try {
		const file = req.file;
		if (!file)
			return res.status(400).json({ message: "No se recibio ningun archivo" });

		const base64Data = file.buffer.toString("base64");
		const uniqueName = `${file.fieldname}-${Date.now()}.txt`;
		const savePath = path.join(__dirname, "../base64storage", uniqueName);

		if (!fs.existsSync(path.dirname(savePath))) {
			fs.mkdirSync(path.dirname(savePath), { recursive: true });
		}

		fs.writeFileSync(savePath, base64Data);

		return res.status(200).json({
			message: "Imagen convertida y guardada.",
			filename: uniqueName,
			path: savePath,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Error al guardar la imagen." });
	}
};
366
const getCursoParticipants = async (req, res) => {
	try {
		const { courseId } = req.params;
		const { page, limit, name, doc, state } = req.query;
		
		// Convertir limit y page a números si existen
		const limitNum = limit ? (isNaN(parseInt(limit, 10)) ? null : parseInt(limit, 10)) : null;
		const pageNum = page ? (isNaN(parseInt(page, 10)) ? null : parseInt(page, 10)) : null;

		let includeTerms = {
			model: dbInstance.Usuario,
			as: 'aprendiz',
			attributes: ['ID', 'nombres', 'apellidos', 'email', 'documento', 'foto_perfil', 'estado'],
			required: false // LEFT JOIN - incluir incluso si no hay aprendiz
		}
		
		// Construir condiciones where para el aprendiz si hay filtros
		const whereConditions = {};
		
		if (name?.length > 0) {
			whereConditions[Op.or] = [
				Sequelize.where(
					Sequelize.fn('CONCAT', Sequelize.col('aprendiz.nombres'), ' ', Sequelize.col('aprendiz.apellidos')),
					{ [Op.like]: `%${name}%` }
				)
			];
			includeTerms.where = whereConditions;
		}

		if (doc?.length > 0) {
			if (!includeTerms.where) {
				includeTerms.where = {};
			}
			includeTerms.where.documento = {
				[Op.like]: `%${doc}%`
			};
		}

		if (state?.length > 0) {
			if (!includeTerms.where) {
				includeTerms.where = {};
			}
			includeTerms.where.estado = state;
		}

		let searchTerms = {
			where: {
				curso_ID: courseId,
				estado_inscripcion: 'activo'
			},
			include: [includeTerms]
		}

		if (pageNum !== null || limitNum !== null) {
			const finalLimit = limitNum ?? 10;
			const finalPage = pageNum ?? 0;
			searchTerms = {
				...searchTerms,
				offset: finalLimit * finalPage,
				limit: finalLimit
			}
		}

		const participantes = await dbInstance.InscripcionCurso.findAll(searchTerms);

		const totalAmount = await dbInstance.InscripcionCurso.count({
			where: {
				curso_ID: courseId,
				estado_inscripcion: 'activo'
			}
		})

		// Serializar explícitamente los participantes para asegurar que las relaciones se incluyan
		const participantesSerializados = participantes.map(p => {
			const pData = p.toJSON ? p.toJSON() : p;
			return pData;
		});

		let result = {
			success: true,
			participants: participantesSerializados,
			total: totalAmount,
		}

		if (pageNum !== null || limitNum !== null) {
			const finalLimit = limitNum ?? 10;
			const finalPage = pageNum ?? 0;
			result = {
				...result,
				page: finalPage,
				amount: finalLimit,
				pages: Math.ceil(totalAmount / finalLimit)
			}
		}

		res.status(200).json(result);
	} catch (error) {
		console.error('Error al obtener los participantes del curso:', error);
		res.status(500).json({
			success: false,
			message: 'Error al obtener los participantes del curso'
		});
	}
};

const getCursoById = async (req, res) => {
	try {
		const { id } = req.params;

		const curso = await Curso.findByPk(id, {
			include: [
				{
					model: Empresa,
					as: 'Empresa',
				},
				{
					model: Usuario,
					attributes: ['nombres', 'apellidos'], // solo los campos que necesitas
					as: 'Instructor', // Este alias debe coincidir con el definido por Sequelize si lo usaste
					foreignKey: 'instructor_ID'
				}
			]
		});

		if (!curso) {
			return res.status(404).json({ message: "Curso no encontrado." });
		}

		curso.dataValues.cupos_usados = await InscripcionCurso.count({
			where: {
				curso_ID: id
			}
		})

		res.status(200).json(curso);
	} catch (error) {
		console.error("Error al obtener el curso:", error);
		res.status(500).json({ message: "Error al obtener el curso." });
	}
};


// Obtener todos los cursos relacionados a una empresa por su ID
const getCursosByEmpresaId = async (req, res) => {
	try {
		const { empresaId } = req.params;

		if (!empresaId) {
			return res.status(400).json({ message: "El ID de la empresa es obligatorio." });
		}

		// Verificar si la empresa existe
		const empresa = await Empresa.findByPk(empresaId);
		if (!empresa) {
			return res.status(404).json({ message: `No se encontró una empresa con el ID ${empresaId}.` });
		}

		const cursos = await Curso.findAll({
			where: { empresa_ID: empresaId },
			include: [
				{
					model: Empresa,
					as: 'Empresa'
				},
				{
					model: Usuario,
					as: "Instructor",
				}
			]
		});

		res.status(200).json({ success: true, cursos });
	} catch (error) {
		console.error("Error al obtener los cursos de la empresa:", error);
		res.status(500).json({ message: "Error al obtener los cursos de la empresa." });
	}
};

const enviarInvitacionCurso = async (req, res) => {
	try {
		// Validar tipo de cuenta
		const { accountType, id } = req.user;
		if (accountType !== "Administrador" && accountType !== "Gestor") {
			console.log('❌ Error de permisos:', { accountType, id });
			return res.status(403).json({ message: "No tienes permisos para enviar invitaciones." });
		}

		const { instructor_ID, curso_ID } = req.body;

		// Validación mejorada
		if (instructor_ID === null || instructor_ID === undefined || curso_ID === null || curso_ID === undefined) {
			console.log('❌ Validación fallida - campos obligatorios');
			return res.status(400).json({
				message: 'Todos los campos son obligatorios.',
				debug: { instructor_ID, curso_ID, tipos: { instructor: typeof instructor_ID, curso: typeof curso_ID } }
			});
		}

		// Validar que sean números válidos
		if (isNaN(instructor_ID) || isNaN(curso_ID)) {
			console.log('❌ Validación fallida - no son números válidos');
			return res.status(400).json({ message: 'Los IDs deben ser números válidos.' });
		}

		// Validar que no exista una invitación pendiente
		const invitacionExistente = await InvitacionCurso.findOne({
			where: {
				instructor_ID,
				curso_ID,
				estado: 'pendiente'
			}
		});

		if (invitacionExistente) {
			console.log('❌ Ya existe invitación pendiente');
			return res.status(409).json({ message: 'Ya existe una invitación pendiente para este instructor y curso.' });
		}

		// Validar disponibilidad del instructor (solo se invita si está activo)
		const instructor = await Usuario.findByPk(instructor_ID, { attributes: ['ID', 'estado', 'accountType'] });
		if (!instructor || instructor.accountType !== 'Instructor') {
			return res.status(404).json({ message: 'Instructor no encontrado o no válido.' });
		}
		if (instructor.estado !== 'activo') {
			return res.status(409).json({ message: 'No se puede invitar. El instructor está inactivo.' });
		}

		// Crear la invitación
		const nuevaInvitacion = await InvitacionCurso.create({
			instructor_ID: parseInt(instructor_ID),
			usuario_ID: id,
			curso_ID: parseInt(curso_ID),
			estado: 'pendiente',
			fecha_envio: new Date()
		});

		const findInstructor = await User.findByPk(instructor_ID, {attributes: ['email']})
		const curso = await Curso.findOne({where: {ID: curso_ID}})

		const email = findInstructor.dataValues.email;  
		console.log("datos necesarios: ", {email, curso})

		/*if(email.length > 0){
			await sendInstructorAssignedEmail(email, curso);
			console.log('✅ Invitación creada exitosamente:', nuevaInvitacion.id);
		}*/

		res.status(201).json({
			message: 'Invitación enviada correctamente.',
			invitacion: nuevaInvitacion
		});

	} catch (error) {
		console.error('💥 Error en enviarInvitacionCurso:', error);
		res.status(500).json({ message: 'Error al enviar la invitación.' });
	}
};

// Endpoint de disponibilidad de instructor por ID
const verificarDisponibilidadInstructor = async (req, res) => {
	try {
		const { instructor_ID } = req.params;
		if (!instructor_ID) {
			return res.status(400).json({ message: 'El ID del instructor es obligatorio.' });
		}
		const instructor = await Usuario.findByPk(instructor_ID, { attributes: ['ID', 'estado', 'accountType', 'nombres', 'apellidos'] });
		if (!instructor || instructor.accountType !== 'Instructor') {
			return res.status(404).json({ message: 'Instructor no encontrado o no válido.' });
		}
		const disponible = instructor.estado === 'activo';
		return res.status(200).json({ disponible, estado: instructor.estado, instructor: { ID: instructor.ID, nombres: instructor.nombres, apellidos: instructor.apellidos } });
	} catch (error) {
		console.error('Error al verificar disponibilidad del instructor:', error);
		return res.status(500).json({ message: 'Error al verificar la disponibilidad del instructor.' });
	}
};

const cambiarEstadoInvitacion = async (req, res) => {
	const transaction = await dbInstance.sequelize.transaction();
	
	try {
		const { invitacionId } = req.params;
		const { nuevoEstado } = req.body; // 'aceptada' o 'rechazada'

		// Validar estado permitido
		if (!['aceptada', 'rechazada'].includes(nuevoEstado)) {
			await transaction.rollback();
			return res.status(400).json({ message: "El estado debe ser 'aceptada' o 'rechazada'." });
		}

		// Buscar la invitación con transacción
		const invitacion = await InvitacionCurso.findByPk(invitacionId, { transaction });
		if (!invitacion) {
			await transaction.rollback();
			return res.status(404).json({ message: "Invitación no encontrada." });
		}

		// Si ya está en ese estado, no hacer nada
		if (invitacion.estado === nuevoEstado) {
			await transaction.rollback();
			return res.status(200).json({ message: `La invitación ya está en estado '${nuevoEstado}'.` });
		}

		// Obtener el curso relacionado
		const curso = await Curso.findByPk(invitacion.curso_ID, { transaction });
		if (!curso) {
			await transaction.rollback();
			return res.status(404).json({ message: "Curso no encontrado." });
		}

		// Manejar el cambio de estado
		if (nuevoEstado === 'aceptada') {
			// ASIGNAR INSTRUCTOR AL CURSO
			
			// 1. Verificar si ya existe una asignación activa
			const asignacionExistente = await AsignacionCursoInstructor.findOne({
				where: {
					curso_ID: invitacion.curso_ID,
					instructor_ID: invitacion.instructor_ID,
					estado: 'aceptada'
				},
				transaction
			});

			if (!asignacionExistente) {
				// Crear nueva asignación
				await AsignacionCursoInstructor.create({
					instructor_ID: invitacion.instructor_ID,
					curso_ID: invitacion.curso_ID,
					estado: 'aceptada',
					fecha_asignacion: new Date()
				}, { transaction });
			}

			// 2. Actualizar el curso con el nuevo instructor
			curso.instructor_ID = invitacion.instructor_ID;
			await curso.save({ transaction });

			// 3. Cancelar otras invitaciones pendientes para este curso
			await InvitacionCurso.update(
				{ estado: 'cancelada', fecha_estado: new Date() },
				{
					where: {
						curso_ID: invitacion.curso_ID,
						id: { [Op.ne]: invitacion.id },
						estado: 'pendiente'
					},
					transaction
				}
			);

		} else if (nuevoEstado === 'rechazada') {
			// REMOVER ASIGNACIÓN SI CORRESPONDE
			
			// 1. Verificar si este instructor estaba asignado al curso
			if (curso.instructor_ID === invitacion.instructor_ID) {
				curso.instructor_ID = null;
				await curso.save({ transaction });

				// 2. Cambiar el estado de la asignación a rechazada
				await AsignacionCursoInstructor.update(
					{ estado: 'rechazada' },
					{
						where: {
							curso_ID: invitacion.curso_ID,
							instructor_ID: invitacion.instructor_ID
						},
						transaction
					}
				);
			}
		}

		// Actualizar el estado de la invitación
		invitacion.estado = nuevoEstado;
		invitacion.fecha_estado = new Date();
		await invitacion.save({ transaction });

		// Confirmar la transacción
		await transaction.commit();

		res.status(200).json({ 
			message: `Invitación actualizada a estado '${nuevoEstado}'.`,
			cursoActualizado: {
				instructor_ID: curso.instructor_ID,
				nombre_curso: curso.nombre_curso
			}
		});

	} catch (error) {
		// Revertir la transacción en caso de error
		await transaction.rollback();
		console.error('Error al cambiar el estado de la invitación:', error);
		res.status(500).json({ message: 'Error al cambiar el estado de la invitación.' });
	}
};

// Eliminar asignación de curso a instructor
const eliminarAsignacionCursoInstructor = async (req, res) => {
    const transaction = await dbInstance.sequelize.transaction();
    try {
        const { instructor_ID, curso_ID } = req.params;

        // Permisos: solo Admin o Gestor
        const { accountType } = req.user || {};
        if (accountType !== 'Administrador' && accountType !== 'Gestor') {
            await transaction.rollback();
            return res.status(403).json({ message: 'No tienes permisos para eliminar asignaciones.' });
        }

        if (!instructor_ID || !curso_ID) {
            await transaction.rollback();
            return res.status(400).json({ message: "El ID del instructor y del curso son obligatorios." });
        }

        // Buscar asignación (cualquier estado) – si no existe igual intentamos limpiar curso
        const asignacion = await AsignacionCursoInstructor.findOne({
            where: { instructor_ID, curso_ID },
            transaction
        });

        // Eliminar físicamente la asignación
        if (asignacion) {
            await AsignacionCursoInstructor.destroy({
                where: { instructor_ID, curso_ID },
                transaction
            });
        }

        // Si el curso tiene actualmente a este instructor, desvincularlo
        const curso = await Curso.findByPk(curso_ID, { transaction });
        if (curso && Number(curso.instructor_ID) === Number(instructor_ID)) {
            curso.instructor_ID = null;
            await curso.save({ transaction });
        }

        await transaction.commit();

        // Notificar por email al instructor removido (best-effort)
        try {
            const inst = await User.findByPk(instructor_ID, { attributes: ['email'] });
            const cursoInfo = await Curso.findByPk(curso_ID);
            if (inst?.email && cursoInfo) {
                await sendInstructorUnassignedEmail(inst.email, cursoInfo);
            }
        } catch (e) {
            console.warn('No se pudo enviar email de desasignación:', e?.message);
        }

        // Notificación in-app al instructor por desasignación
        try {
            const remitenteId = Number(req.user?.ID) || Number(instructor_ID);
            const cursoInfo = await Curso.findByPk(curso_ID);
            await Notificacion.create({
                remitente_ID: remitenteId,
                destinatario_ID: Number(instructor_ID),
                usuario_ID: Number(instructor_ID),
                tipo: 'curso_desasignado',
                titulo: `Removido del curso ${cursoInfo?.nombre_curso || ''}`,
                mensaje: `Has sido removido del curso "${cursoInfo?.nombre_curso || curso_ID}".`,
                estado: 'pendiente',
            });
        } catch (e) {
            console.warn('No se pudo crear notificación in-app (desasignación):', e?.message);
        }

        return res.status(200).json({ message: "Asignación eliminada correctamente." });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar la asignación curso-instructor:', error);
        return res.status(500).json({ message: 'Error interno al eliminar la asignación.' });
    }
};

module.exports = {
	setDb,
	createCurso,
	updateCurso,
	getAllCursos,
	getCursoByNameOrFicha,
	asignarInstructorAlCurso,
	obtenerCursosAsignadosAInstructor,
	uploadImagesBase64,
	getCursoParticipants,
	getCursoById,
	getCursosByEmpresaId,
	enviarInvitacionCurso,
	cambiarEstadoInvitacion,
	verificarDisponibilidadInstructor,
    eliminarAsignacionCursoInstructor,
};