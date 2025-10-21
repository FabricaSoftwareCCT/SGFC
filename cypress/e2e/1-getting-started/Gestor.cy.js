//no se puede realizar esta prueba, no presiona el botón de caledario
describe("Apoyo gestor", () => {
   /* it("Crear curso", () => {
        cy.visit('http://localhost:5173/Cursos/CrearCurso')
        cy.get('.addDate').first().click({force: true})
        
     //Ingresar Fechas
        cy.get('.organized-date-inputs').contains('label', 'Fecha inicio:').find('input[type="date"]').type('2025-10-20')
        cy.get('.organized-date-inputs').contains('label', 'Fecha fin:').find('input[type="date"]').type('2025-10-25')

        //Seleccionar horario de curso
        const selectTimeSlot = (time, day) => {
        const timeSlots = {
            '06:00': 0, '07:00': 1, '08:00': 2, '09:00': 3, '10:00': 4,
            '11:00': 5, '12:00': 6, '13:00': 7, '14:00': 8, '15:00': 9,
            '16:00': 10, '17:00': 11, '18:00': 12
        }
        
        const days = {
            'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6, 'Dom': 7
        }
        
        cy.get('.calendar-table tbody tr').eq(timeSlots[time])
            .find('td').eq(days[day])
            .click()
        }

            // Uso:
            selectTimeSlot('08:00', 'Lun') 
            selectTimeSlot('08:00', 'Mar') 
            selectTimeSlot('14:00', 'Mié')
        
        //Guardar Fechas
        cy.get('.save-button-calendar').click()
        cy.get('.buttonCreate_Course').click()
    })*/
   it ("Ingresar reporte y estadisticas", () =>{
             cy.visit ('http://localhost:5173/')
        cy.get ('.button_signIn').first().click({force : true}).get('.content_createAccount')
        cy.get('.form_register').first().find('input[type="email"]').first().type('cupcakesweet2025@gmail.com')
        cy.get('.password-container').first().find('input[type="password"]').first().type('1234567890A$')
        cy.get('.button_register').click({force : true})
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Reporte y Estadísticas').first().click({force : true})
        cy.get('.button-generar-reporte-estadisticas').click({force : true})
        cy.get('.tabla-datos-estadisticas').get('.tabla-fila-estadisticas').first().click({force : true})
        cy.get('.button-filtro-reporte-estudiantes').click({force : true})
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').first().find('input[type="text"]').type('A')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(1).find('input[type="text"]').type('G')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(2).find('input[type="text"]').type('12344567890')
        cy.contains('.filtro-opcion-estudiantes', 'Activo').click({force: true})
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(4).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(5).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').get('.filtro-botones-estudiantes').find('button', 'Limpiar').click({force : true})
        cy.get('.tabla-datos-estudiantes').get('.tabla-fila-estudiantes').first().click({force : true})
        cy.get('.container-tabla-estudiantes').get('.button-generar-reporte-estudiantes').click({force : true})

        //eficiencia
        cy.get('.container-tabla-estudiantes').get('.button-eficiencia-estudiantes').click({force : true})
        cy.get('.container-tabla-eficiencia').get('.button-filtro-reporte-eficiencia').click({force : true})
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').first().find('input[type="text"]').type('A')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(1).find('input[type="text"]').type('n')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(2).find('input[type="text"]').type('1234567890')
        cy.contains('.filtro-opcion-eficiencia', 'Activo').first().click(6,0,{force: true})
        cy.contains('.filtro-boton-pequeno-eficiencia', 'Actividades Faltantes').first().click(6,0,{force: true})
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(5).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').get('.filtro-botones-eficiencia').find('button', 'Limpiar').click({force : true})
        cy.get('.tabla-datos-eficiencia').get('.tabla-fila-eficiencia').first().click({force : true})
        cy.get('.container-tabla-eficiencia').get('.button-generar-reporte-eficiencia').click({force : true})
        cy.get('.button-volver-eficiencia').click({force : true})
        cy.get('.button-volver-estudiantes').click({force : true})
   })
})