const User = require("../models/User")

class UserRepository {
    static GetUserById = async (id) =>  {
        try {

            const result = await User.findByPk(id)

            if(!result){
                throw {status: 404, msg: "Usuaio no encontrado"};
            }

            return result;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor"}
        }
    }
}

module.exports = { UserRepository }