const { DataTypes, Model } = require('sequelize');

class Empresa extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true, // Agregar autoincremento
        },
        NIT: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        img_empresa: {
          type: DataTypes.TEXT('medium'), // Esto es MEDIUMTEXT en MySQL
          allowNull: true,
        },
        nombre_empresa: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        direccion: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        estado: {
          type: DataTypes.ENUM('activo', 'inactivo'),
          defaultValue: 'inactivo',
        },
        email_empresa: {
          type: DataTypes.STRING(100),
          allowNull: true,
          unique: true, 
        },
        categoria: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(15),
          allowNull: true,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: 'empresa',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Ciudad, { foreignKey: 'ciudad_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
  }
}

module.exports = Empresa;