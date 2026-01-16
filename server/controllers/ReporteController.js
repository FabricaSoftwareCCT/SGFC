const express = require("express");
const {ReporteService} = require("../services/ReporteService");
const  NotFoundError = require("../Errors/NotFoundError");

class ReporteController {
    static Searchreport = async (req, res) => {
        try {
            const {nombre_curso} = req.body;
            const filtre = req.FiltreValidos;

            const response = await ReporteService.SearchReport(nombre_curso, filtre);

            if(!response){
                res.status(404).json({msg: "No se encontraron resultados"} );
                return;
            }

            res.status(200).json(response);
            return;
        }catch (err) {
            console.log(err);
            res.status(500).json({msg: 'Error en el servidor'});
            return;
        }

    }
    
    static ReporteEficiencia = async (req, res) => {
        try {
            const {fecha_inicio, fecha_fin} = req.body;

            const response = await ReporteService.ReporteEficiencia(fecha_inicio, fecha_fin);

            if(!response){
                res.status(404).json({msg: "No se encontraron resultados"} );
                return;
            }

            res.status(200).json(response);
            return;

        }catch (err) {  
            console.log(err);
            res.status(500).json({msg: 'Error en el servidor'});
            return;
        }
    }

    static GetCursosReporte = async (req, res) => {
        try {
            const page = req.params.page;

            const response = await ReporteService.GetCursos(page)

            res.status(200).json({
                msg: "Cursos Obtenidos",
                curso: response
            })

        }catch(err){
            if(err instanceof NotFoundError){
                res.status(404).json({error: err.message})
            }

            console.log(err)
            res.status(500).json({msg: "Erro en servidor "})
        }
    }

    static GetAttendanceProgressReport = async (req, res) => {
        try {
            const { learnerId, courseId, dateFrom, dateTo } = req.query;

            // Validar que al menos haya un criterio de búsqueda
            if (!learnerId && !courseId && !(dateFrom && dateTo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar al menos un criterio de búsqueda: aprendiz, curso o rango de fechas'
                });
            }

            // Validar rango de fechas si se proporciona
            if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes proporcionar ambas fechas (inicio y fin) para el rango'
                });
            }

            if (dateFrom && dateTo) {
                const start = new Date(dateFrom);
                const end = new Date(dateTo);
                if (start > end) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de inicio no puede ser mayor a la fecha fin'
                    });
                }
            }

            const response = await ReporteService.GetAttendanceProgressReport({
                learnerId: learnerId || null,
                courseId: courseId || null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null
            });

            if (!response || !response.records || response.records.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontraron registros de asistencia para los criterios seleccionados'
                });
            }

            return res.status(200).json({
                success: true,
                records: response.records,
                metrics: response.metrics,
                total: response.total
            });

        } catch (error) {
            console.error('Error en GetAttendanceProgressReport:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al generar el reporte de asistencia y progreso'
            });
        }
    }

    static GetCoursesByLearner = async (req, res) => {
        try {
            const { learnerId } = req.query;

            if (!learnerId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de aprendiz requerido'
                });
            }

            const response = await ReporteService.GetCoursesByLearner(learnerId);

            if (!response || !response.success) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontraron cursos para este aprendiz'
                });
            }

            return res.status(200).json({
                success: true,
                courses: response.courses || []
            });

        } catch (error) {
            console.error('Error en GetCoursesByLearner:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener cursos del aprendiz'
            });
        }
    }

    static GetLearnersByCourse = async (req, res) => {
        try {
            const { courseId } = req.query;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso requerido'
                });
            }

            const response = await ReporteService.GetLearnersByCourse(courseId);

            if (!response || !response.success) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontraron aprendices para este curso'
                });
            }

            return res.status(200).json({
                success: true,
                learners: response.learners || []
            });

        } catch (error) {
            console.error('Error en GetLearnersByCourse:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener aprendices del curso'
            });
        }
    }
}

module.exports = { ReporteController };