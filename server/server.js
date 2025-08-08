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
const actasRoutes = require("./routes/actasRoutes");

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

const allowedOrigins = [
  "http://localhost:5173"
  
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origin (como Postman) o desde orígenes permitidos
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use(express.json());
app.use(cookieParser()); // Usar cookie-parser para manejar cookies

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/base64storage", express.static(path.join(__dirname, "base64storage")));

// Registrar rutas
app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);
app.use("/api/courses", cursoRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/actas", actasRoutes);

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

    attendanceController.setDb(db);
    cursoController.setDb(db);
    notificationService.setDb(db);
    notificationController.setDb(db);

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