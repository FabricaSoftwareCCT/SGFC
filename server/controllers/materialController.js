const path = require("path");
const { Op } = require("sequelize");
const CursoTieneMaterialDeApoyo = require("../models/CursoTieneMaterialDeApoyo");
const MaterialDeApoyo = require("../models/MaterialDeApoyo");
const { mkdirSync, writeFileSync } = require("fs");
const Curso = require("../models/curso");
const ActividadCurso = require("../models/ActividadCurso");
const ActividadTieneMaterial = require("../models/ActividadTieneMaterial");
const AsignacionCursoInstructor = require("../models/AsignacionCursoInstructor");

let dbInstance;

const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

const instructorHasAcceptedAssignment = async (cursoId, instructorId) => {
	if (!cursoId || !instructorId) {
		return false;
	}

	const assignment = await AsignacionCursoInstructor.findOne({
		where: {
			curso_ID: cursoId,
			instructor_ID: instructorId,
			estado: "aceptada",
		},
	});

	return Boolean(assignment);
};

const ensureInstructorOwnsMaterial = async (materialId, instructorId) => {
	if (!instructorId) {
		return false;
	}

	const links = await CursoTieneMaterialDeApoyo.findAll({
		where: { material_apoyo_ID: materialId },
		attributes: ["curso_ID"],
	});

	if (!links.length) {
		return false;
	}

	const cursoIds = links
		.map((link) => Number(link?.curso_ID))
		.filter((cursoId) => !Number.isNaN(cursoId));

	if (cursoIds.length === 0) {
		return false;
	}

	const assignment = await AsignacionCursoInstructor.findOne({
		where: {
			curso_ID: { [Op.in]: cursoIds },
			instructor_ID: instructorId,
			estado: "aceptada",
		},
	});

	return Boolean(assignment);
};

const obtenerMaterialCurso = async (req, res) => {
	const { id } = req.params

	try {
		const materiales = await CursoTieneMaterialDeApoyo.findAll({
			where: {
				curso_ID: id,
			},
			include: [
				{
					model: MaterialDeApoyo,
					where: {
						estado: "activo"
					}
				}
			]
		})
		res.status(200).send({
			materiales: materiales.map((m) => m.MaterialDeApoyo),
			success: true
		})
	} catch (error) {
		console.error(`Ocurrió un error al consultar los materiales de un curso: ${error}`)
		res.status(500).send({
			message: "Ocurrió un error interno."
		})
	}
}

const crearMaterial = async (req, res) => {
	const { id } = req.params
	const { tipo } = req.body
	const { accountType } = req.user;
	const userId = Number(req.user?.id ?? req.user?.ID);
	const actividadId = req.body.actividadId || req.body.actividad_ID || null;

	try {
		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		if ((!tipo) || (tipo !== "pdf" && tipo !== "video" && tipo !== "enlace")) {
			return res.status(401).json({
				message: "Tipo de material invalido."
			})
		}

		const curso = await Curso.findByPk(id);

		if (!curso) {
			return res.status(404).json({
				message: "No se encontró el curso."
			})
		}

		if (accountType === "Instructor") {
			const hasAssignment = await instructorHasAcceptedAssignment(
				curso.ID,
				userId
			);
			if (!hasAssignment) {
				return res.status(403).json({
					message: "No eres el instructor asignado a este curso.",
				});
			}
		}

	if (!userId) {
		return res.status(401).json({
			message: "Usuario no autenticado.",
		});
	}

		let material
		let actividad = null;

		if (actividadId) {
			actividad = await ActividadCurso.findByPk(actividadId);

			if (!actividad) {
				return res.status(404).json({
					message: "No se encontró la actividad indicada."
				});
			}

			if (Number(actividad.curso_ID) !== Number(id)) {
				return res.status(400).json({
					message: "La actividad no pertenece al curso proporcionado."
				});
			}
		}

		switch (tipo) {
			case "pdf":
				let pdfFile = req.files.document_pdf[0]
				const pdfName = `${new Date().getTime()}${pdfFile.fieldname}.pdf`
				const pdfPath = path.join(__dirname, "../uploads/material", pdfName)

				mkdirSync(path.dirname(pdfPath), { recursive: true })
				writeFileSync(pdfPath, pdfFile.buffer)
				
				material = await MaterialDeApoyo.create({
					nombre_original: pdfName,
					tamanio: pdfFile.size,
					tipo_contenido: "pdf",
					creador_ID: userId,
					contenido: `/uploads/material/${pdfName}`
				})
				break
			case "video":
				let videoFile = req.files.video[0]
				const videoName = `${new Date().getTime()}${videoFile.fieldname}.mp4`
				const videoPath = path.join(__dirname, "../uploads/material", videoName)

				mkdirSync(path.dirname(videoPath), { recursive: true })
				writeFileSync(videoPath, videoFile.buffer)
				
				material = await MaterialDeApoyo.create({
					nombre_original: videoName,
					tamanio: videoFile.size,
					tipo_contenido: "video",
					creador_ID: userId,
					contenido: `/uploads/material/${videoName}`
				})
				break
			case "enlace":
				material = await MaterialDeApoyo.create({
					contenido: req.body.link,
					tipo_contenido: "link",
					creador_ID: userId
				})
				break
		}

		if (material) {
			await CursoTieneMaterialDeApoyo.create({
				material_apoyo_ID: material.ID,
				curso_ID: id
			})

			if (actividadId) {
				await ActividadTieneMaterial.findOrCreate({
					where: {
						actividad_ID: actividadId,
						material_apoyo_ID: material.ID
					},
					defaults: {
						actividad_ID: actividadId,
						material_apoyo_ID: material.ID
					}
				});
			}
		}

		return res.status(200).send({
			message: "Se ha creado el material de apoyo"
		})
	} catch (error) {
		console.error(`Error al crear el material ${error}`)
		res.status(500).send({
			message: "Ocurrió un error interno al crear el material."
		})
	}
}

