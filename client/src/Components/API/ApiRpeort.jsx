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
        empleados: 0
        })
    )
    
    return cursos;
    
}