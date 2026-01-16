const { DataTypes, Model } = require('sequelize');

class Actas extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        fecha_acta: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        estado_acta: {
          type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
          defaultValue: 'pendiente',
        },
        fecha_respuesta: {
          type: DataTypes.DATE,
          allowNull: true,
        }, 
        pdf_acta: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pdf_radicado: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tipo_acta: { // Ruta o nombre del archivo PDF
          type: DataTypes.ENUM('Solicitud', 'Concertacion', 'Lugar_formacion', 'Matricula'),
          allowNull: false,
        },
        observacion: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'actas',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Usuario, { foreignKey: 'gestor_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
    this.belongsTo(models.Curso, { foreignKey: 'curso_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION', allowNull: true });
    this.belongsTo(models.Empresa, { foreignKey: 'empresa_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION', allowNull: true });
    this.belongsTo(models.Usuario, { foreignKey: 'instructor_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
    this.belongsTo(models.Usuario, { foreignKey: 'administrador_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
  }
}

module.exports = Actas;