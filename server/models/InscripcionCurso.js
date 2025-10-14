const { DataTypes, Model } = require('sequelize');

class InscripcionCurso extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        fecha_inscripcion: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        estado_inscripcion: {
          type: DataTypes.ENUM('activo', 'rechazado', 'pendiente'),
          defaultValue: 'pendiente',
        },
        estado_certificacion: {
          type: DataTypes.ENUM("pendiente", "rechazado", "aprovado"),
          defaultValue: "pendiente"
        }
      },
      {
        sequelize,
        tableName: 'inscripcion_curso',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { 
      foreignKey: 'aprendiz_ID', 
      as: 'aprendiz',
      onDelete: 'NO ACTION', 
      onUpdate: 'NO ACTION' 
    });
    this.belongsTo(models.Curso, { 
      foreignKey: 'curso_ID', 
      onDelete: 'NO ACTION', 
      onUpdate: 'NO ACTION' 
    });
    this.belongsTo(models.Usuario, { 
      foreignKey: 'gestor_ID', 
      as: 'gestor',
      onDelete: 'NO ACTION', 
      onUpdate: 'NO ACTION' 
    });
  }
}

module.exports = InscripcionCurso;