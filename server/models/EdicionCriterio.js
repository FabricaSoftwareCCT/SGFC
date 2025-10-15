const { DataTypes, Model } =  require("sequelize");

class EdicionCriterio extends Model {
	static init (sequelize) {
		super.init(
			{
				edicion: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				descripcion: {
					type: DataTypes.STRING(48),
					allowNull: false
				}
			},
			{
				sequelize,
				tableName: "edicion_criterio",
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

module.exports = EdicionCriterio