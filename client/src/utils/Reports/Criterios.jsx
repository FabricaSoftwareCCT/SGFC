import * as xlsx from "xlsx"
import axiosInstance from "../../config/axiosInstance"

export const generarExcel = async (aprentices, curso, id, done) => {
	try {
		let aprenticesData = []
		for (let a of aprentices) {
			const aprenticeFullData = (await axiosInstance.get(`/api/users/profile/${a.id}`)).data
			const criteriaAprentice = (await axiosInstance.get(`/api/certification/course/${id}/aprendiz/${a.id}`)).data
			let ap = {
				"Nombre": `${aprenticeFullData.nombres} ${aprenticeFullData.apellidos}`,
				"Documento": aprenticeFullData.documento,
				"Numero": aprenticeFullData.celular,
				"Email": aprenticeFullData.email,
				"Estado": aprenticeFullData.estado,
				"Empresa": aprenticeFullData.Empresa.nombre_empresa,
				"Estado de certificación": criteriaAprentice.certification_status,
			}
			for (let c of criteriaAprentice.criteria) {
				ap[c.title] = `${c.value} / ${c.min}`
			}
			aprenticesData.push(ap)
		}
		
		let workBook = xlsx.utils.book_new()
		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(aprenticesData))
		xlsx.writeFile(workBook, `Reporte del curso ${curso.nombre_curso} - ${curso.ficha}.xlsx`, { compression: true })
		done()
	} catch (error) {
		console.log(error)
		alert("Ocurrió un error al general el excel")
	}
}