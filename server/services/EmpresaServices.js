const { EmpresaRepository } = require("../Repository/EmpresaRepository");

class EmpresaServices {
    static getEmployeeByCompany = async (company) => {
        const data = await EmpresaRepository.searchEmployeeByCompanyID(company);

        if(!data){
            throw new Error("No se encontraron empleados para esta empresa");
        }
        const Empleados = data.Usuarios?.map(emp => ({
            Empresa: data.nombre_empresa,
            User: {
                nombres: emp.nombres,
                apellidos: emp.apellidos,
                estado: emp.estado,
                documento: emp.documento,
                tipoDocumento: emp.tipoDocumento,
                celular: emp.celular,
                email: emp.email
            }
            
        }))

        return Empleados;
    }

}

module.exports = {EmpresaServices}