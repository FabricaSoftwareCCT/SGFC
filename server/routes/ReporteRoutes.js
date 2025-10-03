const express = require("express");
const router = express.Router();
const { reporteMiddleware } = require("../middlewares/reporteMiddleware");
const { ReporteController } = require("../controllers/ReporteController");

router.get("/generarReporte", reporteMiddleware, ReporteController.Searchreport);  
router.get("/reporteEficiencia", ReporteController.ReporteEficiencia);
router.get("/ObtenerCursos/admin", ReporteController.GetCursosReporte )

module.exports = router;