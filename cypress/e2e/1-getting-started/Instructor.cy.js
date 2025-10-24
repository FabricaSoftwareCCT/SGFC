describe ("Prueba instructor", () => {
      it ("Inicio sesión de instructor y ver curso", ()=>{
         cy.visit ('http://localhost:5173/')
        cy.get ('.button_signIn').first().click({force : true}).get('.content_createAccount')
        cy.get('.form_register').first().find('input[type="email"]').first().type('vobebif221@fixwap.com')
        cy.get('.password-container').first().find('input[type="password"]').first().type('1234567890A$')
        cy.get('.button_register').click({force : true})
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Buscar cursos').first().click({force : true})
        cy.get('.carousel-card-search-course').first().click({force : true})
        cy.get('.edit-btn').first().click({force : true})
        cy.get('.calendar-week').contains('16').first().click({force : true})
        cy.get('.container_return_general').contains('Volver').first().click({force : true})
        cy.get('.back-button-manageAttendance').click({force : true})

        //Materia de apoyo
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.cursos-section').get('.curso-card').first().click({force : true})
        cy.get('.archivos-section').get('.btn-eliminar').first().click({force : true})

        //Perfil
        cy.get('.container_options_profile').find('button[id="btn_profile"]').first().click({force : true})
        
        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({force : true})

    })
    //no funciona esta prueba, ya que no sale el botón generar actas y no se puede seguir
    /*it ("Descargar actas", () =>{
        cy.visit ('http://localhost:5173/Gestiones/Actas')
        cy.get('.filterGestionsCompany').get('.button-proceedings-generar').contains('Generar acta').first().click({force : true})
    })*/

})