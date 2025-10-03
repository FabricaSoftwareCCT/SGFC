const User = require("../models/User");
const Curso = require("../models/curso");
const Asistencia = require("../models/Asistencia");
const { Op } = require("sequelize");
const { toASCII } = require("punycode");

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

    static GetCursosAll = async (page) => {
        try {  
            const limit = 10;
            const offset = (page - 1) * 10;

            const {count , rows } = await Curso.findAll({
                attributes : ["ID", "nombre_curso", "estado", "ficha"],
                include: [{
                    model: User, as: "Instructor",
                    attributes: ["nombres"],
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

            console.log(data)

            if(!data){
                return null;
            }

            return;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor "}
        }
    }

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
}

module.exports = { ReportRepository, setDb };