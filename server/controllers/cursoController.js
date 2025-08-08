const Curso = require("../models/curso");
const User = require("../models/User");
const Empresa = require('../models/empresa'); // Importar el modelo Empresa
const path = require("path");
const AsignacionCursoInstructor = require("../models/AsignacionCursoInstructor");
const { sendCourseCreatedEmail } = require("../services/emailService");
const { Router } = require("express");
const upload = require("../config/multer");
const { sendCursoUpdatedNotification, sendInstructorAssignedEmail, sendStudentsInstructorAssignedEmail } = require('../services/emailService');
const { Op } = require('sequelize');
const fs = require('fs');
const InscripcionCurso = require('../models/InscripcionCurso');
const InvitacionCurso = require('../models/InvitacionCurso');
const Usuario = require("../models/User");


let dbInstance;

// Función para inyectar la instancia de la base de datos
const setDb = (databaseInstance) => {
  dbInstance = databaseInstance;
};

// Asignar un instructor a un curso
const asignarInstructorAlCurso = async (req, res) => {
  try {
    const { instructor_ID, curso_ID } = req.body;

    if (!instructor_ID || !curso_ID) {
      return res.status(400).json({ message: "El ID del instructor y del curso son obligatorios." });
    }

    // Validar existencia del instructor
    const instructor = await User.findByPk(instructor_ID);
    if (!instructor || instructor.accountType !== "Instructor") {
      return res.status(404).json({ message: "Instructor no encontrado o no válido" });
    }

    // Validar existencia del curso
    const curso = await Curso.findByPk(curso_ID);
    if (!curso) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    // Actualizar el curso con el instructor asignado
    curso.instructor_ID = instructor_ID;
    await curso.save();

    res.status(200).json({
      message: "Instructor asignado correctamente al curso.",
      curso
    });
  } catch (error) {
    console.error("Error al asignar instructor al curso:", error);
    res.status(500).json({ message: "Error interno al asignar el instructor al curso." });
  }
};

//consultar cursos asignador a un instructor
const obtenerCursosAsignadosAInstructor = async (req, res) => {
  const { instructor_ID } = req.params;

  try {
    if (!instructor_ID) {
      return res
        .status(400)
        .json({ mensaje: "El ID del instructor es obligatorio" });
    }

    const asignaciones = await AsignacionCursoInstructor.findAll({
      where: { instructor_ID },
      include: [
        {
          model: Curso,
          attributes: ["id", "nombre_curso", "descripcion", "imagen"],
        }
      ]
    });

    res.status(200).json(asignaciones);
  } catch (error) {
    console.error("Error al obtener los cursos asignados:", error);
    res
      .status(500)
      .json({ mensaje: "Error interno al obtener los cursos asignados" });
  }
};

