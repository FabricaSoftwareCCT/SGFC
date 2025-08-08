const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { sendRequestCourseEmail } = require('../services/emailService');
const actasController = require('../controllers/actasController');

router.get('/actas', actasController.getAllActas);
router.post('/solicitud-curso', upload.single('pdf'), sendRequestCourseEmail);
router.post('/:id/upload-radicado', upload.single('pdf'), actasController.uploadPdfRadicado);
router.put('/:id/estado', actasController.updateEstadoActa);

module.exports = router;