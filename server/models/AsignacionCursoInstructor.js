const { DataTypes, Model } = require('sequelize');

class AsignacionCursoInstructor extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        estado: {
          type: DataTypes.ENUM('aceptada', 'rechazada'),
          defaultValue: 'aceptada',
        },
        instructor_ID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'usuarios',
            key: 'ID'
          }
        },
        curso_ID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'curso',
            key: 'ID'
          }
        },
        fecha_asignacion: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'asignacion_curso_instructor',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'instructor_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
    this.belongsTo(models.Curso, { foreignKey: 'curso_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
  }
}

module.exports = AsignacionCursoInstructor;