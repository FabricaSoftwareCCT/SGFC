import * as xlsx from "xlsx"
import axiosInstance from "../../config/axiosInstance"
import Swal from 'sweetalert2';
import 'sweetalert2/themes/bulma.css'

export const generarExcelHistorial = async (aprentices, curso, id, done) => {
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
        Swal.fire({
          icon:"error",
          title:"Error del sistema",
          text:"Ocurrió un error al general el excel",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
              })
	}
}

export const generarExcelCriterios = async (id, curso, done) => {
	try {
		const criteria = (await axiosInstance.get(`/api/certification/course/${id}?limit=9999`)).data.criteria
		console.log(criteria)
		const criteriaData = criteria.map((c) => ({
			"Criterio": c.title,
			"Descripción": c.description,
			"Mínimo": c.min,
			"Tipo": c.type,
			"Fecha de creación": `${c.creation.date} ${c.creation.hour}`,
			"Creador": c.author 
		}))
		let workBook = xlsx.utils.book_new()
		xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(criteriaData))
		xlsx.writeFile(workBook, `Criterios de certificación del curso ${curso.nombre_curso} - ${curso.ficha}.xlsx`, { compression: true })
		done()
	} catch (error) {
		console.log(error)
		Swal.fire({
          icon:"error",
          title:"Error del sistema",
          text:"Ocurrió un error al general el excel",
          confirmButtonText:"Okay",
          theme:"bulma",
          customClass:{
        confirmButton: 'button is-primary',
        actions: 'swal2-actions-centered'
                }
              })
	}
}