const { DataTypes, Model } = require("sequelize");

class ActividadCurso extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
				},
				curso_ID: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				titulo: {
					type: DataTypes.STRING(160),
					allowNull: false,
				},
				descripcion: {
					type: DataTypes.TEXT("long"),
					allowNull: true,
				},
				fecha_publicacion: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW,
				},
				fecha_limite: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				porcentaje_aporte: {
					type: DataTypes.DECIMAL(5, 2),
					allowNull: true,
				},
				estado: {
					type: DataTypes.ENUM("activa", "cerrada"),
					defaultValue: "activa",
				},
			creado_por: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			actualizado_por: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
				fecha_cierre: {
					type: DataTypes.DATE,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: "actividad_curso",
				timestamps: true,
				createdAt: "created_at",
				updatedAt: "updated_at",
			}
		);
	}

	static associate(models) {
		this.belongsTo(models.Curso, {
			foreignKey: "curso_ID",
			as: "curso",
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		});
		this.belongsTo(models.Usuario, {
			foreignKey: "creado_por",
			as: "creador",
			onDelete: "SET NULL",
			onUpdate: "CASCADE",
		});
		this.belongsTo(models.Usuario, {
			foreignKey: "actualizado_por",
			as: "actualizador",
			onDelete: "SET NULL",
			onUpdate: "CASCADE",
		});
		this.hasMany(models.ActividadEntrega, {
			foreignKey: "actividad_ID",
			as: "entregas",
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		});
		this.belongsToMany(models.MaterialDeApoyo, {
			through: models.ActividadTieneMaterial,
			foreignKey: "actividad_ID",
			otherKey: "material_apoyo_ID",
			as: "materiales",
		});
	}
}

module.exports = ActividadCurso;

