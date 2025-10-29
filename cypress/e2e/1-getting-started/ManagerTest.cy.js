describe('Prueba manager', () =>{
    it.skip("Registrarse como manager", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

       //Registro manager
       cy.get('.goTo_register').click()
       cy.get('.container_AccountTypeEmpresa').first().click({force : true}).get('.form_register').first()
       cy.get('.form_register').first().find('input[type="email"]').first().type('yixeha6414@dwakm.com')
       cy.get('.password-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.confirmPassword-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.button_register').first().click({force : true})
    })

    it("Iniciar sesion como manager", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()
    })
        
})  
    