const { where } = require("sequelize");
const Criterio = require("../models/Criterio");
const UsuarioTieneCriterios = require("../models/UsuarioTieneCriterios");

let db;

const setDb = (dbInstance) => {
	db = dbInstance;
};

class ActividadRepository {
	static #ensureDb() {
		if (!db) {
			throw new Error("Base de datos no inicializada en ActividadRepository");
		}
	}

	static get models() {
		this.#ensureDb();
		return db;
	}

	static async findCursoById(id, options = {}) {
		this.#ensureDb();
		return db.Curso.findByPk(id, options);
	}

	static async findInscripcionActiva(cursoId, aprendizId, options = {}) {
		this.#ensureDb();
		return db.InscripcionCurso.findOne({
			where: {
				curso_ID: cursoId,
				aprendiz_ID: aprendizId,
				estado_inscripcion: "activo",
			},
			...options,
		});
	}

	static async findActiveMaterialsByIds(materialIds, options = {}) {
		this.#ensureDb();
		if (!Array.isArray(materialIds) || materialIds.length === 0) {
			return [];
		}
		return db.MaterialDeApoyo.findAll({
			where: {
				ID: materialIds,
				estado: "activo",
			},
			...options,
		});
	}

	static async findMaterialById(id, options = {}) {
		this.#ensureDb();
		return db.MaterialDeApoyo.findByPk(id, options);
	}

	static async createActividad(data, options = {}) {
		this.#ensureDb();
		return db.ActividadCurso.create(data, options);
	}

	static async findActividadById(id, options = {}) {
		this.#ensureDb();
		return db.ActividadCurso.findByPk(id, {
			include: [
				{
					model: db.Curso,
					as: "curso",
					attributes: ["ID", "nombre_curso", "instructor_ID"],
				},
				{
					model: db.MaterialDeApoyo,
					as: "materiales",
					through: { attributes: [] },
				},
				{
					model: db.ActividadEntrega,
					as: "entregas",
					include: [
						{
							model: db.Usuario,
							as: "aprendiz",
							attributes: ["ID", "nombres", "apellidos", "documento", "email"],
						},
						{
							model: db.Usuario,
							as: "revisor",
							attributes: ["ID", "nombres", "apellidos"],
						},
					],
				},
			],
			...options,
		});
	}

	static async findActividadesByCurso(cursoId, options = {}) {
		this.#ensureDb();
		return db.ActividadCurso.findAll({
			where: { curso_ID: cursoId },
			include: [
				{
					model: db.Curso,
					as: "curso",
					attributes: ["ID", "nombre_curso", "instructor_ID"],
				},
				{
					model: db.MaterialDeApoyo,
					as: "materiales",
					through: { attributes: [] },
				},
				{
					model: db.ActividadEntrega,
					as: "entregas",
					attributes: [
						"ID",
						"aprendiz_ID",
						"fecha_envio",
						"estado_revision",
					],
				},
			],
			order: [["fecha_publicacion", "DESC"]],
			...options,
		});
	}

	static async updateActividad(id, data, options = {}) {
		this.#ensureDb();
		return db.ActividadCurso.update(data, { where: { ID: id }, ...options });
	}

	static async attachMaterial(actividadId, materialId, options = {}) {
		this.#ensureDb();
		return db.ActividadTieneMaterial.findOrCreate({
			where: {
				actividad_ID: actividadId,
				material_apoyo_ID: materialId,
			},
			defaults: {
				actividad_ID: actividadId,
				material_apoyo_ID: materialId,
			},
			...options,
		});
	}

	static async detachMaterial(actividadId, materialId, options = {}) {
		this.#ensureDb();
		return db.ActividadTieneMaterial.destroy({
			where: {
				actividad_ID: actividadId,
				material_apoyo_ID: materialId,
			},
			...options,
		});
	}

	static async createEntrega(data, options = {}) {
		this.#ensureDb();
		return db.ActividadEntrega.create(data, options);
	}

	static async findEntregaById(id, options = {}) {
		this.#ensureDb();
		return db.ActividadEntrega.findByPk(id, {
			include: [
				{
					model: db.Usuario,
					as: "aprendiz",
					attributes: ["ID", "nombres", "apellidos", "documento", "email"],
				},
				{
					model: db.Usuario,
					as: "revisor",
					attributes: ["ID", "nombres", "apellidos"],
				},
				{
					model: db.ActividadCurso,
					as: "actividad",
					include: [
						{
							model: db.Curso,
							as: "curso",
							attributes: ["ID", "nombre_curso", "instructor_ID"],
						},
					],
				},
			],
			...options,
		});
	}

	static async findEntregaByActividadYAaprendiz(actividadId, aprendizId, options = {}) {
		this.#ensureDb();
		return db.ActividadEntrega.findOne({
			where: {
				actividad_ID: actividadId,
				aprendiz_ID: aprendizId,
			},
			...options,
		});
	}

	static async updateEntrega(id, curso, aprendiz, data, options = {}) {
		this.#ensureDb();

		const criteriosIds = (await db.CursoTieneCriterio.findAll({
			where: {
				curso_ID: curso
			},
			attributes: ["criterio_ID"]
		})).map((c) => c.criterio_ID)

		for (let criterioId of criteriosIds) {
			const criterio = await UsuarioTieneCriterios.findOne({
				where: {
					criterio_ID: criterioId,
					usuario_ID: aprendiz
				},
				include: {
					model: Criterio,
				}
			})
			if (criterio.Criterio.type == "Calificacion") {
				if (data.estado_revision === "aprobada") {
					await UsuarioTieneCriterios.update({
						value: criterio.value + 1
					}, {
						where: {
							criterio_ID: criterioId,
							usuario_ID: aprendiz
						},
					})
				} else {
					if (criterio.value > 0)
						await UsuarioTieneCriterios.update({
							value: criterio.value - 1
						}, {
							where: {
								criterio_ID: criterioId,
								usuario_ID: aprendiz
							},
						})
				}
			}
		}

		return db.ActividadEntrega.update(data, { where: { ID: id }, ...options });
	}

	static async hasInstructorAcceptedAssignment(cursoId, instructorId) {
		this.#ensureDb();
		if (!cursoId || !instructorId) {
			return false;
		}

		const assignment = await db.AsignacionCursoInstructor.findOne({
			where: {
				curso_ID: cursoId,
				instructor_ID: instructorId,
				estado: "aceptada",
			},
		});

		return Boolean(assignment);
	}

	static async findActiveParticipantsByCurso(cursoId, options = {}) {
		this.#ensureDb();
		return db.InscripcionCurso.findAll({
			where: {
				curso_ID: cursoId,
				estado_inscripcion: "activo",
			},
			attributes: ["aprendiz_ID"],
			...options,
		});
	}

	static async deleteActividadById(id, options = {}) {
		this.#ensureDb();
		await db.ActividadEntrega.destroy({
			where: { actividad_ID: id },
			...options,
		});

		await db.ActividadTieneMaterial.destroy({
			where: { actividad_ID: id },
			...options,
		});

		return db.ActividadCurso.destroy({ where: { ID: id }, ...options });
	}
}

module.exports = {
	setDb,
	ActividadRepository,
};

