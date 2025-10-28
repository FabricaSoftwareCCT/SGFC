const Criterio = require("../models/Criterio");
const Curso = require("../models/curso");
const Usuario = require("../models/User");
const UsuarioEdita = require("../models/UsuarioEdita");

let dbInstance;

const setDb = (databaseInstance) => {
	dbInstance = databaseInstance
}

const addHistorial = async (autor, edicion, mensaje) => {
	const autorData = (await Usuario.findByPk(autor)).dataValues

	let curso = null
	let criterio = null
	let usuario = null
	
	if (edicion.curso)
		curso = await (await Curso.findByPk(edicion.curso)).dataValues

	if (edicion.criterio)
		criterio = await (await Criterio.findByPk(edicion.criterio)).dataValues

	if (edicion.usuario)
		usuario = (await Usuario.findByPk(edicion.usuario)).dataValues

	const msg = mensaje
		.replaceAll("[nombre]", `${autorData.accountType === "Administrador" ? "Administrador" : `${autor.nombres} ${autorData.apellidos}`}`)
		.replaceAll("[id]", autor)
		.replaceAll("[usuario]", `${usuario?.nombres} ${usuario?.apellidos}`)
		.replaceAll("[usuario_id]", edicion.usuario)
		.replaceAll("[curso]", curso?.nombre_curso)
		.replaceAll("[curso_id]", edicion.curso)
		.replaceAll("[criterio]", criterio?.title)
		.replaceAll("[criterio_id]", edicion.criterio)

	console.log(`${new Date().toLocaleString("es-CO")}: ${msg}`)

	let editData = {
		descripcion: msg,
		autor_ID: autor
	}

	if (curso) {
		editData = {
			...editData,
			curso_ID: edicion.curso
		}
	}

	if (criterio) {
		editData = {
			...editData,
			criterio_ID: edicion.criterio
		}
	}

	if (usuario) {
		editData = {
			...editData,
			usuario_ID: edicion.usuario
		}
	}

	await UsuarioEdita.create(editData)
}

const getHistorial = async (req, res) => {
	try {
		const { page } = req.query

		const historialData = await UsuarioEdita.findAndCountAll({
			limit: 10,
			offset: 10 * (page ?? 0)
		})

		res.status(200).json({
			total: historialData.count,
			historial: historialData.rows
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: "Ocurrió un error interno al consultar el historial"
		})
	}
}

module.exports = {
	setDb,
	addHistorial,
	getHistorial
}