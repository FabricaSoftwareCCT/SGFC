describe('Pruebas de Crear un Instructor', ()=>{
    it.skip("visitar la pagina e iniciar sesion como administrador", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Gestiones
        cy.get('.container_options').get('.gestiones').first().click({force:true})

        //Entrar a Gestion Instructores
        cy.contains('button', 'Gestión de Instructores').first().click({force:true})

        //Ver pefil de un instructor y Editar
        cy.get('.profile-btn').first().click({force:true})
        cy.get('.edit-button-updateInstructor').first().click({force:true})

        //Modificar datos del instructor
        cy.get('.modal-left-update').find('input[name="nombres"]').first().clear({force:true}).type('Andres Felipe')
        cy.get('.edit-button-updateInstructor').first().click({force:true})
    })

    it('Crear un Instructor', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Gestiones
        cy.get('.container_options').get('.gestiones').first().click({force:true})

        //Entrar a Gestion Instructores
        cy.contains('button', 'Gestión de Instructores').first().click({force:true})

        //Agregar Instructor
        cy.get(".btn_createInstructor").click()
        
        //Llenar datos del instructor
        cy.get('#modal-overlayCreateInstructor').find('.modal-left').contains('label', 'Nombres').first().find('input[type="text"]').type('Andres')
        cy.get('#modal-overlayCreateInstructor').find('.modal-left').contains('label', 'Apellidos').first().find('input[type="text"]').type('Gomez')
        cy.get('#modal-overlayCreateInstructor').find('.modal-left').contains('label', 'Cédula').first().find('input[name="documento"]').type('8888888')
        cy.get('.modal-left').contains('label', 'Título').find('input[type="text"]').type('Instructor')
        cy.get('#modal-overlayCreateInstructor').find('.modal-left').contains('label', 'Celular').first().find('input[name="celular"]').type('3105557788')
        cy.get('#modal-overlayCreateInstructor').find('.modal-left').contains('label', 'Email').first().find('input[type="email"]').type('mobarey901@nrlord.com')
        cy.get('#modal-overlayCreateInstructor').find('.status-container').contains('.status', 'Activo').first().click({force:true})
         cy.get('.modal-right').get('.save-button').first().click({force : true})
    })

       
})