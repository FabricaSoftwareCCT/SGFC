import * as xlsx from "xlsx"
import axiosInstance from "../../config/axiosInstance"

export const generarExcelEmpleado = async (empleado, done) => {
	console.log(empleado)
	try {
		let workBook = xlsx.utils.book_new()
		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet([
			{
				"Nombre": `${empleado.nombres} ${empleado.apellidos}`,
				"Estado": empleado.estado,
				"Email": empleado.email,
				"Documento": empleado.documento,
				"Num. Teléfonico": empleado.celular,
			}
		]))

		const cursos = await axiosInstance.get(`/api/users/aprendiz/${empleado.ID}/cursos`)

		for (let curso of cursos) {
			
		}

		// XLSX.utils.sheet_add_aoa(worksheet, newDataAoA, { origin: -1 });

		//xlsx.writeFile(workBook, `Reporte del empleado ${empleado.nombres} ${empleado.apellidos} - ${new Date().toLocaleString("es-CO")}.xlsx`, { compression: true })
		//done()
	} catch (error) {
		console.log(error)
		alert("Ocurrió un error al general el excel")
	}
}