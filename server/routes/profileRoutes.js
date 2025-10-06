const express = require('express');
const router = express.Router();
const { 
  // ... tus otros imports existentes ...
  checkProfileComplete  // Agregar este import
} = require("../controllers/userController");

// ... tus rutas existentes ...

// AGREGAR ESTA RUTA NUEVA - debe ir antes de la ruta general "/"
router.get("/check-profile", checkProfileComplete); // ← Agregar esta línea

router.get("/", (req, res) => {
    res.send("🚀 API funcionando correctamente");
});
module.exports = router;