const actualizarMaterial = async (req, res) => {
	const { id } = req.params;
	const { link } = req.body;
	const { accountType } = req.user;
	const userId = Number(
		req.user?.id ?? req.user?.ID ?? req.user?.usuario_ID ?? req.user?.usuarioId
	);

	try {
		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		if (!userId) {
			return res.status(401).json({
				message: "Usuario no autenticado.",
			});
		}

		const material = await MaterialDeApoyo.findByPk(id);

		if (!material) {
			return res.status(404).json({
				message: "No se encontró el material de apoyo",
			});
		}

		if (accountType === "Instructor") {
			const ownsMaterial = await ensureInstructorOwnsMaterial(
				material.ID,
				userId
			);
			if (!ownsMaterial) {
				return res.status(403).json({
					message: "No eres el instructor de este curso.",
				});
			}
		}

		switch (material.tipo_contenido.toLowerCase()) {
			case "pdf":
				break;
			case "video":
				break;
			case "link":
				await material.update({
					contenido: link,
				});
				break;
		}

		return res.status(200).send({
			message: "Se ha actualizado el criterio",
		});
	} catch (error) {
		console.error(`Error al actualizar el material ${error}`);
		res.status(500).send({
			message: "Ocurrió un error interno al actualizar el material.",
		});
	}
};

const eliminarMaterial = async (req, res) => {
	try {
		const { id } = req.params;
		const { accountType } = req.user;
		const userId = Number(
			req.user?.id ?? req.user?.ID ?? req.user?.usuario_ID ?? req.user?.usuarioId
		);

		if (
			accountType !== "Administrador" &&
			accountType !== "Instructor" &&
			accountType !== "Gestor"
		) {
			return res.status(403).json({
				message: "No tienes permisos para realizar esta acción.",
			});
		}

		const material = await MaterialDeApoyo.findByPk(id);

		if (!material) {
			return res.status(404).json({
				message: "No se encontró el material de apoyo",
			});
		}

		if (accountType === "Instructor") {
			const ownsMaterial = await ensureInstructorOwnsMaterial(
				material.ID,
				userId
			);
			if (!ownsMaterial) {
				return res.status(403).json({
					message: "No eres el instructor de este curso.",
				});
			}
		}

		material.update({
			estado: "inactivo",
		});

		return res.status(200).send({
			message: "Se ha eliminado el criterio",
		});
	} catch (error) {
		console.error(`Error al eliminar el material ${error}`);
		res.status(500).send({
			message: "Ocurrió un error interno al eliminar el material.",
		});
	}
};

module.exports = {
	obtenerMaterialCurso,
	crearMaterial,
	actualizarMaterial,
	eliminarMaterial,
	setDb
}