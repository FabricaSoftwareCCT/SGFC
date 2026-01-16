const { DataTypes, Model } = require('sequelize');

class InvitacionCurso extends Model {
    static init(sequelize) {
        return super.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                fecha_envio: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                estado: {
                    type: DataTypes.ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada'),
                    allowNull: false,
                    defaultValue: 'pendiente',
                },
                fecha_estado: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: 'InvitacionCurso',
                tableName: 'invitaciones_curso',
                timestamps: false,
            }
        );
    }

    static associate(models) {
        this.belongsTo(models.Usuario, { foreignKey: 'instructor_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
        this.belongsTo(models.Usuario, { foreignKey: 'usuario_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
        this.belongsTo(models.Curso, { foreignKey: 'curso_ID', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });
    }
}

module.exports = InvitacionCurso;