// Crear un curso (solo para administradores)
const createCurso = async (req, res) => {
  try {
    const { accountType } = req.user;

    if (accountType !== "Administrador") {
      return res.status(403).json({ message: "No tienes permisos para crear cursos." });
    }

    const {
      nombre_curso,
      descripcion,
      tipo_oferta,
      ficha,
      estado,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      dias_formacion,
      lugar_formacion,
      slots_formacion,
      empresa_ID // Esperado solo si tipo_oferta es "Cerrada"
    } = req.body;

    // ✅ Validación estricta del tipo de oferta
    const tipoOfertaValida = ["Cerrada", "Abierta"];
    if (!tipoOfertaValida.includes(tipo_oferta)) {
      return res.status(400).json({
        message: "El tipo de oferta debe ser 'Cerrada' o 'Abierta'."
      });
    }

    // ✅ Validación de empresa_ID si es oferta cerrada
    let finalEmpresaID = null;
    if (tipo_oferta === "Cerrada") {
      if (!empresa_ID || isNaN(Number(empresa_ID))) {
        return res.status(400).json({
          message: "Debe proporcionar un ID de empresa válido para una oferta cerrada."
        });
      }

      const empresa = await Empresa.findByPk(empresa_ID);

      if (!empresa) {
        return res.status(404).json({
          message: `No se encontró una empresa con el ID ${empresa_ID}.`
        });
      }

      finalEmpresaID = empresa_ID;
    }

    // ✅ Validaciones generales del curso
    if (!ficha || isNaN(Number(ficha))) {
      return res.status(400).json({ message: "El campo ficha es obligatorio y debe ser un número." });
    }

    const cursoExistente = await Curso.findOne({ where: { ficha } });
    if (cursoExistente) {
      return res.status(409).json({ message: "Ya existe un curso con la misma ficha." });
    }

    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return res.status(400).json({ message: "La fecha de inicio debe ser anterior a la fecha de fin." });
    }

    if (typeof dias_formacion !== 'string') {
      return res.status(400).json({ message: "El campo dias_formacion debe ser un string." });
    }

    let image = null;
    if (req.file) {
      image = req.file.buffer.toString('base64');
    }

    let slotsFormacionString = null;
    if (slots_formacion) {
      slotsFormacionString = Array.isArray(slots_formacion)
        ? JSON.stringify(slots_formacion)
        : slots_formacion;
    }

    const sena_ID = 1;

    // ✅ Crear el curso
    const nuevoCurso = await Curso.create({
      nombre_curso,
      descripcion,
      tipo_oferta,
      ficha,
      estado,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      dias_formacion,
      lugar_formacion,
      imagen: image,
      sena_ID,
      empresa_ID: finalEmpresaID,
      slots_formacion: slotsFormacionString
    });

    res.status(201).json({ message: "Curso creado con éxito.", curso: nuevoCurso });

    // ✅ Enviar notificación por email (opcional)
    const usuarios = await User.findAll({
      where: {
        verificacion_email: true,
        accountType: { [Op.or]: ['Empresa', 'Aprendiz'] },
      },
      attributes: ['email'],
    });

    const emails = usuarios.map(user => user.email);
    if (emails.length > 0) {
      const courseLink = `http://localhost:5173/cursos/${nuevoCurso.id}`;
      await sendCourseCreatedEmail(emails, nombre_curso, courseLink);
    }

  } catch (error) {
    console.error("Error al crear el curso:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: "Error de validación.", errors: error.errors });
    }

    res.status(500).json({ message: "Error al crear el curso." });
  }
};

// Actualizar un curso (solo para administradores)
const updateCurso = async (req, res) => {
  try {
    const { accountType } = req.user;
    if (accountType !== "Administrador") {
      return res
        .status(403)
        .json({ message: "No tienes permisos para actualizar cursos." });
    }

    const { id } = req.params;
    const {
      nombre_curso,
      descripcion,
      tipo_oferta,
      ficha,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      dias_formacion,
      lugar_formacion,
      estado,
      slots_formacion,
      empresa_ID
    } = req.body;

    // Validar que el curso exista
    const curso = await Curso.findByPk(id);
    if (!curso) {
      return res.status(404).json({ message: "Curso no encontrado." });
    }

    // Verificar si se envió una nueva imagen
    let image = curso.imagen;
    if (req.file) {
      image = req.file.buffer.toString('base64');
    }

    // 🟨 Validar empresa si tipo_oferta es "Cerrada"
    let finalEmpresaID = null;
    if (tipo_oferta === "Cerrada") {
      if (!empresa_ID || isNaN(Number(empresa_ID))) {
        return res.status(400).json({
          message: "Debe proporcionar un ID de empresa válido para una oferta cerrada.",
        });
      }

      const empresa = await Empresa.findByPk(empresa_ID);
      if (!empresa) {
        return res.status(404).json({
          message: `No se encontró una empresa con el ID ${empresa_ID}.`,
        });
      }

      finalEmpresaID = empresa_ID;
    }

    // 🧩 Preparar datos para actualización
    const datosActualizacion = {
      nombre_curso,
      descripcion,
      tipo_oferta,
      ficha,
      dias_formacion,
      lugar_formacion,
      estado,
      empresa_ID: tipo_oferta === "Cerrada" ? finalEmpresaID : null, // ✅ Actualizar o limpiar
    };

    if (fecha_inicio && fecha_fin) {
      datosActualizacion.fecha_inicio = fecha_inicio;
      datosActualizacion.fecha_fin = fecha_fin;
    }

    if (hora_inicio && hora_fin) {
      datosActualizacion.hora_inicio =
        hora_inicio.includes(":") && hora_inicio.split(":").length === 2
          ? hora_inicio + ":00"
          : hora_inicio;
      datosActualizacion.hora_fin =
        hora_fin.includes(":") && hora_fin.split(":").length === 2
          ? hora_fin + ":00"
          : hora_fin;
    }

    if (image) {
      datosActualizacion.imagen = image;
    }

    if (slots_formacion) {
      datosActualizacion.slots_formacion = Array.isArray(slots_formacion)
        ? JSON.stringify(slots_formacion)
        : slots_formacion;
    }

    // ✅ Actualizar curso en la base de datos
    await curso.update(datosActualizacion);

    // 📨 Notificar por email
    const usuarios = await User.findAll({
      where: {
        verificacion_email: true,
        accountType: { [Op.or]: ["Empresa", "Aprendiz"] },
      },
      attributes: ["email"],
    });

    const emails = usuarios.map((user) => user.email);
    if (emails.length > 0) {
      await sendCursoUpdatedNotification(emails, curso);
    }

    res.status(200).json({
      message: `Curso actualizado con éxito. Notificaciones enviadas a ${emails.length} usuarios.`,
      curso,
      validaciones_aplicadas: {
        fechas: !!(fecha_inicio && fecha_fin),
        horas: !!(hora_inicio && hora_fin),
        empresa: tipo_oferta === "Cerrada",
      },
    });
  } catch (error) {
    console.error("Error al actualizar el curso:", error);
    res.status(500).json({ message: "Error al actualizar el curso." });
  }
};

