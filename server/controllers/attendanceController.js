const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendNotification } = require('../services/notificationService');
let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
    dbInstance = databaseInstance;
};

/**
 * Registrar asistencia para un curso
 */
const registerAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { usuario_ID, estado, fecha } = req.body;
        const registrador_ID = req.user.id;

        
        // Validar fecha futura
        const fechaAsistencia = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaAsistencia > hoy) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden registrar asistencias para fechas futuras'
            });
        }

        // Obtener información del curso
        const curso = await dbInstance.Curso.findByPk(courseId);
        if (!curso) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        // Obtener información del aprendiz
        const aprendiz = await dbInstance.Usuario.findByPk(usuario_ID);
        if (!aprendiz) {
            return res.status(404).json({
                success: false,
                message: 'Aprendiz no encontrado'
            });
        }

        // Crear la asistencia con la fecha proporcionada
        const asistencia = await dbInstance.Asistencia.create({
            usuario_ID,
            estado_asistencia: estado || 'Pendiente',
            registrado_por: registrador_ID,
            fecha: fecha ? new Date(fecha) : new Date(),
            curso_ID: courseId
        });

        // Si el estado es 'Ausente', enviar notificación
        if (estado === 'Ausente') {
            const title = `Inasistencia registrada - ${curso.nombre_curso}`;
            const message = `
                <h2>Notificación de Inasistencia</h2>
                <p>Estimado(a) ${aprendiz.nombres} ${aprendiz.apellidos},</p>
                <p>Le informamos que se ha registrado una inasistencia en el curso:</p>
                <ul>
                    <li><strong>Curso:</strong> ${curso.nombre_curso}</li>
                    <li><strong>Ficha:</strong> ${curso.ficha}</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                <p>Por favor, asegúrese de asistir a las próximas sesiones programadas.</p>
                <p>Saludos cordiales,<br>SGFC</p>
            `;

            await sendNotification(
                registrador_ID,  // ✅ remitente
                aprendiz.ID,     // ✅ destinatario  
                'inasistencia',  // ✅ tipo
                title,
                message,
                null,            // sessionId
                curso.ID         // courseId
            );
        }

        res.status(201).json({
            success: true,
            message: 'Asistencia registrada correctamente',
            asistencia
        });
    } catch (error) {
        console.error('Error al registrar la asistencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la asistencia'
        });
    }
};

/**
 * Actualiza el registro de asistencia de un participante
 */
const updateAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { attendanceId, status, fecha } = req.body;
        const instructorId = req.user.id;

        // Validar fecha futura
        const fechaAsistencia = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaAsistencia > hoy) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden actualizar asistencias para fechas futuras'
            });
        }

        if (!attendanceId) {
            return res.status(400).json({
                success: false,
                message: 'ID de asistencia no proporcionado'
            });
        }

        const attendance = await dbInstance.Asistencia.findOne({
            where: {
                ID: attendanceId,
                curso_ID: courseId
            }
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Registro de asistencia no encontrado'
            });
        }

        await attendance.update({
            estado_asistencia: status || 'Pendiente',
            actualizado_por: instructorId,
            fecha_actualizacion: new Date()
        });

        // Si el estado es 'Ausente', enviar notificación
        if (status === 'Ausente') {
            const curso = await dbInstance.Curso.findByPk(courseId);
            const aprendiz = await dbInstance.Usuario.findByPk(attendance.usuario_ID);

            if (curso && aprendiz) {
                const title = `Inasistencia registrada - ${curso.nombre_curso}`;
                const message = `
                    <h2>Notificación de Inasistencia</h2>
                    <p>Estimado(a) ${aprendiz.nombres} ${aprendiz.apellidos},</p>
                    <p>Le informamos que se ha registrado una inasistencia en el curso:</p>
                    <ul>
                        <li><strong>Curso:</strong> ${curso.nombre_curso}</li>
                        <li><strong>Ficha:</strong> ${curso.ficha}</li>
                        <li><strong>Fecha:</strong> ${new Date(attendance.fecha).toLocaleDateString()}</li>
                    </ul>
                    <p>Por favor, asegúrese de asistir a las próximas sesiones programadas.</p>
                    <p>Saludos cordiales,<br>SGFC</p>
                `;

                await sendNotification(
                    instructorId,    // ✅ remitente
                    aprendiz.ID,     // ✅ destinatario
                    'inasistencia',  // ✅ tipo  
                    title,
                    message,
                    null,            // sessionId
                    curso.ID         // courseId
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Asistencia actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar la asistencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la asistencia'
        });
    }
};

/**
 * Obtiene los registros de asistencia con filtros
 * Permite filtrar por usuario, fecha y estado
 */
const getAttendanceRecords = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            page = 1,
            limit = 100
        } = req.query;
        const { courseId } = req.params;

        console.log('Parámetros recibidos:', { courseId, startDate, endDate, status });

        const user = req.user;
        let whereClause = {};
        let includeClause = [
            {
                model: dbInstance.Usuario,
                as: 'aprendiz',
                attributes: ['ID', 'nombres', 'apellidos', 'email', 'documento', 'foto_perfil', 'estado'],
                include: [{
                    model: dbInstance.InscripcionCurso,
                    as: 'inscripciones',
                    where: {
                        curso_ID: courseId
                    },
                    attributes: ['estado_inscripcion'],
                    required: false
                }]
            }
        ];

        // Aplicar filtros según el tipo de usuario
        if (user.accountType === 'Empresa') {
            const empresaUser = await dbInstance.Usuario.findByPk(user.id, {
                include: [{ model: dbInstance.Empresa, as: 'Empresa' }]
            });

            if (!empresaUser || !empresaUser.empresa_ID) {
                return res.status(404).json({
                    success: false,
                    message: 'Empresa no encontrada'
                });
            }

            // Modificar la consulta para filtrar por empresa
            includeClause[0].where = {
                empresa_ID: empresaUser.empresa_ID
            };
        }

        // Aplicar filtros adicionales
        if (courseId) {
            whereClause.curso_ID = courseId;
            console.log('Filtrando por curso:', courseId);
        }
        if (status) {
            whereClause.estado_asistencia = status;
            console.log('Filtrando por estado_asistencia:', status);
        }

        // Filtrar por rango de fechas
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.fecha = {
                [Op.between]: [start, end]
            };
            console.log('Filtrando por fecha:', { start, end });
        }

        console.log('Where clause:', whereClause);

        // Primero, verificar si hay registros para este curso
        const curso = await dbInstance.Curso.findByPk(courseId);
        if (!curso) {
            console.log('Curso no encontrado:', courseId);
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        // Realizar la consulta con paginación
        const { count, rows: records } = await dbInstance.Asistencia.findAndCountAll({
            where: whereClause,
            include: includeClause,
            order: [
                ['fecha', 'DESC'],
                ['ID', 'DESC']
            ],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        if (records.length > 0) {
            console.log('Estructura del primer registro:', JSON.stringify(records[0], null, 2));
        } else {
            console.log('No se encontraron registros de asistencia');
        }

        // Transformar los registros para incluir el estado del aprendiz
        const transformedRecords = records.map(record => ({
            ...record.toJSON(),
            aprendiz: {
                ...record.aprendiz.toJSON(),
                estado_inscripcion: record.aprendiz.inscripciones?.[0]?.estado_inscripcion || 'pendiente'
            }
        }));

        res.status(200).json({
            success: true,
            records: transformedRecords,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error al obtener los registros de asistencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los registros de asistencia'
        });
    }
};

module.exports = {
    setDb,
    registerAttendance,
    updateAttendance,
    getAttendanceRecords
}; 