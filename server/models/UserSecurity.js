const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt'); // Importar bcrypt para hashear la contraseña

class UserSecurity extends Model {
    static init(sequelize){
        super.init({
            ID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            userId: {
                type:  DataTypes.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'usuarios',
                    key: 'ID'
                }
            },
            SecurityQuestion: {
                type: DataTypes.STRING,
                allowNull: false
            },
            AnswerHash: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            sequelize,
            tableName: 'user_security', 
            timestamps: false
        })
    }

    static associate(models) {
        this.belongsTo(models.Usuario, {
            foreignKey: "userId",
            as: 'Usuario'
        })
    }
}

module.exports = UserSecurity;