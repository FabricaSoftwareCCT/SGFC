
const {DataTypes, Model} = require('sequelize')

class Horarios_instructor extends Model {
    static init(sequelize) {
        super.init(
            {
                ID : {
                    type : DataTypes.INTEGER,
                    autoIncrement : true,
                    primaryKey : true
                },
                dia : {
                    type : DataTypes.ENUM(
                        "Lunes",
                        "Martes",
                        "Miercoles",
                        "Jueves",
                        "Viernes",
                        "Sabado"
                    ),
                    allowNull : false
                },
                hora_Inicio : {
                    type : DataTypes.TIME,
                    allowNull : false
                },
                hora_Fin : {
                    type : DataTypes.TIME,
                    allowNull : false
                }
            },

            {
                sequelize,
                tableName: "horarios_instructor",
                timestamps : false
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Usuario, {foreignKey : 'instructor_ID', onDelete: 'NO ACTION', onUpdate : 'NO ACTION'});
        this.belongsTo(models.Curso, {foreignKey: 'curso_ID', onDelete : 'NO ACTION', onUpdate: 'NO ACTION'});
    }
}

module.exports = Horarios_instructor