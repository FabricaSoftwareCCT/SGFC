describe('Prueba registrarse como aprendiz', ()=>{
    it("visitar la pagina e iniciar sesion como aprendiz", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

       //Registro aprendiz
       cy.get('.goTo_register').click()
       cy.get('.container_AccountTypeAprendiz').first().click({force : true}).get('.form_register').first()
       cy.get('.form_register').first().find('input[type="email"]').first().type('yipodi1881@nrlord.com')
       cy.get('.password-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.confirmPassword-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.button_register').first().click({force : true})
    })
})