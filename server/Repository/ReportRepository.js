const User = require("../models/User");
const Curso = require("../models/curso");
const Asistencia = require("../models/Asistencia");
const { HostNotFoundError } = require("sequelize");

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
}

module.exports = { ReportRepository, setDb };