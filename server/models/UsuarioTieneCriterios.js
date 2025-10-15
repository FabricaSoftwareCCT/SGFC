const { DataTypes, Model } =  require("sequelize");

class UsuarioTieneCriterios extends Model {
	static init (sequelize) {
		super.init(
			{
				value: {
					type: DataTypes.DOUBLE,
					defaultValue: 0,
					allowNull: false
				}
			},
			{
				sequelize,
				tableName: "usuario_tiene_criterios",
				timestamps: false
			}
		)
	}

	static associate(models) {
		this.belongsTo(models.Usuario, {
			foreignKey: "usuario_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
		})
		this.belongsTo(models.Criterio, {
			foreignKey: "criterio_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION"
		})
	}
}

module.exports = UsuarioTieneCriterios