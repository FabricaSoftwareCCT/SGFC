const { DataTypes, Model } = require("sequelize");

class CursoTemarioTema extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true
				},
				curso_ID: {
					type: DataTypes.INTEGER,
					allowNull: false
				},
				titulo: {
					type: DataTypes.STRING(150),
					allowNull: false
				},
				descripcion: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				fecha_programada: {
					type: DataTypes.DATEONLY,
					allowNull: true
				},
				orden: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0
				},
				estado: {
					type: DataTypes.ENUM("activo", "inactivo"),
					defaultValue: "activo"
				},
				creado_por: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				actualizado_por: {
					type: DataTypes.INTEGER,
					allowNull: true
				}
			},
			{
				sequelize,
				tableName: "curso_temario_tema",
				timestamps: true
			}
		);
	}

	static associate(models) {
		this.belongsTo(models.Curso, {
			foreignKey: "curso_ID",
			as: "curso",
			onDelete: "CASCADE",
			onUpdate: "CASCADE"
		});

		this.belongsTo(models.Usuario, {
			foreignKey: "creado_por",
			as: "creador",
			onDelete: "SET NULL",
			onUpdate: "CASCADE"
		});

		this.belongsTo(models.Usuario, {
			foreignKey: "actualizado_por",
			as: "actualizador",
			onDelete: "SET NULL",
			onUpdate: "CASCADE"
		});

		this.hasMany(models.CursoTemarioRecurso, {
			foreignKey: "tema_ID",
			as: "recursos"
		});
	}
}

module.exports = CursoTemarioTema;

