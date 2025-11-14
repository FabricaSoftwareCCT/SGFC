const Curso = require("../models/curso");
const CursoTieneCriterio = require("../models/CursoTieneCriterio");
const Criterio = require("../models/Criterio");
const Usuario = require("../models/User");
const UsuarioTieneCriterios = require("../models/UsuarioTieneCriterios");
const { Op } = require("sequelize");
const InscripcionCurso = require("../models/InscripcionCurso");
const { sendNotification } = require("../services/notificationService");
const UsuarioEdita = require("../models/UsuarioEdita");
const { addHistorial } = require("./historialController");
const ActividadCurso = require("../models/ActividadCurso");
const ActividadEntrega = require("../models/ActividadEntrega");

let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

// Consultar los criterios de un curso
const obtenerCriteriosCertificacionCurso = async (req, res) => {
	const { id } = req.params;
	const page = req.query.page ?? 0;
	const limit = req.query.limit ?? 5;
	const { name, date, author } = req.query;

	try {
		let criteria = [];
		let course = await Curso.findByPk(id);

		if (!course)
			return res.status(404).json({ message: "Curso no encontrado." });

		let whereTerms = {};

		if (name?.length > 0) {
			whereTerms = {
				...whereTerms,
				title: {
					[Op.like]: `%${name}%`,
				},
			};
		}

		if (date?.length > 0) {
			let d = new Date(parseInt(date));
			let bd = new Date(parseInt(date) - 86400000 * 2);
			let ad = new Date(parseInt(date) + 86400000 * 1);
			whereTerms = {
				...whereTerms,
				creation: {
					[Op.between]: [bd, ad],
				},
			};
		}

		const criteriosCurso = await CursoTieneCriterio.findAll({
			where: {
				curso_ID: id,
			},
			include: !(author?.length > 0)
				? [
						{
							model: Criterio,
							where: whereTerms,
						},
				  ]
				: [
						{
							model: Usuario,
							where: {
								[Op.or]: [
									{
										accountType: {
											[Op.like]: `%${author}%`,
										},
									},
									{
										nombres: {
											[Op.like]: `%${author}%`,
										},
									},
									{
										apellidos: {
											[Op.like]: `%${author}%`,
										},
									},
								],
							},
						},
						{
							model: Criterio,
							where: whereTerms,
						},
				  ],
			limit: parseInt(limit),
			offset: parseInt(limit) * parseInt(page),
		});

		for (let c of criteriosCurso) {
			let authorId = (
				await CursoTieneCriterio.findOne({
					where: {
						criterio_ID: c.Criterio.ID,
					},
				})
			).dataValues.author_ID;
			let author = (
				await Usuario.findOne({
					where: {
						ID: authorId,
					},
					attributes: ["nombres", "apellidos", "accountType"],
				})
			).dataValues;

			const lastEdit = await UsuarioEdita.findOne({
				where: {
					criterio_ID: c.Criterio.ID
				},
				include: {
					all: true
				}
			})

			let cData = {
				id: c.Criterio.ID,
				title: c.Criterio.title,
				description: c.Criterio.description,
				has_value: c.Criterio.has_value,
				min: c.Criterio.min,
				creation: {
					date: c.Criterio.creation.toLocaleDateString("es-CO"),
					hour: `${c.Criterio.creation.getHours()}:${c.Criterio.creation.getMinutes()}`,
				},
				weight: c.Criterio.weight,
				type: c.Criterio.type,
				author: author.nombres
					? `${author.nombres} ${author.apellidos}`
					: author.accountType,
			}

			if (lastEdit) {
				const editAuthor = (
					await Usuario.findOne({
						where: {
							ID: lastEdit.dataValues.autor_ID,
						},
						attributes: ["nombres", "apellidos"],
					})
				).dataValues;
				cData = {
					...cData,
					last_edit: {
						date: new Date(lastEdit.dataValues.fecha).toLocaleDateString("es-CO"),
						hour: new Date(lastEdit.dataValues.fecha).toLocaleTimeString("es-CO"),
						author: lastEdit.dataValues.autor_ID == 1 ? "Administrador" : `${editAuthor.nombres} ${editAuthor.apellidos}`
					}
				}
			}

			criteria.push(cData);
		}

		const totalAmount = await Criterio.count();
		res.status(200).json({
			criteria,
			page,
			max_pages: Math.ceil(totalAmount / limit),
			total: totalAmount,
		});
	} catch (error) {
		console.error(
			`Error al consultar los criterios de certificación del curso ${id}: ${error}`
		);
		res.status(500).json({
			mensaje:
				"Error interno al consultar los criterios de certificación",
		});
	}
};

