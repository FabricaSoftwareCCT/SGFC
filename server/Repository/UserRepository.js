const User = require("../models/User")

class UserRepository {
    static GetUserById = async (id) =>  {
        try {

            const result = await User.findByPk(id)

            if(!result){
                throw new Error ({status: 404, msg: "Usuaio no encontrado"});
            }

            return result;

        }catch(err){
            console.log(err)
            throw new Error({status: 500, msg: "Error en el servidor"});
        }
    }

    static getManagerById = async (email) => {
        try{
            return User.findOne({where: { email: email, accountType: "Empresa"}})
        }catch(Err){
            throw new Error ({status: 500, message: "Error en el servidor"});
        }
    }

}

module.exports = { UserRepository }