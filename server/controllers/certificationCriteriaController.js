const Curso = require("../models/curso");

let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

// Consultar los criterios de un curso
const obtenerCriteriosCertificacionCurso = async (req, res) => {
	const { id } = req.params
	const page = req.params.page ?? 0
	try {
		let criteria = []
		let course = await Curso.findByPk(id)

		if (!course)
			return res.status(404).json({message: "Curso no encontrado."})

		res.status(200).json({
			criteria
		})
	} catch (error) {
		console.log(`Error al consultar los criterios de certificación del curso ${id}: ${error}`)
	}
}

module.exports = {
	obtenerCriteriosCertificacionCurso,
	setDb
}