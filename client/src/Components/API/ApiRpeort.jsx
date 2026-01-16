import axiosInstance from "../../config/axiosInstance";
import { API_URL } from "../../config/env";

export const getCursos = async (page) => {
	const data = (await axiosInstance.get(`/api/reports/ObtenerCursos/admin/${page}`))?.data
	
	//Mapeo
	const cursos = data?.curso?.cursos.map(curso => {
		let instructorNombre = 'Sin asignar';
		if (curso.nombre_instructor) {
			const instructorTrimmed = curso.nombre_instructor.trim();
			if (instructorTrimmed && 
				instructorTrimmed !== 'undefined undefined' && 
				instructorTrimmed !== 'undefined' &&
				!instructorTrimmed.toLowerCase().includes('undefined')) {
				instructorNombre = instructorTrimmed;
			}
		}
		
		let estadoNormalizado = curso.estado || 'Sin estado';
		if (estadoNormalizado.toLowerCase() === 'activo') {
			estadoNormalizado = 'Activo';
		} else if (estadoNormalizado.toLowerCase() === 'inactivo') {
			estadoNormalizado = 'Inactivo';
		}
		
		return {
			id: curso.id,
			curso: curso.nombre_curso || 'Sin nombre',
			ficha: curso.ficha || 'Sin ficha',
			estado: estadoNormalizado,
			instructor: instructorNombre,
			empleados: curso.empleados || 0
		};
	}).filter(curso => curso !== null && curso !== undefined)
	
	return cursos;
	
}

export const getIdCurso = async (id) => {
    const res = await fetch(`${API_URL}/api/courses/cursos/${id}`, {
        method : "GET",
        credentials : "include"
    })
    const data = await res.json()
    return data
}

export const getAllInscripciones = async (page) =>{
	const res = await fetch(`${API_URL}/api/courses/getAllInscripciones/${page}`,{
		method : "GET",
		credentials : "include"
	})

	const data = await res.json()
	const inscritos = data.map((d) =>({
		id: d.id,
		nombres : d.nombres,
		apellidos : d.apellidos,
		empresa : d.empresa,
		celular : d.celular,
		email : d.email,
		fecha_inscripcion : d.fecha_inscripcion,
		estado : d.estado
	}))
	return inscritos
}

export const updateBulkStatus = async (estadosP) =>{
	try {
		if (!Array.isArray(estadosP) || estadosP.length === 0) {
			return // console.log("No se envio ninguna informacion")
		}
		const res = await axiosInstance.put('/api/courses/updateStatusInscripciones', {estadosP})
		
		return res.status
	} catch (error) {
		return error
	}
}