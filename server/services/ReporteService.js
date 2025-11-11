const {ReportRepository} = require("../Repository/ReportRepository");
const NotFoundError  = require("../Errors/NotFoundError");
const InscripcionCurso = require("../models/InscripcionCurso");

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

			let cursos = []
			
			for (let curso of result?.cursos) {
				let instructorRaw = null;
				if (curso.Instructor) {
					instructorRaw = curso.Instructor.dataValues || curso.Instructor.toJSON?.() || curso.Instructor;
				}
				
				let nombreInstructor = 'Sin asignar';
				if (instructorRaw) {
					const nombres = instructorRaw.nombres || '';
					const apellidos = instructorRaw.apellidos || '';
					
					if (nombres && apellidos) {
						nombreInstructor = `${nombres} ${apellidos}`.trim();
					} else if (nombres) {
						nombreInstructor = nombres.trim();
					} else if (apellidos) {
						nombreInstructor = apellidos.trim();
					}
					
					if (!nombreInstructor || nombreInstructor === '' || nombreInstructor.toLowerCase().includes('undefined')) {
						nombreInstructor = 'Sin asignar';
					}
				}
				
				cursos.push({
					id: curso.ID,
					nombre_curso: curso.nombre_curso || 'Sin nombre',
					estado: curso.estado || 'Sin estado',
					ficha: curso.ficha || 'Sin ficha',
					nombre_instructor: nombreInstructor,
					empleados: await InscripcionCurso.count({
						where: {
							curso_ID: curso.ID
						}
					})
				})
			}

			const payload = {
				totalItems: result.totalItems,
				totalPage: result.totalPages,
				Page: result.currentPage,
				cursos: cursos,
			}
			return  payload;

		}catch(err){
			console.log(err)
			throw {status: 500, msg: "Error en el servidor "}
		}
	}

	static GetAttendanceProgressReport = async (filtros) => {
		try {
			const { learnerId, courseId, dateFrom, dateTo } = filtros;

			// Validar que al menos haya un filtro
			if (!learnerId && !courseId && !(dateFrom && dateTo)) {
				return null;
			}

			const result = await ReportRepository.GetAttendanceProgressReport({
				learnerId: learnerId || null,
				courseId: courseId || null,
				dateFrom: dateFrom || null,
				dateTo: dateTo || null
			});

			if (!result || result.found === false) {
				return null;
			}

			return {
				records: result.data,
				metrics: result.metrics,
				total: result.total
			};

		} catch (error) {
			console.error('Error en GetAttendanceProgressReport:', error);
			throw new Error('Error al generar el reporte de asistencia y progreso');
		}
	}

	static GetCoursesByLearner = async (learnerId) => {
		try {
			if (!learnerId) {
				return { success: false, message: 'ID de aprendiz requerido' };
			}

			const result = await ReportRepository.GetCoursesByLearner(learnerId);
			return result;
		} catch (error) {
			console.error('Error en GetCoursesByLearner:', error);
			throw new Error('Error al obtener cursos del aprendiz');
		}
	}

	static GetLearnersByCourse = async (courseId) => {
		try {
			if (!courseId) {
				return { success: false, message: 'ID de curso requerido' };
			}

			const result = await ReportRepository.GetLearnersByCourse(courseId);
			return result;
		} catch (error) {
			console.error('Error en GetLearnersByCourse:', error);
			throw new Error('Error al obtener aprendices del curso');
		}
	}
}

module.exports = { ReporteService };