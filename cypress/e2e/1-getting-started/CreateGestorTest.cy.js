describe('Pruebas de Crear un Gestor', ()=>{
    it("visitar la pagina e iniciar sesion como administrador", ()=>{
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

        //Entrar a Gestion Gestores
        cy.contains('button', 'Gestión de Gestores').first().click({force:true})

        //Agregar Gestor
        cy.get(".btn_createGestor").click()

        //Llenar datos del gestor
        cy.get('#modal-overlayCreateGestor').find('.modal-left').contains('label', 'Nombres').first().find('input[type="text"]').type('Santiago')
        cy.get('#modal-overlayCreateGestor').find('.modal-left').contains('label', 'Apellidos').first().find('input[type="text"]').type('Fernandez')
        cy.get('#modal-overlayCreateGestor').find('.modal-left').contains('label', 'Documento').first().find('input[type="text"]').type('9999999')
        cy.get('#modal-overlayCreateGestor').find('.modal-left').contains('label', 'Celular').first().find('input[type="text"]').type('3137778775')
        cy.get('#modal-overlayCreateGestor').find('.modal-left').contains('label', 'Email').first().find('input[type="email"]').type('bator41024@fixwap.com')

        //Ponerle un estado al usuario
        cy.get('#modal-overlayCreateGestor').find('.status-container').contains('.status', 'Activo').first().click({force:true})

        //Guardar Usuario
        cy.get('#modal-overlayCreateGestor').find('.modal-right').contains('.save-button', 'Guardar').click({force:true})
    })
        
})