const createCriteriosCurso = async (req, res) => {
	try {
		const { title, min, description, type, has_value, bias, course } =
			req.body;
		const { id, accountType } = req.user;

		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		if (!title || !description || !course) {
			return res
				.status(401)
				.json({ message: "Faltan los campos obligatorios." });
		}

		let courseData = await Curso.findByPk(course);

		if (!courseData)
			return res.status(404).json({ message: "Curso no encontrado." });

		if (bias) {
			const avgCombined = (
				await dbInstance.sequelize.query(
					`SELECT IFNULL(AVG(c.weight), 0) AS full_avg FROM curso_tiene_criterio ctc JOIN criterio c ON ctc.curso_ID = c.ID WHERE ctc.curso_ID = ${course}`
				)
			)[0][0].full_avg;
			if (parseFloat(avgCombined) + parseFloat(bias) > 100)
				return res
					.status(401)
					.json({ message: "La ponderación da más del 100%" });
		}

		const newCriteria = await Criterio.create({
			title,
			has_value,
			description,
			min,
			weight: bias,
			type,
		});

		await CursoTieneCriterio.create({
			author_ID: id,
			curso_ID: course,
			criterio_ID: newCriteria.ID,
		});

		return res.status(200).json({
			message: "Criterio creado con éxito",
			criterio_ID: newCriteria.ID,
		});
	} catch (error) {
		console.error(`Error al crear el criterio: ${error}`);
		return res.status(500).json({
			message: "Error interno al crear el criterio de certificación",
		});
	}
};

const updateCriteria = async (req, res) => {
	try {
		const criteria = req.params.id;
		const { title, min, description, bias, course } = req.body;
		const { id, accountType } = req.user;

		let whatWasEdited = ""

		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		let criteriaData = await Criterio.findByPk(criteria);
		if (!criteriaData)
			return res.status(404).json({ message: "Criterio no encontrado." });

		let updatedData = {};

		if (title?.length > 0) {
			updatedData = {
				...updatedData,
				title,
			};
			whatWasEdited = "el titulo"
		}

		if (!isNaN(min) && min > 0) {
			updatedData = {
				...updatedData,
				min,
			};
			whatWasEdited = "el mínimo de aprovación"
		}

		if (description?.length > 0) {
			updatedData = {
				...updatedData,
				description,
			};
			whatWasEdited = "la descripción"
		}

		if (!isNaN(bias)) {
			const avgCombined = (
				await dbInstance.sequelize.query(
					`SELECT IFNULL(AVG(c.weight), 0) AS full_avg FROM curso_tiene_criterio ctc JOIN criterio c ON ctc.curso_ID = c.ID WHERE ctc.curso_ID = ${course}`
				)
			)[0][0].full_avg;
			if (parseFloat(avgCombined) + parseFloat(bias) > 100)
				return res
					.status(401)
					.json({ message: "La ponderación da más del 100%" });
			updatedData = {
				...updatedData,
				bias,
			};
			whatWasEdited = "la ponderación"
		}

		await Criterio.update(updatedData, {
			where: {
				ID: criteria,
			},
		});

		addHistorial(id, {
			curso: course,
			criterio: criteria
		}, `El usuario [nombre] ([id]) ha editado ${whatWasEdited} del criterio "[criterio]" ([criterio_id]) del curso "[curso]" ([curso_id])`)

		return res.status(200).json({ message: "Criterio actualizado" });
	} catch (error) {
		console.error(`Error al crear el criterio: ${error}`);
		return res.status(500).json({
			message: "Error interno al editar el criterio de certificación",
		});
	}
};

