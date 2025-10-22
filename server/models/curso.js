const { DataTypes, Model } = require("sequelize");

class Curso extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
				},
				nombre_curso: {
					type: DataTypes.STRING(100),
					allowNull: false,
				},
				descripcion: {
					type: DataTypes.STRING(600),
					allowNull: true,
				},
				tipo_oferta: {
					type: DataTypes.ENUM("abierta", "cerrada"),
					allowNull: false,
				},
				estado: {
					type: DataTypes.ENUM(
						"activo",
						"cancelado",
						"finalizado",
						"pendiente",
						"en oferta"
					),
					defaultValue: "pendiente",
				},
				ficha: {
					type: DataTypes.INTEGER,
					allowNull: false,
					unique: true,
				},
				fecha_inicio: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				fecha_fin: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				hora_inicio: {
					type: DataTypes.TIME,
					allowNull: true,
				},
				hora_fin: {
					type: DataTypes.TIME,
					allowNull: true,
				},
				dias_formacion: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				// Nuevo campo para guardar los slots seleccionados (día-hora)
				slots_formacion: {
					type: DataTypes.TEXT, // Guarda el array como JSON.stringify([...])
					allowNull: true,
				},
				lugar_formacion: {
					type: DataTypes.STRING(45),
					allowNull: true,
				},
				imagen: {
					type: DataTypes.TEXT('medium'), // Esto es MEDIUMTEXT en MySQL
					allowNull: true,
				},
				cupo_maximo: {
					type: DataTypes.INTEGER.UNSIGNED,
					defaultValue: 30
				},
				duracion_dias: {
					type: DataTypes.INTEGER.UNSIGNED,
				}
			},

			{
				sequelize,
				tableName: "curso",
				timestamps: false,
			}
		);
	}

	static associate(models) {
		this.belongsTo(models.Empresa, { foreignKey: 'empresa_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
		this.belongsTo(models.Sena, { foreignKey: 'sena_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
		this.belongsTo(models.Usuario, { foreignKey: 'instructor_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION', as: 'Instructor' });
		this.hasMany(models.Usuario, { foreignKey: 'ID', as: 'aprendices' });

	}
}

module.exports = Curso;