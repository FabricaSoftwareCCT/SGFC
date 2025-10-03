const express = require("express");
const {ReporteService} = require("../services/ReporteService");

class ReporteController {
    static Searchreport = async (req, res) => {
        try {
            const {nombre_curso} = req.body;
            const filtre = req.FiltreValidos;

            const response = await ReporteService.SearchReport(nombre_curso, filtre);

            if(!response){
                res.status(404).json({msg: "No se encontraron resultados"} );
                return;
            }

            res.status(200).json(response);
            return;
        }catch (err) {
            console.log(err);
            res.status(500).json({msg: 'Error en el servidor'});
            return;
        }

    }
    
    static ReporteEficiencia = async (req, res) => {
        try {
            const {fecha_inicio, fecha_fin} = req.body;

            const response = await ReporteService.ReporteEficiencia(fecha_inicio, fecha_fin);

            if(!response){
                res.status(404).json({msg: "No se encontraron resultados"} );
                return;
            }

            res.status(200).json(response);
            return;

        }catch (err) {  
            console.log(err);
            res.status(500).json({msg: 'Error en el servidor'});
            return;
        }
    }
}

module.exports = { ReporteController };