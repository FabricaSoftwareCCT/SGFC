# SGFC – Sistema de Gestión de Formación Complementaria

Este proyecto es una plataforma para la gestión de cursos de formación complementaria, desarrollada con:

- **Frontend:** React + JavaScript (Vercel)  
- **Backend:** Node.js + Express + Sequelize + MySQL (Railway)  
- **Control de versiones:** Git + GitHub  
- **Metodología:** Scrum  

---

## 1. Clonar el repositorio
```bash
git clone https://github.com/FabricaSoftwareCCT/SGFC.git
cd SGFC
```

## 2. Instalar dependencias
### Backend
```bash
cd server
npm install
```
### Frontend
```bash
cd ../client
npm install
```

---

## 3. Configuración del Servicio de Emails
El proyecto utiliza un servicio de envío de correos ubicado en:

```
server/services/emailService.js
```

Debes agregar ahí tu **correo** y **clave** del proveedor de email (por ejemplo, Gmail o SMTP).  
Ejemplo dentro de `emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'TU_CORREO@gmail.com',
    pass: 'TU_CLAVE_GENERADA'
  }
});
```
> **Importante:** No uses tu contraseña normal, utiliza una **clave de aplicación** (App Password) generada en la configuración de tu proveedor de correo.

---

## 4. Configuración de Google Cloud
Para la validación de documentos, es necesario configurar credenciales de Google Cloud.

1. Crear un archivo **.env** en la carpeta `server` con las variables:
```env
GOOGLE_PROJECT_ID=tu_project_id
GOOGLE_CLIENT_EMAIL=tu_service_account_email
GOOGLE_PRIVATE_KEY="tu_private_key"
```
2. Asegúrate de **activar la API de Google Cloud Vision o el servicio correspondiente** en tu consola de Google Cloud.
3. Coloca el archivo `.env` en la raíz de la carpeta `server` (**no subirlo a GitHub**).

---

## 5. Ejecutar el proyecto
```bash
npm run dev
```

---

## 6. Notas
- Recuerda **no subir** credenciales ni claves privadas al repositorio.
- Este proyecto fue desarrollado en la **Fábrica de Software del SENA – Centro de Comercio y Turismo**.
