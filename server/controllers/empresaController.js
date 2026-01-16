const Empresa = require('../models/empresa');
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

const ActualizarEmpresa = async (req, res) => {
	try {
		const id = req.params.id
		const {
			NIT,
			categoria,
			direccion,
			email_empresa,
			estado,
			img_empresa,
			nombre_empresa,
			telefono,
			ciudad_ID,
			departamento_ID,
		} = req.body

		let empresa = await Empresa.findByPk(id)

		empresa.NIT = NIT.toString()
		empresa.categoria = categoria
		empresa.direccion = direccion
		empresa.email_empresa = email_empresa
		empresa.estado = estado
		empresa.img_empresa = img_empresa
		empresa.nombre_empresa = nombre_empresa
		empresa.telefono = telefono
		empresa.ciudad_ID = ciudad_ID
		empresa.departamento_ID = departamento_ID

		if (req.files?.img_empresa?.[0]) {
			empresa.img_empresa = req.files.img_empresa[0].buffer.toString("base64");
			} else if (img_empresa !== undefined) {
			empresa.img_empresa = img_empresa;
		}

		await empresa.save()

		return res.status(200).json({ message: "Empresa actualizada con exito." });
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: err.message || "Error en el servidor"
		})
	}
}

module.exports = {
	ObtenerEmpleadosPorEmpresa,
	ActualizarEmpresa
};