const getAprenticeCriteria = async (req, res) => {
	try {
		const course = req.params.course;
		const userId = req.params.id;
		
		if (!(await Curso.findByPk(course)))
			return res.status(404).json({ message: "Curso no encontrado." });

		if (!(await Usuario.findByPk(userId)))
			return res.status(404).json({ message: "Aprendiz no encontrado." });

		let certificationData = await InscripcionCurso.findOne({
			where: {
				aprendiz_ID: userId,
				curso_ID: course,
			},
			attributes: ["estado_certificacion", "justificacion_rechazo"],
		});

		let criteriaList = await CursoTieneCriterio.findAll({
			where: {
				curso_ID: course,
			},
			include: {
				model: Criterio,
				attributes: ["title", "description", "has_value", "min"],
			},
		});

		let criteria = [];

		for (let c of criteriaList) {
			let criteriaValue = (
				await UsuarioTieneCriterios.findOne({
					where: {
						usuario_ID: userId,
						criterio_ID: c.id,
						curso_ID: course,
					},
					attributes: ["value"],
				})
			).dataValues.value;

			criteria.push({
				id: c.id,
				title: c.Criterio.title,
				description: c.Criterio.description,
				has_value: c.Criterio.has_value,
				min: c.Criterio.min,
				value: criteriaValue,
			});
		}

		const actividades = await ActividadCurso.findAndCountAll({
			where: {
				curso_ID: course,
			}
		})

		const subidas = await ActividadEntrega.findAll({
			where: {
				aprendiz_ID: userId,
				estado_revision: "aprobada"
			}
		})

		return res.status(200).json({
			certification_status:
				certificationData.dataValues.estado_certificacion,
			denial_justification:
				certificationData.dataValues.justificacion_rechazo ?? "",
			criteria,
			total_activities: actividades.count,
			submitted_activities: subidas.map((a) => actividades.rows.map((ac) => ac.ID).includes(a.actividad_ID))?.length ?? 0
		});
	} catch (error) {
		console.error(`Error al consultar los criterios del aprendiz: ${error}`);
		return res.status(500).json({
			message: "Error interno al consultar los criterios del aprendiz",
		});
	}
};

const updateAprenticeCertificationStatus = async (req, res) => {
	try {
		const userId = req.params.id;
		const course = req.params.course;
		const { id, accountType } = req.user;
		const { state, justification } = req.body;

		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		const courseData = await Curso.findByPk(course, {
			attributes: ["nombre_curso", "ficha"],
		});

		if (!courseData)
			return res.status(404).json({ message: "Curso no encontrado." });

		const aprentice = await Usuario.findByPk(userId, {
			attributes: ["nombres", "apellidos", "email"],
		});

		if (!aprentice)
			return res.status(404).json({ message: "Aprendiz no encontrado." });

		if (!state)
			return res.status(400).json({
				message: "El estado de la certificación es obligatorio.",
			});

		if (state != "pendiente" && state != "aprovado" && state != "rechazado")
			return res.status(400).json({ mensaje: "Tipo de estado inválido" });

		let updatedData = {
			estado_certificacion: state,
		};

		if (justification?.length > 0) {
			updatedData = {
				...updatedData,
				justificacion_rechazo: justification,
			};
		}

		await InscripcionCurso.update(updatedData, {
			where: {
				curso_ID: course,
				aprendiz_ID: userId,
			},
		});

		try {
			// Enviar notificación al aprendiz
			const title =
				state == "pendiente"
					? `Se ha marcado tu certificación como pendiente en el curso ${courseData.nombre_curso}`
					: state == "aprovado"
					? `Se ha aprovado tu certificación en el curso ${courseData.nombre_curso}`
					: `Se ha rechazado tu certificación en el curso ${courseData.nombre_curso}`;
			const certUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const message = `
				<p>${
					state == "pendiente"
						? `Se ha establecido que tu certificación está pendiente de aprobación en el curso ${courseData.nombre_curso} ficha ${courseData.ficha}.`
						: state == "aprovado"
						? `Se ha aprovado tu certificación en el curso ${courseData.nombre_curso} ficha ${courseData.ficha}.<br>Mira tu certificado <a href="${certUrl}">aquí</a>.`
						: `Se ha rechazado tu certificación en el curso ${courseData.nombre_curso} ficha ${courseData.ficha}.<br>Motivo:<br>${justification}`
				}</p>
			`;
			const type = "actualizacion_curso";

			const notificacion = await dbInstance.Notificacion.create({
				remitente_ID: id,
				destinatario_ID: userId,
				tipo: type,
				titulo: title,
				mensaje: message,
				fecha_envio: new Date(),
				estado: "sin_leer",
				curso_ID: course,
			});

			await sendNotification(id, userId, type, title, message, course);
		} catch (error) {
			console.log(
				`Error al enviar la notificación al aprendiz: ${error}`
			);
		}

		return res
			.status(200)
			.json({ message: "Estado de la certificación actualizada" });
	} catch (error) {
		console.error(
			`Error al actualizar el estado de la certificación: ${error}`
		);
		return res.status(500).json({
			message: "Error interno al actualizar el estado de certificación",
		});
	}
};

module.exports = {
	obtenerCriteriosCertificacionCurso,
	createCriteriosCurso,
	updateCriteria,
	getAprenticeCriteria,
	updateAprenticeCertificationStatus,
	setDb,
};
