const { DataTypes, Model } = require("sequelize");

class ActividadEntrega extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
				},
				actividad_ID: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				aprendiz_ID: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				fecha_envio: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
				},
				comentario: {
					type: DataTypes.TEXT("long"),
					allowNull: true,
				},
				nombre_archivo: {
					type: DataTypes.TEXT,
					allowNull: true,
				},
				archivo_ruta: {
					type: DataTypes.STRING(255),
					allowNull: true,
				},
				peso_archivo: {
					type: DataTypes.DOUBLE,
					allowNull: true,
				},
				estado_revision: {
					type: DataTypes.ENUM("pendiente", "aprobada", "rechazada"),
					defaultValue: "pendiente",
				},
				retroalimentacion: {
					type: DataTypes.TEXT("long"),
					allowNull: true,
				},
				retro_archivo_ruta: {
					type: DataTypes.STRING(255),
					allowNull: true,
				},
				retro_fecha: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				retro_by: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: "actividad_entrega",
				timestamps: true,
				createdAt: "created_at",
				updatedAt: "updated_at",
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
		this.belongsTo(models.Usuario, {
			foreignKey: "aprendiz_ID",
			as: "aprendiz",
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		});
		this.belongsTo(models.Usuario, {
			foreignKey: "retro_by",
			as: "revisor",
			onDelete: "SET NULL",
			onUpdate: "CASCADE",
		});
	}
}

module.exports = ActividadEntrega;

