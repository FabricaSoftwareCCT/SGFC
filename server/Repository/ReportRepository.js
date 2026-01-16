const { Op } = require("sequelize");

let db;

const setDb = (dbInstance) => {
  db = dbInstance;
};

class ReportRepository {
    static SearchReport = async  ( filtre) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }
            const result = await db.Curso.findOne({
                where: filtre,
                attributes: ["nombre_curso","descripcion","ficha", "lugar_formacion", "fecha_inicio", "fecha_fin", "estado"],
                include: [
                    {model: db.Usuario, as: 'aprendices', attributes: ["nombres","apellidos","email", "estado"],
                        include: [
                            {model: db.Asistencia, as: 'asistencias', attributes: ["estado_asistencia","fecha","registrado_por"]}
                        ]
                    }
                ],
            });

           if (!result) {
                return { found: false, message: "No se encontraron resultados" };
            }

            return { found: true, data: result };

        }catch(err){
            console.error("Errror en el servidor:", err.message);
            throw new Error("Error al buscar el reporte");
        }
    }

    static ReporteEficiencia = async (fecha_inicio, fecha_fin) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }
            const result = await db.Curso.findAll({    
                where: {
                    fecha_creacion: {
                        [Op.between]: [fecha_inicio, fecha_fin]
                    },
                },
                attributes: ["nombre_curso","descripcion","ficha", "lugar_formacion", "fecha_inicio", "fecha_fin", "estado"],
                include: [
                    {model: db.Usuario, as: 'aprendices', attributes: ["nombres","apellidos", "documento","email", "estado"],
                        include: [
                            {model: db.Asistencia, as: 'asistencias', where: {
                                fecha_asistencia: {
                                    [Op.between]: [fecha_inicio, fecha_fin]
                                },
                                attributes: ["estado_asistencia","fecha","registrado_por"],
                            },
                            required: false,
                            attributes: ["estado_asistencia","fecha","registrado_por"]
                            },
                        ],  
                    }
                ]
            });


            if(!result || result.length === 0) {
                return { found: false, message: "No se encontraron resultados" };
            }

            return { found: true, data: result };
            

        }catch(error){
            console.log(errror)
            throw new Error('Error al generar el reporte de eficiencia');
        }
    }

    static GetCursosAll = async (page) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }
            const limit = 10;
            const offset = (page - 1) * 10;

            const {count , rows } = await db.Curso.findAndCountAll({
                attributes : ["ID", "nombre_curso", "estado", "ficha"],
                include: [{
                    model: db.Usuario, as: "Instructor",
                    attributes: ["nombres","apellidos"],
                    where: {
                        accountType: 'Instructor'
                    },
                    required: false
                }],
                limit: limit,
                offset: offset,
            })

            const totalPages = Math.ceil(count / limit)

            const data ={
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                cursos: rows
            }

            if(!data){
                return null;
            }

            return data;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor "}
        }
    }

    static GetAttendanceProgressReport = async (filtros) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }
            const { learnerId, courseId, dateFrom, dateTo } = filtros;
            
            const whereConditions = [];
            let includeClause = [
                {
                    model: db.Usuario,
                    as: 'aprendiz',
                    attributes: ['ID', 'nombres', 'apellidos', 'email', 'documento', 'estado'],
                    required: true
                },
                {
                    model: db.Curso,
                    as: 'curso',
                    attributes: ['ID', 'nombre_curso', 'ficha', 'fecha_inicio', 'fecha_fin', 'estado'],
                    required: true
                },
                {
                    model: db.Usuario,
                    as: 'registrador',
                    attributes: ['ID', 'nombres', 'apellidos'],
                    required: false
                }
            ];

            // Filtrar por aprendiz
            if (learnerId) {
                whereConditions.push({ usuario_ID: learnerId });
            }

            // Filtrar por curso
            if (courseId) {
                whereConditions.push({ curso_ID: courseId });
            }

            // Filtrar por rango de fechas - CORREGIDO para comparar correctamente
            if (dateFrom && dateTo) {
                // Normalizar fechas: asegurar formato YYYY-MM-DD
                const startDateStr = dateFrom instanceof Date 
                    ? dateFrom.toISOString().split('T')[0]
                    : String(dateFrom).split('T')[0].split(' ')[0];
                
                const endDateStr = dateTo instanceof Date
                    ? dateTo.toISOString().split('T')[0]
                    : String(dateTo).split('T')[0].split(' ')[0];
                
                // Crear objetos Date para comparación correcta
                const startDate = new Date(startDateStr + 'T00:00:00');
                const endDate = new Date(endDateStr + 'T23:59:59');
                
                // Usar Op.between con fechas completas (incluyendo hora)
                whereConditions.push({
                    fecha: {
                        [Op.between]: [startDate, endDate]
                    }
                });
            }

            // Construir el whereClause final
            const whereClause = whereConditions.length > 0 
                ? { [Op.and]: whereConditions }
                : {};

            const records = await db.Asistencia.findAll({
                where: whereClause,
                include: includeClause,
                order: [
                    ['fecha', 'DESC'],
                    ['ID', 'DESC']
                ]
            });

            if (!records || records.length === 0) {
                return { found: false, message: 'No se encontraron registros de asistencia' };
            }

            // Transformar los datos para el reporte
            const transformedData = records.map(record => {
                const recordData = record.toJSON();
                const nombreRegistrador = recordData.registrador 
                    ? `${recordData.registrador.nombres || ''} ${recordData.registrador.apellidos || ''}`.trim()
                    : 'N/A';
                
                return {
                    nombreUser: recordData.aprendiz?.nombres || '',
                    apellidoUser: recordData.aprendiz?.apellidos || '',
                    documentoUser: recordData.aprendiz?.documento || '',
                    emailUser: recordData.aprendiz?.email || '',
                    nombreCurso: recordData.curso?.nombre_curso || '',
                    fichaCurso: recordData.curso?.ficha || '',
                    estadoAsistencia: recordData.estado_asistencia || 'Pendiente',
                    fechaAsistencia: recordData.fecha || null,
                    registradoPor: nombreRegistrador,
                    registradoPorId: recordData.registrado_por || null,
                    curso_ID: recordData.curso_ID,
                    usuario_ID: recordData.usuario_ID
                };
            });

            // Calcular métricas agregadas por aprendiz y curso
            const metrics = {};
            transformedData.forEach(record => {
                const key = `${record.usuario_ID}_${record.curso_ID}`;
                if (!metrics[key]) {
                    metrics[key] = {
                        usuario_ID: record.usuario_ID,
                        curso_ID: record.curso_ID,
                        nombreCompleto: `${record.nombreUser} ${record.apellidoUser}`,
                        documento: record.documentoUser,
                        nombreCurso: record.nombreCurso,
                        totalRegistros: 0,
                        presentes: 0,
                        ausentes: 0,
                        pendientes: 0,
                        porcentajeAsistencia: 0
                    };
                }
                metrics[key].totalRegistros++;
                if (record.estadoAsistencia === 'Presente') {
                    metrics[key].presentes++;
                } else if (record.estadoAsistencia === 'Ausente') {
                    metrics[key].ausentes++;
                } else {
                    metrics[key].pendientes++;
                }
            });

            // Calcular porcentajes
            Object.values(metrics).forEach(metric => {
                const totalEvaluado = metric.presentes + metric.ausentes;
                if (totalEvaluado > 0) {
                    metric.porcentajeAsistencia = ((metric.presentes / totalEvaluado) * 100).toFixed(2);
                }
            });

            return {
                found: true,
                data: transformedData,
                metrics: Object.values(metrics),
                total: transformedData.length
            };

        } catch (error) {
            console.error('Error en GetAttendanceProgressReport:', error);
            throw new Error('Error al generar el reporte de asistencia y progreso');
        }
    }

    static GetCoursesByLearner = async (learnerId) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }

            const inscriptions = await db.InscripcionCurso.findAll({
                where: {
                    aprendiz_ID: learnerId,
                    estado_inscripcion: 'activo'
                },
                include: [
                    {
                        model: db.Curso,
                        attributes: ['ID', 'nombre_curso', 'ficha', 'estado'],
                        required: true
                    }
                ]
            });

            const coursesMap = new Map();
            
            inscriptions.forEach(inscription => {
                const inscriptionData = inscription.toJSON ? inscription.toJSON() : inscription;
                const cursoData = inscriptionData.Curso;
                if (cursoData && cursoData.ID) {
                    if (!coursesMap.has(cursoData.ID)) {
                        coursesMap.set(cursoData.ID, {
                            id: cursoData.ID,
                            name: cursoData.nombre_curso,
                            ficha: cursoData.ficha
                        });
                    }
                }
            });

            const courses = Array.from(coursesMap.values());

            return { success: true, courses };
        } catch (error) {
            console.error('Error en GetCoursesByLearner:', error);
            throw new Error('Error al obtener cursos del aprendiz');
        }
    }

    static GetLearnersByCourse = async (courseId) => {
        try {
            if (!db) {
                throw new Error('Base de datos no inicializada');
            }

            const inscriptions = await db.InscripcionCurso.findAll({
                where: {
                    curso_ID: courseId,
                    estado_inscripcion: 'activo'
                },
                include: [
                    {
                        model: db.Usuario,
                        as: 'aprendiz',
                        attributes: ['ID', 'nombres', 'apellidos', 'documento', 'email', 'estado', 'accountType'],
                        where: {
                            estado: 'activo',
                            accountType: 'Aprendiz'
                        },
                        required: true
                    }
                ]
            });

            const learnersMap = new Map();
            
            inscriptions.forEach(inscription => {
                const inscriptionData = inscription.toJSON ? inscription.toJSON() : inscription;
                const aprendizData = inscriptionData.aprendiz;
                if (aprendizData && aprendizData.ID) {
                    if (!learnersMap.has(aprendizData.ID)) {
                        learnersMap.set(aprendizData.ID, {
                            id: aprendizData.ID,
                            name: `${aprendizData.nombres || ''} ${aprendizData.apellidos || ''}`.trim(),
                            documento: aprendizData.documento || '',
                            email: aprendizData.email || ''
                        });
                    }
                }
            });

            const learners = Array.from(learnersMap.values());

            return { success: true, learners };
        } catch (error) {
            console.error('Error en GetLearnersByCourse:', error);
            throw new Error('Error al obtener aprendices del curso');
        }
    }

    /*
    static GetEmpleadosByIdCurso = async (id, page) => {
       try{
            const limit = 10;
            const offset = (page - 1) * limit;

            const {count, rows} = await Curso.findAll({
                where: {
                    ID: id,
                },
                attributes: ["ID", "nombre_curso"],
                include: [{
                    model: User, as: "Empleados",
                    attributes: ["nombres", "apellidos", "documento","estado"],
                    include: [{
                        model: Asistencia, attributes: [],

                    }]
                }],
                    attributes: [
                        "ID",
                        "fecha",
                    [
                        Asistencia.sequelize.literal(`(
                            select count(*) from Asistencia as "As" 
                            where "As"."usuarios_ID" = "Usuarios"."ID" AND 
                            "As"."estado_asistencia" = presente
                            )`),
                        "Asistencias"
                    ],
                    [
                        Asistencia.sequelize.literal(`(
                            select count(*) from Asistencia as "As" where
                            "As"."usuarios_ID" = "usuarios".ID" AND" "As"."estado_asistencia" = ausente
                            )`),
                        "Faltas"
                    ],
                ],
                limit: limit,
                offset: offset
        })

        const totalPages = Math.ceil(count / limit);
        
        const data = {
            totalPages: totalPages,
            currentPage: page,
            empleados: rows
        }

        if(!data){
            return null;
        }

        return data;
       }catch(err){
            console.log(err)
            throw {status:500, msg: "Error en el servidor"}
       }
    }
    */
}

module.exports = { ReportRepository, setDb };