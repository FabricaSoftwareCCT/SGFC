const {UserRepository} = require("../Repository/UserRepository")

class UserServices {
    static GetUser = async (token) => {
        try {
            const IdUser = token.id;
            const result = await UserRepository.GetUserById(IdUser)

            if(token.remember == false){
                return null;
            }

            return result;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor"}
        }
    }
}

module.exports = {UserServices}