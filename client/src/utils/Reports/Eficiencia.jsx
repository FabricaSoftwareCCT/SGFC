import * as xlsx from "xlsx"

export const generarExcelEficiencia = async (aprendices, done) => {
	try {
		if (!aprendices) 
			throw "No se proporcionaron aprendices"

		let workBook = xlsx.utils.book_new()

		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(aprendices.map((a) => ({
			"Nombres": a.nombre,
			"Apellidos": a.apellido,
			"Documentos": a.documento,
			"Actividades Faltantes": a.faltantes,
			"Actividades Realizadas": a.realizadas,
			"Eficiencia": a.eficiencia
		}))))

		xlsx.writeFile(workBook, `Reporte de eficiencia.xlsx`, { compression: true })
		done()
	} catch (error) {
		console.log(error)
		alert("Ocurrió un error al general el excel")
	}
}