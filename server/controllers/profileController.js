const { User } = require('../models');
const jwt = require('jsonwebtoken');

const checkProfileComplete = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Solo verificar para Aprendices
    const perfilIncompleto = user.accountType === "Aprendiz" && !user.perfil_completo;

    res.json({ 
      perfilIncompleto,
      userId: user.id,
      accountType: user.accountType
    });
  } catch (error) {
    console.error("Error verificando perfil:", error);
    res.status(500).json({ message: "Error verificando perfil" });
  }
};

module.exports = {
  checkProfileComplete
};