let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
	dbInstance = databaseInstance;
};

// Consultar los criterios de un curso
const obtenerCriteriosCertificacionCurso = async (req, res) => {
	//const { id, page } = req.params;

	try {
		print(id, page)
		res.status(200).json({})
	} catch (error) {
		console.log(`Error al consultar los criterios de certificación del curso ${id}: error`)
	}
}

module.exports = {
	obtenerCriteriosCertificacionCurso,
	setDb
}