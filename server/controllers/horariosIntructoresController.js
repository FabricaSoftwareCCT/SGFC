const Horarios_instructor = require('../models/Horarios_instructor')

const registrarHorarios_instructor =  async(req, res) => {
    try {
        const {instructor_ID, curso_ID, horario, nota} = req.body
    
        if (!instructor_ID) {
            return res.status(404).json({
                message : "No se pasaron los datos del instructor"
            })
        }
        if (Object.keys(horario).length < 0) {
            return res.status(404).json({
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
                    curso_ID : curso_ID || null,
                    nota : nota
                })
                return insertarH
            })
        )
        
        return res.status(200).json({
            message : "Se inserto su horario bien"
        })

    } catch (error) {
        console.error("No se puedo registrar su horario", error)
        return res.status(500).json({
            message : "No se puedo registrar su horario"
        })
    }
}

module.exports = {registrarHorarios_instructor};