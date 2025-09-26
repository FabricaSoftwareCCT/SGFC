let dbInstance = null;

function setDb(db) {
  dbInstance = db;
}

async function listDepartamentos(req, res) {
  try {
    const departamentos = await dbInstance.Departamento.findAll({ attributes: ["ID", "nombre"] });
    res.json(departamentos);
  } catch (e) {
    res.status(500).json({ message: "Error al obtener departamentos" });
  }
}

async function listCiudadesPorDepartamento(req, res) {
  try {
    const { id } = req.params;
    const ciudades = await dbInstance.Ciudad.findAll({
      where: { departamento_ID: id },
      attributes: ["ID", "nombre", "departamento_ID"],
    });
    res.json(ciudades);
  } catch (e) {
    res.status(500).json({ message: "Error al obtener ciudades" });
  }
}

async function getCiudadConDepartamento(req, res) {
  try {
    const { id } = req.params;
    const ciudad = await dbInstance.Ciudad.findByPk(id, {
      include: [{
        model: dbInstance.Departamento,
        as: 'Departamento',
        attributes: ['ID', 'nombre']
      }],
      attributes: ['ID', 'nombre', 'departamento_ID']
    });
    
    if (!ciudad) {
      return res.status(404).json({ message: "Ciudad no encontrada" });
    }
    
    res.json(ciudad);
  } catch (e) {
    res.status(500).json({ message: "Error al obtener la ciudad" });
  }
}

module.exports = { setDb, listDepartamentos, listCiudadesPorDepartamento, getCiudadConDepartamento };