// Obtener todos los cursos
const getAllCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll(); // Obtener todos los cursos
    res.status(200).json(cursos);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ message: "Error al obtener los cursos." });
  }
};

const getCursoByNameOrFicha = async (req, res) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res.status(400).json({ message: "El campo 'input' es obligatorio." });
    }

    const curso = await Curso.findAll({
      where: {
        [Op.or]: [
          {
            nombre_curso: {
              [Op.like]: `%${input}%`
            }
          },
          {
            ficha: {
              [Op.like]: `%${input}%`
            }
          }
        ]
      }
    });

    if (!curso || curso.length === 0) {
      return res.status(404).json({ message: "Curso no encontrado" });
    }

    res.status(200).json(curso);

  } catch (error) {
    console.error("Error al obtener curso: ", error);
    res.status(500).json({ message: "Error al obtener el curso." });
  }
};

// Nuevo controlador para transformacion
const uploadImagesBase64 = async (req, res) => {
  try {
    const file = req.file;
    if (!file)
      return res.status(400).json({ message: "No se recibio ningun archivo" });

    const base64Data = file.buffer.toString("base64");
    const uniqueName = `${file.fieldname}-${Date.now()}.txt`;
    const savePath = path.join(__dirname, "../base64storage", uniqueName);

    if (!fs.existsSync(path.dirname(savePath))) {
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }

    fs.writeFileSync(savePath, base64Data);

    return res.status(200).json({
      message: "Imagen convertida y guardada.",
      filename: uniqueName,
      path: savePath,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al guardar la imagen." });
  }
};

const getCursoParticipants = async (req, res) => {
  try {
    const { courseId } = req.params;

    const participantes = await dbInstance.InscripcionCurso.findAll({
      where: {
        curso_ID: courseId,
        estado_inscripcion: 'activo'
      },
      include: [{
        model: dbInstance.Usuario,
        as: 'aprendiz',
        attributes: ['ID', 'nombres', 'apellidos', 'email', 'documento', 'foto_perfil']
      }]
    });

    res.status(200).json({
      success: true,
      participants: participantes
    });
  } catch (error) {
    console.error('Error al obtener los participantes del curso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los participantes del curso'
    });
  }
};

const getCursoById = async (req, res) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findByPk(id, {
      include: [
        {
          model: Empresa,
          as: 'Empresa',
        },
        {
          model: Usuario,
          attributes: ['nombres', 'apellidos'], // solo los campos que necesitas
          as: 'Instructor', // Este alias debe coincidir con el definido por Sequelize si lo usaste
          foreignKey: 'instructor_ID'
        }
      ]
    });

    if (!curso) {
      return res.status(404).json({ message: "Curso no encontrado." });
    }

    res.status(200).json(curso);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res.status(500).json({ message: "Error al obtener el curso." });
  }
};


