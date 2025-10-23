const CursoTieneMaterialDeApoyo = require("../models/CursoTieneMaterialDeApoyo");
const MaterialDeApoyo = require("../models/MaterialDeApoyo");

let dbInstance;

const setDb = (databaseInstance) => {
	dbInstance = databaseInstance
}

const obtenerMaterialCurso = async (req, res) => {
	const { id } = req.params

	try {
		const materiales = await CursoTieneMaterialDeApoyo.findAll({
			where: {
				curso_ID: id
			},
			include: [
				{
					model: MaterialDeApoyo,
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
	const { tipo, link } = req.body
	const { accountType } = req.user;
	const userId = req.user.id;

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
				message: "Tipo de material invalido"
			})
		}

		let material

		switch (tipo) {
			case "pdf":
				break
			case "video":
				break
			case "enlace":
				material = await MaterialDeApoyo.create({
					contenido: link,
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
		}

		return res.status(200).send({
			message: "Se ha creado el criterio"
		})
	} catch (error) {
		console.error(`Error al crear el material ${error}`)
		res.status(500).send({
			message: "Ocurrió un error al crear el material."
		})
	}
}

module.exports = {
	obtenerMaterialCurso,
	crearMaterial,
	setDb
}