const {ReportRepository} = require("../Repository/ReportRepository");
const NotFoundError  = require("../Errors/NotFoundError");

class ReporteService {  
    static SearchReport = async (nombres, filtre) => {
        try {
            //Buscar toodos usuario y filtro
            const query = {};

            if(nombres){
                query["nombre_curso"] = nombres;
            }
            
            if(filtre.length > 0){
                for(const name of filtre) {
                    const key = Object.keys(name)[0];
                    const value = name[key];
                    query[key] = value;
                }
            }

            const reporte = await ReportRepository.SearchReport(query);
        
            if(reporte.found === false) {
                return null;
            }
            

            const user = reporte?.data?.map(item => ({
                    nombreUser: item.User.nombres,
                    emailUser: item.User.email,
                    documentoUser: item.User.documento,
                    nombreCurso: item.Curso.nombre_curso,
                    estadoCurso: item.Curso.estado,
                    fechaInicio: item.Curso.fecha_inicio,
                    fechaFin: item.Curso.fecha_fin,
                    ficha: item.Curso.ficha,
                    lugarFormacion: item.Curso.lugar_formacion,
                    estadoAsistencia: item.asistencia.estado_asistencia,
                    fechaAsistencia: item.asistencia.fecha,
                    registradoPor: item.asistencia.registrado_por
                })
            );

            return user;

        }catch(error){
            console.log(error);
            throw new Error('Error al buscar el reporte');
        }
    }

    static ReporteEficiencia = async (fecha_inicio, fecha_fin) => {
        try {

            const reporte = await ReportRepository.ReporteEficiencia(fecha_inicio, fecha_fin);

            if(reporte.found === false){
                return null;
            }

            const result = reporte?.data?.map(curso => ({
                    nombreCurso: curso.nombre_curso,
                    descripcion: curso.descripcion,
                    ficha: curso.ficha,
                    lugarFormacion: curso.lugar_formacion,
                    fechaInicio: curso.fecha_inicio,
                    fechaFin: curso.fecha_fin,
                    estado: curso.estado,
                    aprendices: curso.aprendices.map(aprendiz => ({
                        nombres: aprendiz.nombres,
                        apellidos: aprendiz.apellidos,
                        documento: aprendiz.documento,
                        email: aprendiz.email,
                        estado: aprendiz.estado,
                        asistencias: aprendiz.asistencias.map(asistencia => ({
                                estadoAsistencia: asistencia.estado_asistencia,
                                fecha: asistencia.fecha,
                                registradoPor: asistencia.registrado_por
                                })
                            )
                        })
                    )
                })
            );

            return result;

        }catch(error){
            console.log(error);
            throw new Error('Error al generar el reporte de eficiencia');
        }
    }

    static GetCursos = async (page) => {
        try{
            const result = await ReportRepository.GetCursosAll(page)

            if(!result){
                throw new NotFoundError('Curso no encontrado');
            }

            const cursos = result?.cursos.map(curso => ({
                id: curso.ID,
                nombre_curso: curso.nombre_curso,
                estado: curso.estado,
                ficha: curso.ficha,
                nombre_instructor: curso.Instructor?.dataValues?.nombres +" "+ curso.Instructor?.dataValues?.apellidos
            }))

            const payload = {
                totalItems: result.totalItems,
                totalPage: result.totalPages,
                Page: result.currentPage,
                cursos: cursos
            }
            return  payload;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor "}
        }
    }
}

module.exports = { ReporteService };