import axiosInstance from "../../config/axiosInstance";

export const getCursos = async (page) => {
    const res = await fetch(`http://localhost:3001/api/reports/ObtenerCursos/admin/${page}`, {
            method: "GET",
            credentials: "include"
        })

    const data = await res.json()
    //Mapeo
    const cursos = data?.curso?.cursos.map(curso => ({
        id: curso.id,
        curso: curso.nombre_curso,
        ficha: curso.ficha,
        estado: curso.estado,
        instructor: curso.nombre_instructor,
        empleados: curso.empleados
        })
    )
    
    return cursos;
    
}

export const getAllInscripciones = async (page) =>{
    const res = await fetch(`http://localhost:3001/api/courses/getAllInscripciones/${page}`,{
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
            return console.log("No se envio ninguna informacion")
        }
        const res = await axiosInstance.put('http://localhost:3001/api/courses/updateStatusInscripciones', {estadosP})
        
        return res.status
    } catch (error) {
        return error
    }
}