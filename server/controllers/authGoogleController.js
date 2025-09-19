const { OAuth2Client } = require('google-auth-library');
const generalConfig = require('../config/general');
const jwt = require('jsonwebtoken');

let dbInstance; // Variable para almacenar la instancia de la base de datos y los modelos

// Esta función se llamará desde app.js para inyectar la instancia de db
const setDb = (databaseInstance) => {
    dbInstance = databaseInstance;
};

const client = new OAuth2Client(generalConfig.googleClientId);

/**
 * Maneja el inicio de sesión con Google.
 * Si el usuario existe por googleId, inicia sesión.
 * Si existe por email pero no tiene googleId, lo asocia y permite el login.
 * Si no existe, pide registro.
 */
const googleSignIn = async (req, res) => {
    if (!dbInstance || !dbInstance.Usuario) {
        console.error('Error: La instancia de la base de datos o el modelo Usuario no están disponibles.');
        return res.status(500).json({ success: false, message: 'El servidor no está completamente inicializado.' });
    }

    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: 'No se proporcionó token de Google.' });
    }

    try {
        // Verificar el ID Token de Google
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: generalConfig.googleClientId,
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const nombres = payload['given_name'] || payload['name'];
        const apellidos = payload['family_name'] || '';
        const emailVerified = payload['email_verified'];

    

        if (!emailVerified) {
            return res.status(400).json({ success: false, message: 'El correo electrónico de Google no está verificado.' });
        }

        // Buscar usuario por googleId y por email
        const userByGoogleId = await dbInstance.Usuario.findOne({ where: { googleId: googleId } });
        const userByEmail = await dbInstance.Usuario.findOne({ where: { email: email } });

        if (userByGoogleId) {
            // Usuario ya tiene googleId, login normal
            await userByGoogleId.update({
                nombres: nombres,
                apellidos: apellidos,
                verificacion_email: true,
            });
            return generateTokenAndRespond(userByGoogleId, res);
        } else if (userByEmail) {
            // Usuario existe por email, pero no tiene googleId: actualízalo
            await userByEmail.update({
                googleId: googleId,
                nombres: nombres,
                apellidos: apellidos,
                verificacion_email: true,
            });
            return generateTokenAndRespond(userByEmail, res);
        } else {
            return res.status(400).json({ success: false, message: 'Correo no registrado. Por favor, regístrese primero.' });
        }
    } catch (error) {
        console.error('Error al procesar el inicio de sesión con Google:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al autenticar con Google.' });
    }
};

/**
 * Maneja el registro con Google.
 * Recibe el tipo de cuenta desde el frontend.
 */
const googleSignUp = async (req, res) => {
    const { idToken, accountType } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, message: 'No se proporcionó token de Google.' });
    }

    try {
        // Verificar el ID Token de Google
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: generalConfig.googleClientId,
        });

        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const nombres = payload['given_name'] || payload['name'];
        const apellidos = payload['family_name'] || '';
        const emailVerified = payload['email_verified'];


        if (!emailVerified) {
            return res.status(400).json({ success: false, message: 'El correo electrónico de Google no está verificado.' });
        }

        // Buscar usuario en tu base de datos
        const existingUser = await dbInstance.Usuario.findOne({ where: { email: email } });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado. Por favor, inicie sesión.' });
        }

        let empresaId = null;
        // Si es empresa, crea el registro en la tabla Empresa
        if (accountType === 'Empresa') {
            const nuevaEmpresa = await dbInstance.Empresa.create({
                NIT: null,
                email_empresa: null,
                nombre_empresa: null,
                direccion: null,
                estado: 'inactivo',
                categoria: null,
                telefono: null,
                img_empresa: null,
            });
            empresaId = nuevaEmpresa.ID;
        }

        // Crear nuevo usuario con el tipo de cuenta recibido
        console.log('Creando nuevo usuario con Google:', email);
        const user = await dbInstance.Usuario.create({
            googleId: googleId,
            email: email,
            nombres: nombres,
            apellidos: apellidos,
            accountType: accountType || 'Aprendiz',
            verificacion_email: true,
            password: null,
            empresa_ID: empresaId // Asigna el ID de la empresa si aplica
        });

        return generateTokenAndRespond(user, res);
    } catch (error) {
        console.error('Error al procesar el registro con Google:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al registrar con Google.' });
    }
};

const generateTokenAndRespond = (user, res) => {
    const accessToken = jwt.sign(
        {
            id: user.ID,
            email: user.email,
            accountType: user.accountType,
            empresa_ID: user.empresa_ID || null
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1h" }
    );

    // Genera el refreshToken (ejemplo: 7 días)
    const refreshToken = jwt.sign(
        {
            id: user.ID,
            email: user.email,
            accountType: user.accountType,
            empresa_ID: user.empresa_ID || null
        },
        process.env.JWT_REFRESH_SECRET || "refresh_secret",
        { expiresIn: "7d" }
    );

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000, // 1 hora
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    res.status(200).json({
        success: true,
        message: 'Operación exitosa.',
        accessToken,
        refreshToken,
        user: {
            ID: user.ID,
            googleId: user.googleId,
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            foto_perfil: user.foto_perfil,
            accountType: user.accountType,
            empresa_ID: user.empresa_ID || null
        }
    });
};

module.exports = {
    googleSignIn,
    setDb,
    googleSignUp
};