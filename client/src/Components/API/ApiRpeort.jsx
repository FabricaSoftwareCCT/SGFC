export const getCursos = async (page) => {
    const res = await fetch(`http://localhost:3001/api/reports/ObtenerCursos/admin/${page}`, {
            method: "GET",
            credentials: "include"
        })

    const data = await res.json()
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