const express = require("express");
const dotenv = require("dotenv");
const { values } = require("pdf-lib");

dotenv.config();


const reporteMiddleware = (req, res, next) => {
    try {   
        //Agregar AccounType de la cuenta logeada
        const { nombre_curso, documento,  filtre} = req.body;
        /*
        //Validar que una cuenta este logeada
        if(!accounType) {
         res.status(401).json({msg: 'No autorizado, accounType es requerido'});
         return;   
        }
         */
        if(!nombre_curso){
            res.status(401).json({msg: "El nombre del curso es necesaroi"});
            return;
        }
        /*
        //Validación opcional
        if(!documento) {
            res.status(401).json({msg: 'Se necesita el documento del usuario'});
            return;   
        }
|       */

        /*
        //Validar tipo de cuenta
        const ValidaAccount = ['Administrador', 'Instructor'];
        if(!ValidaAccount.includes(accounType)) {
            res.status(401).json({msg: 'No autorizado'});
            return;   
        }
        */

        //Validar filtro
        if(!filtre) {
            res.status(400).json({msg: 'El filtro es requerido'});
            return;   
        }

        //Vlidar que el filtro sea correcto
        const ValidaFiltre = ['nombre_curso', 'fecha_inicio', 'fecha_fin', 'estado'];
        const FiltreValidos = [];

        //Recorrer los filtros y validar cuales se van a usar
        for(const key in filtre) {
            const value = filtre[key];
            if(key !== '' && value !== null && value !== undefined) {
                if(ValidaFiltre.includes(key)) {
                    FiltreValidos.push({[key]: value});
                }
            }
        }

        req.FiltreValidos = FiltreValidos;
        next();

    }catch (error) {
        console.log(error);
        res.status(500).json({msg: 'Error en el servidor'});
        return;
    }
};


module.exports = {reporteMiddleware};