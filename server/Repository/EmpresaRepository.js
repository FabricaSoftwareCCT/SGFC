const Empresa = require("../models/empresa")



class EmpresaRepository {
    static searchEmpresaByNIT = async (NIT) => {
        try{
            return Empresa.findOne({where: {NIT}})
        }catch (Err) {
            throw new Error ({status: 500, message: "Error en el servidor"});
        }
    }

    static CreateEmpresa = async (data) =>{
        try{

            
            const empresa = await Empresa.create({
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
            })

            return empresa;
        }catch(Err){
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
}

module.exports = {EmpresaRepository}