const { DataTypes, Model } = require('sequelize')

class CursoTieneMaterialDeApoyo extends Model {
	static init(sequelize) {
		super.init(
			{},
			{
				sequelize,
				tableName: "curso_tiene_material_de_apoyo",
				timestamps: false
			}
		)
	}
	
	static associate(models) {
		this.belongsTo(models.MaterialDeApoyo,{
			foreignKey: "material_apoyo_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
		})
		this.belongsTo(models.Curso, {
			foreignKey: "curso_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION"
		})
	}
}

module.exports = CursoTieneMaterialDeApoyo