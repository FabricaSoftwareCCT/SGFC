const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const { ActividadController } = require("../controllers/actividadController");

const router = express.Router();

router.post(
	"/cursos/:cursoId",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	ActividadController.crearActividad
);

router.get("/cursos/:cursoId", authMiddleware, ActividadController.listarActividades);
router.get("/:actividadId", authMiddleware, ActividadController.obtenerActividad);

router.put(
	"/:actividadId",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	ActividadController.actualizarActividad
);

router.delete(
	"/:actividadId",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	ActividadController.eliminarActividad
);

router.post(
	"/:actividadId/material/:materialId",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	ActividadController.asociarMaterial
);

router.delete(
	"/:actividadId/material/:materialId",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	ActividadController.desasociarMaterial
);

router.post(
	"/:actividadId/entregas",
	authMiddleware,
	upload.single("archivo_entrega"),
	ActividadController.registrarEntrega
);

router.patch(
	"/entregas/:entregaId/revision",
	authMiddleware,
	authorizeRoles(["Administrador", "Gestor", "Instructor"]),
	upload.single("archivo_retroalimentacion"),
	ActividadController.revisarEntrega
);

module.exports = router;

