const { DataTypes, Model } = require('sequelize');

class Notificacion extends Model {
    static init(sequelize) {
        return super.init(
            {
                ID: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                tipo: {
                    type: DataTypes.ENUM(
                        'inasistencia',
                        'recordatorio',
                        'actualizacion_curso',
                        'solicitud_curso',
                        'invitacion_cursoInstructor',
                        'perfil_actualizado',
                        'otro'
                    ),
                    allowNull: false
                },
                titulo: {
                    type: DataTypes.STRING(200),
                    allowNull: false
                },
                mensaje: {
                    type: DataTypes.TEXT,
                    allowNull: false
                },
                fecha_envio: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                },
                estado: {
                    type: DataTypes.ENUM('enviada', 'fallida', 'pendiente', 'leida', 'sin_leer'),
                    defaultValue: 'sin_leer'
                },
                remitente_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'usuarios', // Relaciona con la tabla usuarios
                        key: 'ID'
                    }
                },
                destinatario_ID: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'usuarios', // Relaciona con la tabla usuarios
                        key: 'ID'
                    }
                },
                archivo: { // Ruta o nombre del archivo PDF adjunto
                    type: DataTypes.STRING,
                    allowNull: true
                },
                curso_ID: { // Opcional, si quieres asociar con un curso
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'curso',
                        key: 'ID'
                    }
                }
            },
            {
                sequelize,
                modelName: 'Notificacion',
                tableName: 'notificaciones',
                timestamps: false
            }
        );
    }

    static associate(models) {
        // Relación con el usuario remitente
        this.belongsTo(models.Usuario, {
            foreignKey: 'remitente_ID',
            as: 'remitente'
        });

        // Relación con el usuario destinatario
        this.belongsTo(models.Usuario, {
            foreignKey: 'destinatario_ID',
            as: 'destinatario'
        });

        // Relación con el curso (opcional)
        this.belongsTo(models.Curso, {
            foreignKey: 'curso_ID',
            as: 'curso'
        });

                // Relación con el curso (opcional)
        this.belongsTo(models.InvitacionCurso, {
            foreignKey: 'invitacion_ID',
            as: 'invitacion'
        });
    }
}

module.exports = Notificacion;