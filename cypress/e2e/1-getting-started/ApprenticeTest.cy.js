describe('Prueba Modulo Aprendiz', () => {
    before(() => {
        Cypress.session.clearAllSavedSessions();
    });

    // Función para iniciar sesión como aprendiz
    const loginAprendiz = () => {
        cy.visit("http://localhost:5173/");
        cy.get(".button_signIn").first().click({ force: true });

        // Ingresar credenciales del rol Aprendiz
        cy.get('input[type="email"]').first().type('fakewo8113@arugy.com');
        cy.get('input[type="password"]').type('Prueba1234*');

        // Iniciar sesión
        cy.get(".button_register").click();

        // Esperar a que la redirección se complete
        cy.url().should('include', 'http://localhost:5173/');

        // Llenar Formulario de perfil aprendiz (si es necesario)
        cy.get('body').then(($body) => {
            if ($body.find('.container_profile').length > 0) {
                cy.get('.container_profile').find('input[name="nombres"]').type('Jawix');
                cy.get('.container_profile').find('input[name="apellidos"]').type('Avila');
                cy.get('.container_profile').find('input[name="celular"]').type('3124567890');
                cy.get('.updateProfile1').click();
            }
        });
    };

    // Configuración de la sesión
    beforeEach(() => {
        cy.session('aprendiz', loginAprendiz, {
            validate: () => {
                // Verificar que la sesión sigue activa
                cy.visit('http://localhost:5173/');
                
                // Verificar que estamos autenticados
                cy.get('body').should('exist');
                
                // Volver a la página principal
                cy.visit('http://localhost:5173/');
            },
            cacheAcrossSpecs: false
        });

        // Visitar la página después de restaurar la sesión
        cy.visit('http://localhost:5173/');
    });

    it.skip("visitar la pagina y registrarse como aprendiz", () => {
        // Esta prueba requiere un nuevo usuario, así que cerramos la sesión
        cy.session('temp_session', () => {
            cy.visit("http://localhost:5173/");
            cy.get(".button_signIn").first().click({ force: true });

            //Registro aprendiz
            cy.get('.goTo_register').click();
            cy.get('.container_AccountTypeAprendiz').first().click({ force: true });
            cy.get('.form_register').first().find('input[type="email"]').first().type('fakewo8113@arugy.com');
            cy.get('.password-container').first().find('input[type="password"]').first().type('Prueba1234*');
            cy.get('.confirmPassword-container').first().find('input[type="password"]').first().type('Prueba1234*');
            cy.get('.button_register').first().click({ force: true });
        }, {
            validate: () => {
                // No validamos para esta prueba específica
            },
            cacheAcrossSpecs: false
        });

        cy.visit("http://localhost:5173/");
    });

    it.skip("Iniciar sesion como aprendiz", () => {
        // Esta prueba se maneja en el beforeEach
        // Verificamos que estamos en la página principal autenticados
        cy.url().should('include', 'http://localhost:5173/');
    });

    it.skip("Ingresar a mis cursos", () => {
        //Ingresar a mis cursos
        cy.visit('http://localhost:5173/Cursos/MisCursosAsignados')

        cy.get('.course-card-carousel').click()

        //Ver horarios
        cy.contains('button', 'Ver Horarios').click()
        cy.get('.close-btn-view').contains('button', 'Cerrar Vista')

        //Ver actividades
        cy.get('.action-buttons').contains('button', 'Ver Actividades').click({force:true})
    });

    it('Subir actividades a la plataforma como aprendiz',()=>{
        //Ingresar a las actividades pendientes
        cy.visit('http://localhost:5173/Cursos/1/actividades')

        //Ver detalles de la actividad
        cy.get('.activity-actions').contains('button','Ver detalle').click()

        //Registrar entrega
        cy.contains('button','REGISTRAR ENTREGA').click()
    })

    it.skip('Buscar cursos como aprendiz', () => {
        cy.visit("http://localhost:5173/Cursos/BuscarCursos") 
        
        //Usar Filtros de Buscar Cursos
        //Primer filtro - Estado
        cy.get('.filter-select').eq(0).select('Activo').wait(1000)

        // Segundo filtro - Oferta  
       cy.get('.filter-group select').eq(1).select('cerrada').wait(1000)
       cy.get('.filter-group select').eq(0).select('En oferta').wait(1000)

        //Tercer Filtro
        cy.get('.search-input').get('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software')
    });

    

    it.skip('cerrar sesión como aprendiz', () => {
        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({ force: true });

        //Verificar que se cerró la sesión
        cy.url().should('include', 'http://localhost:5173/');
        cy.get('.button_signIn').should('exist');
    });
});