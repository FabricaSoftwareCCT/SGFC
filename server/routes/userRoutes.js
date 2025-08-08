const express = require("express");
const { createEmpleado, getEmpleadosByEmpresaId, subirDocumentoIdentidad, getEmpresaById, refreshAccessToken, getAprendicesByEmpresa, registerUser, verifyEmail, loginUser,requestPasswordReset,resetPassword, getAllUsers, getUserProfile, getAprendices, getEmpresas, getInstructores, getGestores, updateUserProfile,createInstructor, createGestor,logoutUser, createMasiveUsers, getEmpresaByNIT } = require("../controllers/userController");
const { googleSignIn, googleSignUp } = require("../controllers/authGoogleController"); // Importar controlador de autenticación de Google
const router = express.Router();
const upload = require("../config/multer"); // Importar configuración de multer

router.post("/createUser", registerUser); // Ruta para registrar usuario
router.get("/verificarCorreo", verifyEmail); // Ruta para verificar correo
router.post("/login", loginUser); // Ruta para iniciar sesión
router.post("/auth/googleSignIn", googleSignIn); // Ruta para iniciar sesión con Google
router.post("/auth/googleSignUp", googleSignUp); // Ruta para registrar usuario con Google
router.post("/requestPasswordReset", requestPasswordReset); // Solicitar recuperación de contraseña
router.post("/resetPassword", resetPassword); // Restablecer contraseña
router.get("/users",getAllUsers); // Obtener todos los usuarios
router.get('/profile/:id', getUserProfile); // Obtener perfil de usuario por ID
router.get('/aprendices', getAprendices); // Obtener todos los aprendices
router.get('/empresas', getEmpresas); // Obtener todas las empresas
router.get('/instructores', getInstructores); // Obtener todos los instructores
router.get('/gestores', getGestores); // Obtener todos los gestores
router.put(
  '/perfil/actualizar/:id',
  upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'img_empresa', maxCount: 1 }
  ]),
  updateUserProfile
);router.post('/crearInstructor', upload.single('foto_perfil'), createInstructor);
router.post('/crearGestor', upload.single('foto_perfil'), createGestor);
router.post("/logout", logoutUser);
router.get("/empresa/empleados/:id", getAprendicesByEmpresa); // Obtener aprendices por ID de empresa
router.post('/createMasiveUsers', upload.single('archivo_xlsx'), createMasiveUsers)
router.get("/empresa/:NIT", getEmpresaByNIT); // Obtener empresa por ID
router.post("/refresh", refreshAccessToken);
router.get("/empresa/:empresaId/empleados", getEmpleadosByEmpresaId); // Obtener empleados (aprendices) por empresa_ID
router.post('/empresa/:empresaId/empleados', upload.single('foto_perfil'), createEmpleado); // Crear empleado (aprendiz) asociado a una empresa
router.get('/empresa/id/:id', getEmpresaById);
router.post('/:id/documento', upload.single('pdf'), subirDocumentoIdentidad);


router.get("/", (req, res) => {
    res.send("🚀 API funcionando correctamente");
  });
  

module.exports = router;  