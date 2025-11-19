const { DataTypes, Model } = require("sequelize");

class ActividadTieneMaterial extends Model {
	static init(sequelize) {
		super.init(
			{
				actividad_ID: {
					type: DataTypes.INTEGER,
					primaryKey: true,
				},
				material_apoyo_ID: {
					type: DataTypes.INTEGER,
					primaryKey: true,
				},
			},
			{
				sequelize,
				tableName: "actividad_tiene_material",
				timestamps: false,
			}
		);
	}

	static associate(models) {
		this.belongsTo(models.ActividadCurso, {
			foreignKey: "actividad_ID",
			as: "actividad",
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		});
		this.belongsTo(models.MaterialDeApoyo, {
			foreignKey: "material_apoyo_ID",
			as: "material",
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		});
	}
}

module.exports = ActividadTieneMaterial;

