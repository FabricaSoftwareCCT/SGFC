const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { sendRequestCourseEmail, sendConcertacionActaEmail, sendTrainingPlaceActaEmail, sendRequestCourseEmailAp } = require('../services/emailService');
const actasController = require('../controllers/actasController');
const { send } = require("process");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.get('/actas', actasController.getAllActas);
router.post('/solicitud-curso', upload.single('pdf'), sendRequestCourseEmail);
router.post('/solicitud-cursoAp', upload.single('pdf'), sendRequestCourseEmailAp);
router.post('/:id/upload-radicado', upload.single('pdf'), actasController.uploadPdfRadicado);
router.put('/:id/estado', actasController.updateEstadoActa);
router.post('/concertacion-acta', upload.single('pdf'), sendConcertacionActaEmail);
router.post('/lugar-formacion-acta', upload.single('pdf'), sendTrainingPlaceActaEmail);

router.use(authMiddleware);

router.post('/rechazar-solicitud-curso/:id', actasController.rejectCourseRequest)
router.post('/aceptar-solicitud-curso/:id', actasController.acceptCourseRequest)

module.exports = router;