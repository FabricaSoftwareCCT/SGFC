const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	try {
		const token = req.cookies.accessToken;
		if (!token) {
			return res.status(401).json({ message: "Token no proporcionado" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret"); // Verificar el token
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Token inválido o expirado" });
	}
};

// Middleware para autorizar por roles
// Uso: authorizeRoles(['Administrador', 'Gestor'])
const authorizeRoles = (allowedRoles = []) => {
	return (req, res, next) => {
		try {
			const userRole = req.user?.accountType || req.user?.data?.accountType; // compatibilidad
			if (!userRole) {
				return res.status(403).json({ message: "Rol no disponible en el token" });
			}
			if (!allowedRoles.includes(userRole)) {
				return res.status(403).json({ message: "No tienes permisos para esta operación" });
			}
			next();
		} catch (error) {
			return res.status(403).json({ message: "Acceso denegado" });
		}
	};
};

module.exports = { authMiddleware, authorizeRoles };