const { DataTypes, Model } = require("sequelize");

class CursoTemarioRecurso extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true
				},
				tema_ID: {
					type: DataTypes.INTEGER,
					allowNull: false
				},
				tipo_recurso: {
					type: DataTypes.ENUM("asignacion", "material"),
					allowNull: false
				},
				titulo: {
					type: DataTypes.STRING(160),
					allowNull: false
				},
				descripcion: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				nombre_original: {
					type: DataTypes.STRING(255),
					allowNull: true
				},
				ruta_relativa: {
					type: DataTypes.STRING(255),
					allowNull: true
				},
				url_recurso: {
					type: DataTypes.STRING(500),
					allowNull: true
				},
				peso_bytes: {
					type: DataTypes.BIGINT.UNSIGNED,
					allowNull: true
				},
				estado: {
					type: DataTypes.ENUM("activo", "inactivo"),
					defaultValue: "activo"
				},
				creado_por: {
					type: DataTypes.INTEGER,
					allowNull: true
				}
			},
			{
				sequelize,
				tableName: "curso_temario_recurso",
				timestamps: true
			}
		);
	}

	static associate(models) {
		this.belongsTo(models.CursoTemarioTema, {
			foreignKey: "tema_ID",
			as: "tema",
			onDelete: "CASCADE",
			onUpdate: "CASCADE"
		});

		this.belongsTo(models.Usuario, {
			foreignKey: "creado_por",
			as: "creador",
			onDelete: "SET NULL",
			onUpdate: "CASCADE"
		});
	}
}

module.exports = CursoTemarioRecurso;

