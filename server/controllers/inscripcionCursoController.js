

const InscripcionCurso = require("../models/InscripcionCurso");
const Curso = require("../models/curso");
const Usuario = require("../models/User");
const Empresa = require("../models/empresa")
const { json } = require("sequelize");
const e = require("express");

const crearOActualizarInscripcion = async (req, res) => {
  const { curso_ID, aprendiz_ID, nuevoEstado } = req.body;
  //const usuario = req.user;

  try {
    // Validación básica
    if (!curso_ID || !aprendiz_ID || !nuevoEstado) {
      return res.status(400).json({
        mensaje: 'Los campos curso_ID, aprendiz_ID y nuevoEstado son obligatorios',
      });
    }

    // Validar rol del usuario autenticado
    // if (!usuario || usuario.accountType !== 'Empresa'||'Administrador') {
    //   return res.status(403).json({
    //     mensaje: 'No tienes permisos para realizar esta acción',
    //   });
    // }

    // Validar existencia del aprendiz
    const aprendiz = await Usuario.findByPk(aprendiz_ID);
    if (!aprendiz || aprendiz.accountType !== 'Aprendiz') {
      return res.status(404).json({
        mensaje: 'Aprendiz no encontrado o no válido',
      });
    }

    // Validar existencia del curso
    const curso = await Curso.findByPk(curso_ID);
    if (!curso) {
      return res.status(404).json({
        mensaje: 'Curso no encontrado',
      });
    }

    // Validar estado permitido
    const estadosValidos = ['activo', 'rechazado', 'pendiente'];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    // Buscar inscripción existente
    let inscripcion = await InscripcionCurso.findOne({
      where: { curso_ID, aprendiz_ID },
    });

    if (inscripcion) {
      inscripcion.estado_inscripcion = nuevoEstado;
      await inscripcion.save();

      return res.status(200).json({
        mensaje: 'Estado de inscripción actualizado correctamente',
        inscripcion,
      });
    }

    // Crear inscripción nueva
    inscripcion = await InscripcionCurso.create({
      curso_ID,
      aprendiz_ID,
      estado_inscripcion: nuevoEstado,
      fecha_inscripcion: new Date(),
    });

    return res.status(201).json({
      mensaje: 'Inscripción creada correctamente',
      inscripcion,
    });
  } catch (error) {
    console.error('Error al crear o actualizar inscripción:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor',
    });
  }
};

const inscripcionEmpleados = async (req, res ) => {
    try{
      const {empleados, curso_ID, gestor_ID} = req.body;
      let verificarCursos= {}

      if (Object.keys(empleados).length < 0) {
        return res.status(400).json({
          message : 'No se enviaron bien los datos de los empleados'
        })
      }

      if (!curso_ID || !gestor_ID) {
        return res.status(400).json({
          message : 'No envio el curso o el gestor'
        })
      }

      const curso = await Curso.findByPk(curso_ID, {
        attributes : ['slots_formacion']
      })
      const cursoString = curso.dataValues.slots_formacion
      const arrayCurso = JSON.parse(cursoString)
      if (!curso) {
        res.status(404).json({
          message : "No se encontro el curso"
        })
      }

      const aprendices = await Promise.all(
        empleados.map(async (e) => {
            const consult = await Usuario.findByPk(e.ID)
            return consult
        })
      )
     
      if (aprendices.length < 0) {
          return res.status(400).json({
            message : 'No se encontraron los empleados'
          })
      }

      const aprendicesInscritos = await Promise.all(
        empleados.map(async (e) =>{
          const consult = await InscripcionCurso.findAll({
            where : {aprendiz_ID: e.ID}
          })
          return consult
        })
      )
      if (aprendicesInscritos.length > 0) {
       
        const filtrar = aprendicesInscritos
        .flat()
        .filter(Boolean)
        .map(item => item.dataValues);
        
       const horiarioCursos = await Promise.all(
          filtrar.map(async (f) =>{
            const consult = await Curso.findByPk(f.curso_ID,{
              attributes : ['slots_formacion']
          })
            return{
              ID : f.aprendiz_ID,
              horarios : consult.dataValues.slots_formacion
            }
          })
       )
       const mensaje = "No se puede estar inscrito a un curso con los mismos horarios de formacion"
        verificarCursos = await Promise.all(
        horiarioCursos.map(async (h) =>{
          const horarios = JSON.parse(h.horarios)

          const verificar = horarios.some(h => arrayCurso.includes(h))
          
          return {
            ID : h.ID,
            verificar,
            mensaje
          }
        })
       )
       verificarCursos.map( (v) =>{
        if (v.verificar) {
          for(let i = 0; i < empleados.length; i++){
            if (empleados[i].ID === v.ID) {
              empleados.splice(i,1)
              i--;
            }
          }
        }
       })
      }
      if (empleados.length <= 0) {
        return res.status(409).json({
          message: "No se puede inscribir: los empleados ya están asignados a cursos con los mismos horarios de formación."
        });
      }
      const result = await Promise.all(
        empleados.map(async (e) =>{
          const inscribir = await InscripcionCurso.create({
            fecha_inscripcion : new Date(),
            aprendiz_ID : e.ID,
            curso_ID : curso_ID,
            gestor_ID: gestor_ID
          })
          return inscribir
        })
      )
      res.status(200).json({
        message : 'Se inscribieron los empleados al curso',
        noInscritos: verificarCursos
      })
    } catch (error){
      console.error('Error al inscribir los empleados', error)
      return res.status(500).json({
        message : 'Error al inscribir los empleados'
      })
    }
}

const getAllInscripciones = async (req, res) => {
  try {
    const {curso_ID} = req.params
    
    if (!curso_ID) {
        return res.status(400).json({
          message : "No se envio el id del curso"
        })
    }

    const curso = await Curso.findByPk(curso_ID)
    if (!curso) {
        return res.status(404).json({
          message : "No se encontro el curso"
        })
    }
    const inscribieron = await InscripcionCurso.findAll({
      where : {
        curso_ID : curso_ID
      },
      attributes : ['ID','aprendiz_ID', 'fecha_inscripcion', 'estado_inscripcion']
    })
    const consultar = await Promise.all(
      inscribieron.map( async (i) =>{
          const consult = await Usuario.findByPk(i.aprendiz_ID)
          const consult1 = await Empresa.findByPk(consult.dataValues.empresa_ID)
          return {
            id : i.ID,
            nombres : consult.dataValues.nombres,
            apellidos : consult.dataValues.apellidos,
            empresa : consult1.dataValues.nombre_empresa,
            celular : consult.dataValues.celular,
            email : consult.dataValues.email,
            fecha_inscripcion : i.fecha_inscripcion,
            estado : i.estado_inscripcion
          }
      })
    )
    return res.status(200).json(consultar)
  } catch (error) {
    console.error("No se pudo obtener todas las inscripciones", error)
    return res.status().json({
      message : "No se pudo obtener todas las inscripciones"
    })
  }
}

module.exports = {
  crearOActualizarInscripcion,
  inscripcionEmpleados,
  getAllInscripciones
};
