const { DataTypes, Model } =  require("sequelize");

class Criterio extends Model {
	static init (sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true
				},
				title: {
					type: DataTypes.STRING(45),
					allowNull: false
				},
				description: {
					type: DataTypes.STRING(600),
					allowNull: false
				},
				has_value: {
					type: DataTypes.BOOLEAN,
					defaultValue: false
				},
				min: {
					type: DataTypes.INTEGER.UNSIGNED,
					defaultValue: 0,
				},
				creation: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				weight: {
					type: DataTypes.DOUBLE,
					allowNull: true
				},
				type: {
					type: DataTypes.ENUM("Asistencias", "Calificacion", "Horas", "Documentos"),
					allowNull: false
				}
			},
			{
				sequelize,
				tableName: "Criterio",
				timestamps: false
			}
		)
	}
}

module.exports = Criterio