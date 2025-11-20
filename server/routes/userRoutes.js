const express = require("express");
const { createEmpleado, getEmpleadosByEmpresaId, recordLogin, subirDocumentoIdentidad, getEmpresaById, refreshAccessToken, getAprendicesByEmpresa, registerUser, verifyEmail, loginUser,requestPasswordReset,resetPassword, getAllUsers, getUserProfile, getAprendices, getEmpresas, createEmpresa, getInstructores, getGestores, updateUserProfile,createInstructor, createGestor,logoutUser, createMasiveUsers, getEmpresaByNIT, requestNewVerificationEmail, checkProfileComplete, getAllEmpleadosForAdmin, getAllEmpresasForAdmin, createEmpleadoForAdmin, changeRole, securityData, getSecurityData } = require("../controllers/userController");
const {updateSecurity} = require("../controllers/userController");
const {registrarHorarios_instructor, getAllHorariosInstructores, updateHorariosInstructores, deleteHorariosInstructor} = require('../controllers/horariosIntructoresController')
const { googleSignIn, googleSignUp } = require("../controllers/authGoogleController"); // Importar controlador de autenticación de Google
const { authMiddleware, authorizeRoles } = require("../middlewares/authMiddleware");
const router = express.Router();
const upload = require("../config/multer"); // Importar configuración de multer
const { cursosEmpresa } = require("../controllers/cursoController");
const { ObtenerEmpleadosPorEmpresa } = require("../controllers/EmpresaController");

router.post("/createUser", registerUser); // Ruta para registrar usuario
router.get("/verificarCorreo", verifyEmail); // Ruta para verificar correo
router.post("/requestNewVerificationEmail", requestNewVerificationEmail); // Ruta para reenviar correo de verificación
router.post("/login", loginUser); // Ruta para iniciar sesión
router.get("/recordsession", authMiddleware, recordLogin); // Ruta para recordar sesión)
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
router.get("/check-profile", checkProfileComplete); // ✅ NUEVA RUTA - Verificar perfil completo
router.put(
  '/perfil/actualizar/:id',
  authMiddleware, // ✅ AÑADIR EL MIDDLEWARE AQUÍ
  upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'img_empresa', maxCount: 1 }
  ]),
  updateUserProfile
);
router.post('/crearInstructor', upload.single('foto_perfil'), createInstructor);
router.post('/crearGestor', upload.single('foto_perfil'), createGestor);
router.post("/logout", logoutUser);
router.get("/empresa/empleados/:id", getAprendicesByEmpresa); // Obtener aprendices por ID de empresa
router.post('/createMasiveUsers/:empresaId', upload.single('archivo_xlsx'), createMasiveUsers) // Crear empleados de manera masiva
router.get("/empresa/:NIT", getEmpresaByNIT); // Obtener empresa por ID
router.post("/refresh", refreshAccessToken);
router.get("/empresa/:empresaId/empleados", getEmpleadosByEmpresaId); // Obtener empleados (aprendices) por empresa_ID
router.post('/empresa/:empresaId/empleados', upload.single('foto_perfil'), createEmpleado); // Crear empleado (aprendiz) asociado a una empresa
router.get('/empresa/id/:id', getEmpresaById);
router.post('/:id/documento', upload.single('pdf'), subirDocumentoIdentidad);
router.post('/empresas/:email', authMiddleware, upload.single('img_empresa'), createEmpresa);
router.post('/addHorariosInstructores', registrarHorarios_instructor)
router.get('/getAllHorariosInstructores/:instructor_ID', getAllHorariosInstructores)
router.put('/updeateHorariosInstructores', updateHorariosInstructores)
router.delete('/deleteHorariosInstructor/:instructor_ID', deleteHorariosInstructor)

// Rutas para administradores
// Permitir Administrador y Gestor
router.get('/admin/empleados', authMiddleware, authorizeRoles(['Administrador', 'Gestor', "Empresa"]), getAllEmpleadosForAdmin);
router.get('/admin/empresas', authMiddleware, authorizeRoles(['Administrador', 'Gestor', 'Empresa']), getAllEmpresasForAdmin);
router.post('/admin/empleados', authMiddleware, authorizeRoles(['Administrador', 'Gestor']), upload.single('foto_perfil'), createEmpleadoForAdmin);
router.put("/admin/changerole/:id", authMiddleware, authorizeRoles(["Administrador"]), changeRole)

//Ruta Pregunta de seguridad
router.post('/security/', authMiddleware, securityData ); 
router.get('/getSecurity/', authMiddleware, getSecurityData)
router.put('/updateSecurity/', authMiddleware, updateSecurity);

//Ruta obtener empleados para empresa
router.get('/empleadosForempresa/:nameEmpresa', authMiddleware, authorizeRoles(['Administrador']), ObtenerEmpleadosPorEmpresa);

router.get("/", (req, res) => {
  res.send("🚀 API funcionando correctamente");
});
  

module.exports = router;