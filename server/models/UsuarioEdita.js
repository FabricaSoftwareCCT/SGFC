const { DataTypes, Model } = require('sequelize')

class UsuarioEdita extends Model {
	static init(sequelize) {
		super.init(
			{
				ID: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
				},
				descripcion: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				fecha: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW
				}
			},
			{
				sequelize,
				tableName: "usuario_edita",
				timestamps: false
			}
		)
	}

	static associate(models) {
		this.belongsTo(models.Usuario, {
			foreignKey: "autor_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
			allowNull: false
		})
		this.belongsTo(models.Usuario, {
			foreignKey: "usuario_ID",
			onDelete: 'NO ACTION', 
			onUpdate: 'NO ACTION',
			allowNull: true
		})
		this.belongsTo(models.Criterio, {
			foreignKey: "criterio_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION",
			allowNull: true
		})
		this.belongsTo(models.Curso, {
			foreignKey: "curso_ID",
			onDelete: "NO ACTION",
			onUpdate: "NO ACTION",
			allowNull: false
		})
	}
}

module.exports = UsuarioEdita