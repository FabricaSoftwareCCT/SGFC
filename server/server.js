require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Importar cookie-parser
const initializeDatabase = require("./models/index");
const generalConfig = require('./config/general');
const path = require("path");
const { Op } = require('sequelize');

// Importar controladores y rutas
const authGoogleController = require('./controllers/authGoogleController');
const authRouter = express.Router();
const userRoutes = require("./routes/userRoutes");
const cursoRoutes = require("./routes/cursoRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ubicacionesRoutesFactory = require("./routes/ubicacionesRoutes");
const actasRoutes = require("./routes/actasRoutes");
const reporteRoutes = require("./routes/ReporteRoutes");
const certificationCriteriaRoutes = require("./routes/certificationCriteriaRoutes")
const materialRoutes = require("./routes/materialRoutes")
const historialRoutes = require("./routes/historialRoutes")
const actividadRoutes = require("./routes/actividadRoutes")
const empresaRoutes = require("./routes/empresaRoutes")

// libreria para programar tareas
const cron = require('node-cron');
const { cleanExpiredTokens } = require('./controllers/userController');

// Ejecuta la limpieza de tokens expirados cada hora
cron.schedule('0 * * * *', async () => {
  try {
    await cleanExpiredTokens();
  } catch (error) {
    console.error('Error al limpiar tokens expirados:', error);
  }
}, {
  timezone: "America/Bogota" // Usa tu zona horaria real
});


process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'config', 'sgfc-vision-key.json');


const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const { ALLOWED_ORIGINS } = require('./config/env');

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origin (como Postman) o desde origenes permitidos
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS bloqueado para origen: ${origin}`);
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use(express.json());
app.use(cookieParser()); // Usar cookie-parser para manejar cookies

// Servir archivos estaticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/base64storage", express.static(path.join(__dirname, "base64storage")));

// Ruta de healthcheck para Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Registrar rutas
app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);
app.use("/api/courses", cursoRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
// Rutas de ubicaciones, inyectando instancia DB
app.use("/api/ubicaciones", (req, res, next) => {
  req._passDbToUbicaciones = true; // flag
  next();
});
app.use("/api/actas", actasRoutes);
app.use("/api/reports", reporteRoutes);
app.use("/api/certification", certificationCriteriaRoutes)
app.use("/api/material", materialRoutes)
app.use("/api/historial", historialRoutes)
app.use("/api/activities", actividadRoutes)
app.use("/api/empresa", empresaRoutes)

// Importar utilidades para gestión de índices
const { ensureIndexesSmart, dropDuplicateIndexes } = require('./utils/indexManagement');

async function startServer() {
  try {
    // Inicializar base de datos
    const db = await initializeDatabase();
    
    // Inyectar la instancia de la base de datos en los controladores y servicios
    authGoogleController.setDb(db);
    const attendanceController = require('./controllers/attendanceController');
    const cursoController = require('./controllers/cursoController');
    const notificationService = require('./services/notificationService');
    const notificationController = require('./controllers/notificationController');
    const certificationCriteriaController = require("./controllers/certificationCriteriaController")
    const materialController = require("./controllers/materialController");
    const historialController = require("./controllers/historialController")
    const { ActividadController } = require("./controllers/actividadController");

    attendanceController.setDb(db);
    cursoController.setDb(db);
    notificationService.setDb(db);
    notificationController.setDb(db);
    certificationCriteriaController.setDb(db);
    materialController.setDb(db);
    historialController.setDb(db);
    ActividadController.setDb(db);
    
    // Inicializar ReportRepository con la instancia de la base de datos
    const { setDb: setReportDb } = require('./Repository/ReportRepository');
    setReportDb(db);

    // Montar rutas de ubicaciones con acceso a la DB
    const ubicacionesRoutes = ubicacionesRoutesFactory(db);
    app.use("/api/ubicaciones", ubicacionesRoutes);

    // Limpiar índices duplicados y asegurar índices faltantes
    console.log("Limpiando índices duplicados...");
    await dropDuplicateIndexes(db.sequelize);
    console.log("Limpieza de índices duplicados completada.");
    
    console.log("Asegurando índices faltantes...");
    await ensureIndexesSmart(db.sequelize);
    console.log("Aseguramiento de índices completado.");

    // Crear datos por defecto
    await db.Departamento.createDefaultDeparment();
    await db.Ciudad.createDefaultCiudad();
    await db.Sena.createDefaultSENA();
    await db.Usuario.createDefaultAdmin();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log("🚀 Servidor corriendo en el puerto", PORT);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();