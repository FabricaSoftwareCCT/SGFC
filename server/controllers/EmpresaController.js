const { EmpresaServices } = require('../services/EmpresaServices');

const ObtenerEmpleadosPorEmpresa =  async (req, res) => {
    try{
        const { nameEmpresa } = req.params;

        if(!nameEmpresa){
            throw new Error("El nombre de la empresa es obligatorio");
        }

        const empleados = await EmpresaServices.getEmployeeByCompany(nameEmpresa);
        res.status(200).json({
            message: "Empleados obtenidos correctamente",
            data: empleados
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            message: err.message || "Error en el servidor"
        });
    }
}

module.exports = {
    ObtenerEmpleadosPorEmpresa

};