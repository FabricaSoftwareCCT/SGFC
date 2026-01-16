const { DataTypes, Model } = require('sequelize');

class Departamento extends Model {
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
          unique: true,
        },
      },
      {
        sequelize,
        tableName: 'departamento',
        timestamps: false,
      }
    );
  }

  static associate(models) {
    // No hay relaciones definidas actualmente
  }

    // Método para crear un Departamento (Quindio)
    static async createDefaultDeparment() {
      try {
        const departamento = 'Quindío';
  
        // Verificar si departamento ya existe
        const existingDepartment = await this.findOne({ where: { nombre: departamento } });
        if (existingDepartment) {
          console.log('El departamento ya existe.');
          return;
        }
  
        // Crear el departamento
        await this.create({
          nombre: departamento

        });
  
        console.log('Departamento creado con éxito.');
      } catch (error) {
        console.error('Error al crear el departamento:', error);
      }
    }
}

module.exports = Departamento;