describe ("Prueba manager", () =>{
    it ("Iniciar sesion", ()=>{
        cy.visit ('http://localhost:5173/')
        cy.get ('.button_signIn').first().click({force : true}).get('.content_createAccount')
        cy.get('.form_register').first().find('input[type="email"]').first().type('alejandrosalascortez4@gmail.com')
        cy.get('.password-container').first().find('input[type="password"]').first().type('1234567890A$')
        cy.get('.button_register').click({force : true}) })
})