describe('Prueba Modulo Aprendiz', ()=>{
    it.skip("visitar la pagina y registrarse como aprendiz", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

       //Registro aprendiz
       cy.get('.goTo_register').click()
       cy.get('.container_AccountTypeAprendiz').first().click({force : true}).get('.form_register').first()
       cy.get('.form_register').first().find('input[type="email"]').first().type('jawixav282@filipx.com')
       cy.get('.password-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.confirmPassword-container').first().find('input[type="password"]').first().type('Prueba1234*')
       cy.get('.button_register').first().click({force : true})
    })

    it.skip("Iniciar sesion como aprendiz", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol Aprendiz
        cy.get('input[type="email"]').first()
            .type('jawixav282@filipx.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Llenar Formulario de perfil aprendiz
        cy.get('.container_profile').find('input[name="nombres"]').type('Jawix')
        cy.get('.container_profile').find('input[name="apellidos"]').type('Avila')
        cy.get('.container_profile').find('input[name="celular"]').type('3124567890')

        cy.get('.updateProfile1').click()


    })

    it.skip("Ingresar al modulo de cursos como aprendiz", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('jawixav282@filipx.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})

        //Recorrer los filtros
        const textosFiltros = ['En oferta', 'Finalizados', 'Oferta abierta', 'Oferta cerrada'];
        textosFiltros.forEach((texto) => {
        cy.contains('.filtros button', texto).click();
        cy.contains('.filtros button', texto).should('have.class', 'activo');
        cy.wait(1000);
        });
    })

    it.skip('Buscar cursos como aprendiz', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('jawixav282@filipx.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Buscar cursos').first().click({force:true})

        
        //Usar Filtros de Buscar Cursos
        //Primer filtro - Estado
        cy.get('.custom-select-container .custom-select').eq(0).select('Activo').wait(1000)

        // Segundo filtro - Oferta  
        cy.get('.custom-select-container .custom-select').eq(1).select('Cerrada').wait(1000)
        cy.get('.custom-select-container .custom-select').eq(0).select('En oferta').wait(1000)


        //Tercer Filtro
        cy.get('.options_Search').find('input[type="text"]').type('Analisis y Desarrollo de Software')

    })

    it.skip('Solicitar un curso como aprendiz', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('jawixav282@filipx.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        cy.get('.courses-menu').get('.courses').first().click({force:true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Solicitar curso').first().click({force:true})

        //Editar formulario de solicitud de curso
        cy.contains('button', 'Editar').click({force:true})

        cy.get('input[placeholder="Nombre del curso"]').clear().type('Curso de Prueba Automatizado')

        //Ingresar Fechas
        cy.get('.input-solicitud-date').first().type('2025-10-29');
        cy.get('.input-solicitud-date').eq(1).type('2025-10-30')

        //Guardar solicitud
        cy.get('.botones-solicitud').contains('button', 'Guardar').click({force:true})

        //Enviar solicitud
        cy.get('.botones-solicitud').contains('button', 'Enviar Solicitud').click({force:true})

    })

    it.skip('cerrar sesión como aprendiz', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('hincapiefernandezjoan123@gmail.com')
        cy.get('input[type="password"]')
            .type(';,6E5RaH')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({force : true})
    })
})    