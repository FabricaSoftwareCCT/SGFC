const {ReportRepository} = require("../Repository/ReportRepository");

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
            

            const user = reporte.map(item => ({
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
}

module.exports = { ReporteService };