const { Sequelize } = require("sequelize")
const createDatabaseIfNotExists = require("../config/database")

// Importar modelos
const Usuario = require("./User");
const Curso = require("./curso");
const Empresa = require("./empresa");
const Sena = require("./sena");
const Ciudad = require("./ciudad");
const Departamento = require("./departamento");
const AsignacionCursoInstructor = require("./AsignacionCursoInstructor");
const InscripcionCurso = require("./InscripcionCurso");
const Asistencia = require("./Asistencia");
const Notificacion = require("./Notificacion");
const Actas = require("./Actas");
const InvitacionCurso = require("./InvitacionCurso");
const Criterio = require("./Criterio");
const CursoTieneCriterio = require("./CursoTieneCriterio");
const UsuarioTieneCriterios = require("./UsuarioTieneCriterios");
const createTriggers = require("../utils/databaseTriggers");
const MaterialDeApoyo = require("./MaterialDeApoyo");
const CursoTieneMaterialDeApoyo = require("./CursoTieneMaterialDeApoyo");
const Horarios_instructor = require("./Horarios_instructor")
const UsuarioEdita = require("./UsuarioEdita")
const UserSecurity =  require("./UserSecurity");
const CursoTemarioTema = require("./CursoTemarioTema");
const CursoTemarioRecurso = require("./CursoTemarioRecurso");
const ActividadCurso = require("./ActividadCurso");
const ActividadEntrega = require("./ActividadEntrega");
const ActividadTieneMaterial = require("./ActividadTieneMaterial");

// Leer la URL de conexión (recomendada en producción)
const DB_URL = process.env.DB_URL

// Alternativamente, datos individuales (útiles en desarrollo local)
const DB_NAME = process.env.DB_NAME || "formacion_complementaria"
const DB_USER = process.env.DB_USER || "root"
const DB_PORT = process.env.DB_PORT || 3306 // Puerto por defecto de MySQL
const DB_PASSWORD = process.env.DB_PASSWORD || ""
const DB_HOST = process.env.DB_HOST || "localhost"

async function initializeDatabase() {
  let sequelize

  if (DB_URL) {
    // Producción o conexión directa
    sequelize = new Sequelize(DB_URL, {
      dialect: "mysql",
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
      logging: false,
      pool: {
        max: 10,           // Máximo de conexiones por instancia
        min: 2,            // Mínimo de conexiones idle
        acquire: 30000,    // Tiempo máximo (ms) para obtener conexión
        idle: 10000,       // Tiempo máximo (ms) que una conexión puede estar idle
        evict: 1000,       // Intervalo (ms) para verificar conexiones idle
      },
    })
  } else {
    // Desarrollo local: crear base de datos si no existe
    await createDatabaseIfNotExists()

    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: "mysql",
      port: DB_PORT,
      logging: false,
      pool: {
        max: 10,           // Máximo de conexiones por instancia
        min: 2,            // Mínimo de conexiones idle
        acquire: 30000,    // Tiempo máximo (ms) para obtener conexión
        idle: 10000,       // Tiempo máximo (ms) que una conexión puede estar idle
        evict: 1000,       // Intervalo (ms) para verificar conexiones idle
      },
    })
  }

  try {
    await sequelize.authenticate()
    console.log("✅ Conectado a la base de datos con Sequelize.")
  } catch (error) {
    console.error("❌ No se pudo conectar a la base de datos:", error)
    process.exit(1)
  }

  // Inicializar modelos con instancia de sequelize
  Usuario.init(sequelize);
  Curso.init(sequelize);
  Empresa.init(sequelize);
  Sena.init(sequelize);
  Ciudad.init(sequelize);
  Departamento.init(sequelize);
  AsignacionCursoInstructor.init(sequelize);
  InscripcionCurso.init(sequelize);
  Notificacion.init(sequelize);
  Actas.init(sequelize);
  InvitacionCurso.init(sequelize);
  Criterio.init(sequelize);
  CursoTieneCriterio.init(sequelize);
  UsuarioTieneCriterios.init(sequelize);
  Asistencia.init(sequelize);
  MaterialDeApoyo.init(sequelize);
  CursoTieneMaterialDeApoyo.init(sequelize);
  Horarios_instructor.init(sequelize)
  UsuarioEdita.init(sequelize)
  UserSecurity.init(sequelize);
  CursoTemarioTema.init(sequelize);
  CursoTemarioRecurso.init(sequelize);
  ActividadCurso.init(sequelize);
  ActividadEntrega.init(sequelize);
  ActividadTieneMaterial.init(sequelize);

  // Asociar modelos
  const models = {
    Usuario,
    Curso,
    Empresa,
    Sena,
    Ciudad,
    Departamento,
    AsignacionCursoInstructor,
    InscripcionCurso,
    Notificacion,
    Actas,
    InvitacionCurso,
    Criterio,
    CursoTieneCriterio,
    UsuarioTieneCriterios,
    Asistencia,
    MaterialDeApoyo,
    CursoTieneMaterialDeApoyo,
    Horarios_instructor,
    UsuarioEdita,
    UserSecurity,
    CursoTemarioTema,
    CursoTemarioRecurso,
    ActividadCurso,
    ActividadEntrega,
    ActividadTieneMaterial
  };

  Object.values(models).forEach((model) => {
    if (model.associate) model.associate(models)
  })

  // Sincronizar tablas
  // En desarrollo: alter: true permite modificar tablas en tiempo real
  // En produccion: sync() sin alter para evitar errores de indices duplicados
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    await sequelize.sync();
    console.log("Tablas sincronizadas (modo produccion).");
  } else {
    await sequelize.sync({ alter: true });
    console.log("Tablas sincronizadas con alter (modo desarrollo).");
  }

  // Se añaden los triggers
  console.log("Creando triggers...")
  try {
    await createTriggers(sequelize)
  } catch (error) {
    console.log("Ocurrió un error al crear los triggers")
    console.error(error)
    process.exit(1)
  }
  console.log("Triggers creados.")

  return {
    sequelize,
    ...models
  }
}

module.exports = initializeDatabase
