const { DataTypes, Model } = require('sequelize')

class MaterialDeApoyo extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
				},
				contenido: {
					type: DataTypes.STRING,
					allowNull: false,
				},
				tipo_contenido: {
					type: DataTypes.ENUM("pdf", "link", "video"),
					allowNull: false
				},
				nombre_original: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				tamanio: {
					type: DataTypes.DOUBLE,
					defaultValue: 0
				},
				fecha_subida: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW
				},
				estado: {
					type: DataTypes.ENUM("activo", "inactivo"),
					defaultValue: "activo"
				}
			},
			{
				sequelize,
				tableName: "material_de_apoyo",
				timestamps: false
			}
		)
	}

	static associate(models) {
		this.belongsTo(models.Usuario,{
			foreignKey: "creador_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
		})
	}
}

module.exports = MaterialDeApoyo