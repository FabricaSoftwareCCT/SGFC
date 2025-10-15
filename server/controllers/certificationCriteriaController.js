const Curso = require("../models/curso")
const CursoTieneCriterio = require("../models/CursoTieneCriterio")
const Criterio = require("../models/Criterio")
const Usuario = require("../models/User");
const { Op, where, fn, col } = require("sequelize");

let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

// Consultar los criterios de un curso
const obtenerCriteriosCertificacionCurso = async (req, res) => {
	const { id } = req.params
	const page = req.query.page ?? 0
	const limit = req.query.limit ?? 5
	const { name, date, author } = req.query

	try {
		let criteria = []
		let course = await Curso.findByPk(id)

		if (!course)
			return res.status(404).json({message: "Curso no encontrado."})

		let whereTerms = {}

		if (name?.length > 0) {
			whereTerms = {
				...whereTerms,
				title: {
					[Op.like]: `%${name}%`
				}
			}
		}

		if (date?.length > 0) {
			let d = new Date(parseInt(date))
			let bd = new Date(parseInt(date) - (86400000 * 2))
			let ad = new Date(parseInt(date) + (86400000 * 1))
			whereTerms = {
				...whereTerms,
				creation: {
					[Op.between]: [bd, ad],
				}
			}
		}

		const criteriosCurso = await CursoTieneCriterio.findAll({
			where: {
				curso_ID: id,
			},
			include: !(author?.length > 0) ?
				[
					{
						model: Criterio,
						where: whereTerms
					}
				]
			: 
				[
					{
						model: Usuario,
						where: {
							[Op.or]: [
								{
									accountType: {
										[Op.like]: `%${author}%`
									}
								}, {
									nombres: {
										[Op.like]: `%${author}%`
									}
								}, {
									apellidos: {
										[Op.like]: `%${author}%`
									}
								}
							]
						}
					}, {
						model: Criterio,
						where: whereTerms
					}
				],
			limit: limit,
			offset: limit * page
		})

		for (let c of criteriosCurso) {
			let authorId = (await CursoTieneCriterio.findOne({
				where: {
					criterio_ID: c.Criterio.ID,
				},
			})).dataValues.author_ID
			let author = (await Usuario.findOne({
				where: {
					ID: authorId
				},
				attributes: ["nombres", "apellidos", "accountType"]
			})).dataValues
			criteria.push({
				id: c.Criterio.ID,
				title: c.Criterio.title,
				description: c.Criterio.description,
				has_value: c.Criterio.has_value,
				min: c.Criterio.min,
				creation: {
					date: c.Criterio.creation.toLocaleDateString("es-CO"),
					hour: `${c.Criterio.creation.getHours()}:${c.Criterio.creation.getMinutes()}`
				},
				weight: c.Criterio.weight,
				type: c.Criterio.type,
				author: author.nombres ? `${author.nombres} ${author.apellidos}` : author.accountType
			})
		}
		
		const totalAmount = await Criterio.count()

		res.status(200).json({
			criteria,
			page,
			max_pages: Math.ceil(totalAmount / limit), 
			total: totalAmount,
		})
	} catch (error) {
		console.error(`Error al consultar los criterios de certificación del curso ${id}: ${error}`)
		res.status(500).json({ mensaje: "Error interno al consultar los criterios de certificación" });
	}
}

const createCriteriosCurso = async (req, res) => {
	try {
		const { title, min, description, type, has_value, bias, course } = req.body
		const { id, accountType } = req.user

		if (accountType !== "Administrador" && accountType !== "Instructor") {
			return res.status(403).json({ message: "No tienes permisos para crear criterios." });
		}

		if (!title || !description || !course) {
			return res.status(401).json({message: "Faltan los campos obligatorios."})
		}

		let courseData = await Curso.findByPk(course)

		if (!courseData)
			return res.status(404).json({message: "Curso no encontrado."})

		if (bias) {
			const avgCombined = (await dbInstance.sequelize.query(`SELECT IFNULL(AVG(c.weight), 0) AS full_avg FROM curso_tiene_criterio ctc JOIN criterio c ON ctc.curso_ID = c.ID WHERE ctc.curso_ID = ${course}`))[0][0].full_avg
			if ((parseFloat(avgCombined) + parseFloat(bias)) > 100)
				return res.status(401).json({message: "La ponderación da más del 100%"})
		}

		const newCriteria = await Criterio.create({
			title,
			has_value,
			description,
			min,
			weight: bias,
			type
		})

		await CursoTieneCriterio.create({
			author_ID: id,
			curso_ID: course,
			criterio_ID: newCriteria.ID
		})

		return res.status(200).json({
			message: "Criterio creado con éxito",
			criterio_ID: newCriteria.ID
		})
	} catch (error) {
		console.error(`Error al crear el criterio: ${error}`)
		return res.status(500).json({ message: "Error interno al crear el criterio de certificación" })
	}
}

module.exports = {
	obtenerCriteriosCertificacionCurso,
	createCriteriosCurso,
	setDb
}