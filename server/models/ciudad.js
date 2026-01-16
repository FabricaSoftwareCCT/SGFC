const { DataTypes, Model } = require('sequelize');
const Departamento = require('./departamento');

class Ciudad extends Model {
  static init(sequelize) {
    super.init(
      {
        ID: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'ciudad',
        timestamps: false,
      }
    );
  }

  static associate() {
    // Relación con Departamento
    this.belongsTo(Departamento, {
      foreignKey: 'departamento_ID',
      as: 'Departamento',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }

      // Método para crear una ciudad (Armenia)
      static async createDefaultCiudad() {
        try {
          const ciudad = 'Armenia';
    
          // Verificar si departamento ya existe
          const existingCiudad = await this.findOne({ where: { nombre: ciudad } });
          if (existingCiudad) {
            console.log('La ciudad  ya existe.');
            return;
          }
    
          // Crear el departamento
          await this.create({
            nombre: ciudad,
            departamento_ID: 1 // Asignar el ID del departamento correspondiente (Quindío)
          });
    
          console.log('ciudad creado con éxito.');
        } catch (error) {
          console.error('Error al crear el ciudad:', error);
        }
      }
}

module.exports = Ciudad;