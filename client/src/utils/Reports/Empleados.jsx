import * as xlsx from "xlsx"
import axiosInstance from "../../config/axiosInstance"

export const generarExcelEmpleado = async (empleado, done) => {
	try {
		if (!empleado) 
			throw "Usuario no seleccionado"

		let workBook = xlsx.utils.book_new()

		const cursos = (await axiosInstance.get(`/api/users/aprendiz/${empleado.ID}/cursos`))?.data?.cursos

		let datosCursos = []

		for (let i in cursos) {
			const curso = cursos[i]
			const asistencias = (await axiosInstance.get(`/api/attendance/courses/${curso.ID}/get?limit=999999999`))?.data.records
			console.log(asistencias)
			datosCursos.push({
				"Curso": curso.nombre_curso,
				"Ficha": curso.ficha,
				"Modalidad": curso.modalidad,
				"Dias de formación": JSON.parse(curso.slots_formacion).join(", "),
				"Estado": curso.estado,
				"Inicio": (new Date(curso.fecha_inicio)).toLocaleDateString("es-CO"),
				"Fin": (new Date(curso.fecha_fin)).toLocaleDateString("es-CO"),
			})
		}

		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(datosCursos), "Datos de cursos")

		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet([
			{
				"Nombre": `${empleado.nombres} ${empleado.apellidos}`,
				"Estado": empleado.estado,
				"Email": empleado.email,
				"Documento": empleado.documento,
				"Num. Teléfonico": empleado.celular,
			}
		]), "Datos personales")

		for (let curso of cursos) {
			const criterios = (await axiosInstance.get(`/api/certification/course/${curso.ID}/aprendiz/${empleado.ID}`))?.data.criteria
			let criteriosDatos = []
			for (let criterio of criterios) {
				criteriosDatos.push({
					Criterio: criterio.title,
					"Mínimo para certificarse": criterio.min,
					Valor: criterio.value
				})
			}
			xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(criteriosDatos), `Criterios de ${curso.nombre_curso}`)
		}

		xlsx.writeFile(workBook, `Reporte del empleado ${empleado.nombres} ${empleado.apellidos} - ${new Date().toLocaleString("es-CO")}.xlsx`, { compression: true })
		done()
	} catch (error) {
		console.log(error)
		alert("Ocurrió un error al general el excel")
	}
}