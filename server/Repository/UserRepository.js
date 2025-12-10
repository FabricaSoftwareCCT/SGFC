const User = require("../models/User");
const UserSecurity = require("../models/UserSecurity");

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

    static SecurityAnswer = async (Question, Answer, Id) => {
    try {
        return UserSecurity.create({
            userId: Id,
            SecurityQuestion: Question,
            AnswerHash: Answer
        });
    } catch (Err) {
        console.error('Error al intentar crear la pregunta de seguridad:', Err);
        throw { status: 500, message: "Error en el servidor. Intente de nuevo más tarde." };
    }
}

    static GetUserSecurity = async (id) => {
        try{
        return User.findOne({
            attributes: [], 
            include: [{
                model: UserSecurity,
                as: 'SecurityData',
                attributes: [
                    ['SecurityQuestion', 'Pregunta'],
                    [ 'AnswerHash', 'respuesta']
                ]
            }],
            where: {
                ID: id
            }
        });
        }catch (Err){
            console.log(Err)
            throw new Error({status: 500, message: "Error en el servidor"})
        }
    }

    static updateUser = async (id, Question, Answer) => {
        try{
            return UserSecurity.update(
                {
                    SecurityQuestion: Question,
                    AnswerHash: Answer
                },
                {
                    where: {
                        userId: id
                    }
                }
            );

        }catch(Err){4
            console.log(Err)
            throw new Error ({ status: 500, message: "Error en el servidor"})
        }
    }
}

module.exports = { UserRepository }