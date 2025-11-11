const Horarios_instructor = require('../models/Horarios_instructor')
const Usuario = require('../models/User')
const Curso = require('../models/curso')

const registrarHorarios_instructor =  async(req, res) => {
    try {
        const {instructor_ID, curso_ID, horario} = req.body
    
        if (!instructor_ID) {
            return res.status(400).json({
                message : "No se pasaron los datos del instructor"
            })
        }
        if (Object.keys(horario).length < 0) {
            return res.status(400).json({
                message : "No se enviaron bien los horarios"
            })
        }
        
        const insertarHorario = await Promise.all(
            horario.map(async (h) =>{
                const insertarH = await Horarios_instructor.create({
                    dia : h.dia,
                    hora_Inicio : h.hora_Inicio,
                    hora_Fin : h.hora_Fin,
                    instructor_ID : instructor_ID,
                    curso_ID : curso_ID || null
                })
                return insertarH
            })
        )
        
        return res.status(200).json({
            message : "Se inserto su horario de manera correcta"
        })

    } catch (error) {
        console.error("No se puedo registrar su horario", error)
        return res.status(500).json({
            message : "No se puedo registrar su horario"
        })
    }
}

const getAllHorariosInstructores = async (req, res) => {
    try {
        const {instructor_ID} = req.params
        if (!instructor_ID) {
            return res.status(400).json({
                message : "No se resivio el id del instructor"
            })
        }
        const instructor = await Usuario.findByPk(instructor_ID)
        if (!instructor) {
            return res.status(404).json({
                message : "El instructor no se encuentra registrado"
            })
        }

        const horarioInstrcutor = await Horarios_instructor.findAll({
            where : {
                instructor_ID : instructor_ID
            }
        })
        if (!horarioInstrcutor) {
            return res.status(404).json({
                message : "No se encontraron horarios asociados, por favor registrarlos"
            })
        }

        return res.status(200).json({
            message : "Se encontraron los horarios",
            data : horarioInstrcutor
        })

    } catch (error) {
        console.error("No se puedo traer los horarios del instructor")
        return res.status(500).json({
            message: "No se puedo traer los horarios del instrcutor"
        })
    }
}

const updateHorariosInstructores = async (req, res) =>{
    try {
        const {instructor_ID, horario} = req.body

        if (!instructor_ID) {
            return res.status(400).json({
                message : "No se resivio el instructor"
            })
        }
        const instructor = await Horarios_instructor.findAll({
            where : {
                instructor_ID : instructor_ID
            }
        })

        if (instructor.length < 0) {
            return res.status(404).json({
                message : "No tiene un horario previamente registrado, insertarlo por favor"
            })
        }

        if (Object.keys(horario).length < 0) {
            return res.status(404).json({
                message : "No se enviaron los datos a actualizar"
            })
        }
        
        const verificarCurso = await Promise.all(
            instructor.map( async (i) =>{
                const curso = i.dataValues.curso_ID
                if (curso) {
                    const result = await Curso.findByPk(curso,{
                        attributes : ['nombre_curso']
                    })
                    return result.dataValues.nombre_curso
                }
            })
        )
        const filtrar = verificarCurso.flat().filter(Boolean)

        if(filtrar.length > 0) {
            return res.status(409).json({
                message : "No puede modificar su horario ya que tiene cursos asignados, solicite reasignar los cursos antes de modificar",
                data : filtrar
            })
        }

        const deleteH = await Horarios_instructor.sequelize.transaction();

        await Horarios_instructor.destroy({
            where : {instructor_ID},
            transaction : deleteH
        })

        const nuevosHorarios = horario.map((h) =>{
            return {
                instructor_ID,
                dia : h.dia,
                hora_Inicio : h.hora_Inicio,
                hora_Fin : h.hora_Fin
            }
        })

        await Horarios_instructor.bulkCreate(nuevosHorarios, {transaction: deleteH});

        deleteH.commit()

        return res.status(200).json({
            message : "Horarios del instructor actualizados correctamente"
        })

    } catch (error) {
        console.error("No se puedo actualizar su horario")
        return res.status(500).json({
            message : "No se puedo actualizar su horario"
        })
    }
}

const deleteHorariosInstructor = async (req, res) => {
    try {
        const {instructor_ID} = req.params

        if (!instructor_ID) {
            return res.status(400).json({
                message : "No se resivio el instructor"
            })
        }
        const deleteHorarios = await Horarios_instructor.destroy({
            where : {instructor_ID}
        });
        
        if (deleteHorarios === 0) {
            return res.status(404).json({
                message : "No se encontraron horarios para este instructor"
            })
        }

        return res.status(200).json({
            message : "Horarios eliminados correctamente"
        })
        
    } catch (error) {
        console.error("No se puedo eliminar sus horarios")
    }
}
module.exports = {registrarHorarios_instructor, getAllHorariosInstructores, updateHorariosInstructores, deleteHorariosInstructor};