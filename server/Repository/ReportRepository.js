const User = require("../models/User");
const Curso = require("../models/curso");
const Asistencia = require("../models/Asistencia");
const { Op } = require("sequelize");

let db;

const setDb = (dbInstance) => {
  db = dbInstance;
};

class ReportRepository {
    static SearchReport = async  ( filtre) => {
        try {
            const result = await Curso.findOne({
                where: filtre,
                attributes: ["nombre_curso","descripcion","ficha", "lugar_formacion", "fecha_inicio", "fecha_fin", "estado"],
                include: [
                    {model: User, as: 'aprendices', attributes: ["nombres","apellidos","email", "estado"],
                        include: [
                            {model: Asistencia, as: 'asistencias', attributes: ["estado_asistencia","fecha","registrado_por"]}
                        ]
                    }
                ]
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
            const result = await Curso.findAll({    
                where: {
                    fecha_creacion: {
                        [Op.between]: [fecha_inicio, fecha_fin]
                    },
                },
                attributes: ["nombre_curso","descripcion","ficha", "lugar_formacion", "fecha_inicio", "fecha_fin", "estado"],
                include: [
                    {model: User, as: 'aprendices', attributes: ["nombres","apellidos", "documento","email", "estado"],
                        include: [
                            {model: Asistencia, as: 'asistencias', where: {
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


}

module.exports = { ReportRepository, setDb };