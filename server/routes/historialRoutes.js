const express = require("express")
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware")
const { getHistorial } = require("../controllers/historialController")
const router = express.Router()

router.get("/admin", authMiddleware, authorizeRoles("Administrador"), getHistorial)

module.exports = router