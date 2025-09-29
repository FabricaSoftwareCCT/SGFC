const express = require('express');
const router = express.Router();
const { checkProfileComplete } = require('../controllers/profileController');

// Ruta para verificar estado del perfil
router.get('/check-profile', checkProfileComplete);

module.exports = router;