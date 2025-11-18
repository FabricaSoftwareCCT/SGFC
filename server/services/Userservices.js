const { EmpresaRepository } = require("../Repository/EmpresaRepository");
const {UserRepository} = require("../Repository/UserRepository");
const { sendVerificationEmail } = require("./emailService");
const bcrypt = require("bcrypt");

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
            throw new Error ({status: 500, msg: "Error en el servidor"});
        }
    }

    static CreateEmpresaByAdmin = async (email, data) => {
        try{
            const existingEmpresa = await EmpresaRepository.searchEmpresaByNIT(data.NIT);
            const existingCelular = await EmpresaRepository.searchCompanyByPhone(data.telefono);
            const existingEmail = await EmpresaRepository.searchCompanyByEmail(data.email_empresa);

            if (existingEmpresa) {
                throw new Error("Ya hay una empresa registrada con este email.");
            }

            if(existingCelular){
                throw new Error("Ya hay una empresa que ocupa este telefono")
            }

            if(existingEmail){
                throw new Error("Ya hay una empresa que ocupa el correo")
            }

            if (existingEmpresa) { 
                throw new Error("Ya hay una empresa registrada con este NIT.");
            }

            const existingManager = await UserRepository.getManagerById(email)

            if(!existingManager){
                throw new Error("El manager no existe ó no se creo correctamente ")
            }
            
            const NuevaEmpresa = await EmpresaRepository.CreateEmpresa(data);
            existingManager.empresa_ID = NuevaEmpresa.ID;
            await existingManager.save();

            return NuevaEmpresa;

        }catch(Err){
            if (Err.message && Err.message !== 'Error en el servidor') { 
                console.log(Err) 
                throw Err; 
            }
            
            throw { status: 500, message: "Error en el servidor. Intente de nuevo más tarde." };
        }
    }


    static CreateSecurity = async (Question, Answer, Id) => {
        try{

            const SecurityExisting = await UserRepository.GetUserSecurity(Id);

            if(SecurityExisting && SecurityExisting.SecurityData){
                throw new Error('Usuario ya cuenta con una pregunta de seguridad registrada')
            }

            Answer = await bcrypt.hash(Answer, 10);
            const user = await UserRepository.SecurityAnswer(Question, Answer, Id)

            if(!user){
                return false;
            }

            return true;

        }catch (Error) {
            if (Error.message && Error.message !== 'Error en el servidor') { 
                console.log(Error) 
                throw Error; 
            }
            
            throw { status: 500, message: "Error en el servidor. Intente de nuevo más tarde." };
        }
    }

    static getSecutiry = async (Id) => {
        const data = await UserRepository.GetUserSecurity(Id);
        
        if(data === null){
            throw new Error("Usuario no encontrado")
        }

        if(!data.SecurityData || !data.SecurityData.dataValues.Pregunta){ 
            throw new Error("El usuario no tiene preguntas de seguridad asociadas")
        }

        return data;
    }
}

module.exports = {UserServices}