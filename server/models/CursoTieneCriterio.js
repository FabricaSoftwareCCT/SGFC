const { DataTypes, Model } =  require("sequelize");

class CursoTieneCriterio extends Model {
	static init (sequelize) {
		super.init(
			{},
			{
				sequelize,
				tableName: "curso_tiene_criterio",
				timestamps: false
			}
		)
	}

	static associate(models) {
		this.belongsTo(models.Usuario, {
			foreignKey: "author_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
		})
		this.belongsTo(models.Criterio, {
			foreignKey: "criterio_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION"
		})
		this.belongsTo(models.Curso, {
			foreignKey: "curso_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION"
		})
	}
}

module.exports = CursoTieneCriterio