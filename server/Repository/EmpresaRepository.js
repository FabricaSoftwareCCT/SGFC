const Empresa = require("../models/empresa")
const User = require("../models/User")


class EmpresaRepository {
    static searchEmpresaByNIT = async (NIT) => {
        try{
            return Empresa.findOne({where: {NIT}})
        }catch (Err) {
            throw new Error ({status: 500, message: "Error en el servidor"});
        }
    }

    static CreateEmpresa = async (email ,data) =>{
        try{
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            const empresa = await Empresa.findOne({
                where: { ID: user.empresa_ID }
            });

            if (!empresa) {
                return { error: "Empresa no encontrada para este usuario" };
            }

    
            await empresa.update({
                NIT: data.NIT,
                img_empresa: data.image,
                nombre_empresa: data.nombre_empresa.trim(),
                direccion: data.direccion.trim(),
                estado: data.estado,
                email_empresa: data.email_empresa,
                categoria: data.categoria,
                telefono: data.telefono,
                ciudad_ID: data.ciudad_ID,
                descripcion: data.descripcion.trim(),
                sitio_web: data.sitio_web,
            });

            return empresa
        
        }catch(Err){
            console.log("Error al agregar la empresa", Err)
            throw new Error({status: 500, message: "Error en el servidor"});
        }
    }

    static searchCompanyByEmail = async (email) => {
        try{
            return Empresa.findOne({where: {email_empresa: email}})
        }catch(err){
            console.log(err)
            throw new Error ({status: 500, message: "Error en serviodr"})
        }
    }

    static searchCompanyByPhone = async (phone) => {
        try{
            return Empresa.findOne({where: { telefono: phone}})
        }catch(err){
            console.log(err)
            throw new Error ({status: 500, message: "Error en serviodr"})
        }
    }

    static searchEmployeeByCompanyID = async (companyName) => {
        try{
            const empresaConEmpleados = await Empresa.findOne({
                where: {nombre_empresa: companyName },
                attributes: ['nombre_empresa'],
                include: [{
                    model: User,
                    as: 'Usuarios', 
                    attributes: [
                    'nombres',
                    'apellidos',
                    'estado',
                    'documento',
                    'tipoDocumento',
                    'celular',
                    'email',],
                    where: {
                        accountType: 'Aprendiz'
                    },
                required: true }]
            });

            return empresaConEmpleados;
            
        }catch(err){
            console.log(err)
            throw new Error ({status: 500, message: "Error en serviodr"})
        }
    }
}

module.exports = {EmpresaRepository}