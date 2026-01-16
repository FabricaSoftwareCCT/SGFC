import * as xlsx from "xlsx"
import axiosInstance from "../../config/axiosInstance"

export const generarExcelEmpleado = async (empleado, done, filters) => {
	try {
		if (!empleado) 
			throw "Usuario no seleccionado"

		let workBook = xlsx.utils.book_new()

		const cursos = (await axiosInstance.get(`/api/users/aprendiz/${empleado.ID}/cursos`))?.data?.cursos

		let datosCursos = []

		for (let i in cursos) {
			const curso = cursos[i]
			const estadoCurso = (await axiosInstance.get(`/api/certification/course/${curso.ID}/aprendiz/${empleado.ID}`))?.data
			const criterios = estadoCurso.criteria

			let totalMin = 0
			let totalValue = 0

			for (let criterio of criterios) {
				totalMin += criterio.min
				totalValue += criterio.value
			}

			let cursoData = {
				"Curso": curso.nombre_curso,
				"Ficha": curso.ficha,
				"Modalidad": curso.modalidad,
				"Dias de formación": JSON.parse(curso.slots_formacion).join(", "),
				"Estado": curso.estado,
				"Inicio": (new Date(curso.fecha_inicio)).toLocaleDateString("es-CO"),
				"Fin": (new Date(curso.fecha_fin)).toLocaleDateString("es-CO"),
				"Progreso": `${parseInt((totalValue * 100) / totalMin)}%`,
				"Certificación": estadoCurso.certification_status.toUpperCase(),
				"Observación": estadoCurso.denial_justification,
				"Entregas": `${estadoCurso.submitted_activities}/${estadoCurso.total_activities}`
			}

			if (filters.presence) {
				const asistencias = (await axiosInstance.get(`/api/attendance/courses/${curso.ID}/get?limit=999999999`))?.data.records
				cursoData = {
					...cursoData,			
					"Cant. Asistencias": asistencias.filter((a) => a.aprendiz.ID == empleado.ID && a.estado_asistencia === "Presente").length,
					"Cant. Inasistencias": asistencias.filter((a) => a.aprendiz.ID == empleado.ID && a.estado_asistencia === "Ausente").length,
				}
			}

			datosCursos.push(cursoData)
		}

		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(datosCursos), "Datos de cursos")

		if (filters.personalData) {
			xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet([
				{
					"Nombre": `${empleado.nombres} ${empleado.apellidos}`,
					"Estado": empleado.estado,
					"Email": empleado.email,
					"Documento": empleado.documento,
					"Num. Teléfonico": empleado.celular,
				}
			]), "Datos personales")
		}

		if (filters.criteria) {
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
		}

		xlsx.writeFile(workBook, `Reporte del empleado ${empleado.nombres} ${empleado.apellidos} - ${new Date().toLocaleString("es-CO")}.xlsx`, { compression: true })
		done()
	} catch (error) {
		// // console.log(error)
		alert("Ocurrió un error al general el excel")
	}
}