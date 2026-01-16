const multer = require("multer");
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => { // determina donde se guardara el archivo
        const rutaAbsoluta = path.join(__dirname, '../xlsxUploads')

        if(!fs.existsSync(rutaAbsoluta)){
            fs.mkdirSync(rutaAbsoluta, {recursive: true}) // verificar si la carpeta existe en la ruta absoluta
        }

        cb(null, rutaAbsoluta)
    },
    filename: (req, file, cb)=>{ // genera el nombre final del archivo
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)// ej: archivo_xlsx-1748374966675.xlsx
    }
})

const fileFilter = (ruq, file, cb) => { //valida que el mimetype sea valido
    const validMimetype = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (validMimetype.includes(file.mimetype)) {
        cb(null, true);
    }else{
        cb(new Error('Solo se permiten archivos .xlsx'), false)
    }
}

const xlsxUploads = multer({storage, fileFilter}) // Aqui se guarda el archivo

module.exports = xlsxUploads
