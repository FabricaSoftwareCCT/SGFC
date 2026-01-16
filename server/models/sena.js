const { DataTypes, Model } = require('sequelize');
const fs = require('fs');
const path = require('path');

class Sena extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        NIT: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        img_sena: {
          type: DataTypes.TEXT('medium'),
          allowNull: true,
        },
        nombre_sede: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        direccion: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(15),
          allowNull: true,
          unique: true,
        },
        email_sena: {
          type: DataTypes.STRING(100),
          allowNull: true,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: 'sena',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Ciudad, { foreignKey: 'ciudad_ID', as: 'Ciudad', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
  }

  // Método para crear una sede SENA por defecto
  static async createDefaultSENA() {
    try {
      const senaEmail = 'senacct@gmail.com';
      const senaNombre = 'Centro de Comercio y Turismo';
      const senaNIT = '899.999.034-1';
      const senaDireccion = 'Cra. 18 #7-58, Galán';
      const senaTelefono = '67494999';

      // Leer la imagen y convertirla a base64
      const imgPath = path.join(__dirname, '../Img/sena.png');
      let img_sena_base64 = null;
      try {
        const imgBuffer = fs.readFileSync(imgPath);
        img_sena_base64 = imgBuffer.toString('base64');
      } catch (err) {
        console.error('No se pudo leer la imagen de SENA por defecto:', err);
      }

      // Verificar si el email sena existe
      const existingEmailSena = await this.findOne({ where: { email_sena: senaEmail } });
      if (existingEmailSena) {
        console.log('La sede sena ya existe.');
        return;
      }

      // Crear la sede SENA con la imagen en base64
      await this.create({
        email_sena: senaEmail,
        nombre_sede: senaNombre,
        direccion: senaDireccion,
        NIT: senaNIT,
        telefono: senaTelefono,
        img_sena: img_sena_base64, // Imagen en base64
        ciudad_ID: 1 // Asignar el ID de la ciudad correspondiente (Armenia)
      });

      console.log('sede sena creado con éxito.');
    } catch (error) {
      console.error('Error al crear la sede sena:', error);
    }
  }

}

module.exports = Sena;