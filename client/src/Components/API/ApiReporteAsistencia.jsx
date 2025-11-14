import axiosInstance from '../../config/axiosInstance';

export const getAllCursosForFilters = async () => {
  try {
		const response = await axiosInstance.get('/api/courses/cursos');
		const cursos = response.data || [];
		return cursos.map((c) => ({
			id: c.ID || c.Id || c.id || c.curso_ID,
			name: c.nombre_curso || c.Nombre || c.nombre || 'Sin nombre',
		}));
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    throw error;
  }
};

export const getAllLearnersForFilters = async () => {
  try {
    const response = await axiosInstance.get('/api/users/admin/empleados?limit=9999');
    const empleados = response?.data?.empleados || [];
    return empleados.map(e => ({ 
      id: e.ID || e.id || e.documento, 
      name: `${e.nombres} ${e.apellidos}`, 
      documento: e.documento 
    }));
  } catch (error) {
    console.error('Error al obtener aprendices:', error);
    throw error;
  }
};

export const getCoursesByLearner = async (learnerId) => {
  try {
		const normalizedLearnerId = Number(learnerId);
		const learnerParam = !Number.isNaN(normalizedLearnerId)
			? normalizedLearnerId
			: learnerId;

		const { data } = await axiosInstance.get('/api/reports/courses-by-learner', {
			params: { learnerId: learnerParam },
		});
		const coursesRaw = data?.courses || data?.data || data?.curso || [];

		const normalized = coursesRaw.map((course) => {
			const courseId =
				course?.id ??
				course?.Id ??
				course?.ID ??
				course?.curso_ID ??
				course?.Curso?.ID ??
				course?.curso?.ID ??
				course?.courseId ??
				course?.aprendizCursoId ??
				course?.id_curso ??
				null;

			const courseName =
				course?.name ??
				course?.nombre ??
				course?.nombre_curso ??
				course?.Curso?.nombre_curso ??
				course?.curso?.nombre_curso ??
				'Sin nombre';

			return {
				id: courseId,
				name: courseName,
				raw: course,
			};
		});

		return {
			success: data?.success !== false,
			courses: normalized.filter((course) => course.id != null),
		};
  } catch (error) {
    console.error('Error al obtener cursos del aprendiz:', error);
		return {
			success: false,
			message: error?.response?.data?.message || 'Error al obtener cursos',
			courses: [],
		};
  }
};

export const getLearnersByCourse = async (courseId) => {
  try {
    const response = await axiosInstance.get('/api/reports/learners-by-course', {
      params: { courseId }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener aprendices del curso:', error);
    throw error;
  }
};

export const getAttendanceProgressReport = async (filters) => {
  try {
    const params = {};
    if (filters.learnerId) params.learnerId = filters.learnerId;
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.dateFrom) {
      const dateFromFormatted = filters.dateFrom.includes('T') 
        ? filters.dateFrom.split('T')[0]
        : filters.dateFrom;
      params.dateFrom = dateFromFormatted;
    }
    if (filters.dateTo) {
      const dateToFormatted = filters.dateTo.includes('T')
        ? filters.dateTo.split('T')[0]
        : filters.dateTo;
      params.dateTo = dateToFormatted;
    }
    const response = await axiosInstance.get('/api/reports/asistencia-progreso', { params });
    return response.data;
  } catch (error) {
    console.error('Error al generar reporte:', error);
    throw error;
  }
};