// Obtener todos los cursos relacionados a una empresa por su ID
const getCursosByEmpresaId = async (req, res) => {
  try {
    const { empresaId } = req.params;

    if (!empresaId) {
      return res.status(400).json({ message: "El ID de la empresa es obligatorio." });
    }

    // Verificar si la empresa existe
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) {
      return res.status(404).json({ message: `No se encontró una empresa con el ID ${empresaId}.` });
    }

    const cursos = await Curso.findAll({
      where: { empresa_ID: empresaId },
      include: [
        {
          model: Empresa,
          as: 'Empresa'
        }
      ]
    });

    res.status(200).json({ success: true, cursos });
  } catch (error) {
    console.error("Error al obtener los cursos de la empresa:", error);
    res.status(500).json({ message: "Error al obtener los cursos de la empresa." });
  }
};

const enviarInvitacionCurso = async (req, res) => {
  try {
    // Validar tipo de cuenta
    const { accountType, id } = req.user;
    if (accountType !== "Administrador" && accountType !== "Gestor") {
      return res.status(403).json({ message: "No tienes permisos para enviar invitaciones." });
    }

    const { instructor_ID, curso_ID } = req.body;

    // Validación básica
    if (!instructor_ID || !curso_ID) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Validar que no exista una invitación pendiente para el mismo instructor y curso
    const invitacionExistente = await InvitacionCurso.findOne({
      where: {
        instructor_ID,
        curso_ID,
        estado: 'pendiente'
      }
    });

    if (invitacionExistente) {
      return res.status(409).json({ message: 'Ya existe una invitación pendiente para este instructor y curso.' });
    }

    // Crear la invitación, guardando el usuario_ID del remitente
    const nuevaInvitacion = await InvitacionCurso.create({
      instructor_ID,
      usuario_ID: id, // ID del usuario que envía la invitación (admin o gestor)
      curso_ID,
      estado: 'pendiente',
      fecha_envio: new Date()
    });

    res.status(201).json({
      message: 'Invitación enviada correctamente.',
      invitacion: nuevaInvitacion
    });
  } catch (error) {
    console.error('Error al enviar la invitación:', error);
    res.status(500).json({ message: 'Error al enviar la invitación.' });
  }
};

const cambiarEstadoInvitacion = async (req, res) => {
  try {
    const { invitacionId } = req.params;
    const { nuevoEstado } = req.body; // 'aceptada' o 'rechazada'

    // Validar estado permitido
    if (!['aceptada', 'rechazada'].includes(nuevoEstado)) {
      return res.status(400).json({ message: "El estado debe ser 'aceptada' o 'rechazada'." });
    }

    // Buscar la invitación
    const invitacion = await InvitacionCurso.findByPk(invitacionId);
    if (!invitacion) {
      return res.status(404).json({ message: "Invitación no encontrada." });
    }

    // Si ya está en ese estado, no hacer nada
    if (invitacion.estado === nuevoEstado) {
      return res.status(200).json({ message: `La invitación ya está en estado '${nuevoEstado}'.` });
    }

    // Cambiar el estado de la invitación seleccionada
    invitacion.estado = nuevoEstado;
    invitacion.fecha_estado = new Date();
    await invitacion.save();

    // Si se acepta, cancelar las demás invitaciones pendientes para ese curso
    if (nuevoEstado === 'aceptada') {
      await InvitacionCurso.update(
        { estado: 'cancelada', fecha_estado: new Date() },
        {
          where: {
            curso_ID: invitacion.curso_ID,
            id: { [Op.ne]: invitacion.id },
            estado: 'pendiente'
          }
        }
      );
    }

    res.status(200).json({ message: `Invitación actualizada a estado '${nuevoEstado}'.` });
  } catch (error) {
    console.error('Error al cambiar el estado de la invitación:', error);
    res.status(500).json({ message: 'Error al cambiar el estado de la invitación.' });
  }
};

module.exports = {
  setDb,
  createCurso,
  updateCurso,
  getAllCursos,
  getCursoByNameOrFicha,
  asignarInstructorAlCurso,
  obtenerCursosAsignadosAInstructor,
  uploadImagesBase64,
  getCursoParticipants,
  getCursoById,
  getCursosByEmpresaId,
  enviarInvitacionCurso,
  cambiarEstadoInvitacion
};