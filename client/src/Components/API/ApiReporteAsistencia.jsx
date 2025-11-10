import axiosInstance from '../../config/axiosInstance';

export const getAllCursosForFilters = async () => {
  try {
    const response = await axiosInstance.get('/api/reports/ObtenerCursos/admin/1');
    const cursos = response.data?.curso?.cursos || [];
    return cursos.map(c => ({ id: c.id, name: c.nombre_curso }));
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
    const response = await axiosInstance.get('/api/reports/courses-by-learner', {
      params: { learnerId }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cursos del aprendiz:', error);
    throw error;
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

