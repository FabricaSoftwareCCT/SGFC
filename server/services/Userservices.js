const {UserRepository} = require("../Repository/UserRepository")

class UserServices {
    static GetUser = async (token) => {
        try {
            const IdUser = token.id;
            const result = await UserRepository.GetUserById(IdUser)

            if(token.remember == false){
                return null;
            }

            const payload = {
                id: result.ID,
                email: result.email,
                accountType: result.accountType
            }

            if(result.accountType === "Empresa"){
                payload.empresa_ID = result.empresa_ID;
            }



            return payload;

        }catch(err){
            console.log(err)
            throw {status: 500, msg: "Error en el servidor"}
        }
    }
}

module.exports = {UserServices}