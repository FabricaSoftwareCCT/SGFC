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

    it.skip("Iniciar sesion como manager", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Rellenar datos de perfil manager
        cy.get('.container_profile').find('input[name="nombres"]').first().type('Juan Carlos')
        cy.get('.container_profile').find('input[name="apellidos"]').first().type('Pérez Gómez')
        cy.get('.container_profile').find('input[name="celular"]').first().type('5551234567')

        //Rellenar datos de la empresa
        cy.get('.container_data').find('input[name="Empresa.direccion"]').first().type('Calle Falsa 123')
        cy.get('.container_data').find('input[name="Empresa.telefono"]').first().type('5559876544')
        cy.get('.container_data').find('input[name="Empresa.email_empresa"]').first().type('mactech@gmail.com')
        cy.get('.container_data').find('input[name="Empresa.categoria"]').first().type('Tecnología')
        cy.get('select[name="departamento"]').select('Quindío');
        cy.get('select[name="ciudad"]').select('Armenia')
        cy.get('.name_company').find('input[name="Empresa.nombre_empresa"').type('MacTech Solutions')
        cy.get('.name_company').find('input[name="Empresa.NIT"').type('900123455')
        cy.get('select[name="estado"]').select('Activo')
         cy.get('.updateProfile1').click()
    })

    it.skip('Ingresar al modulo de cursos y luego a la sección de Mis cursos', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})

        //Recorrer los filtros
        const textosFiltros = ['Todos', 'Activos', 'Finalizados', 'Pendientes', 'Cancelados' , 'En oferta'];
        textosFiltros.forEach((texto) => {
        cy.contains('.filtros button', texto).click();
        cy.contains('.filtros button', texto).should('have.class', 'activo');
        cy.wait(1000);
        });
    })

    it.skip('Seleccionar buscar cursos', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
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

    it.skip('Solicitar Curso', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Solicitar curso').first().click({force:true})

        //Editar formulario de solicitud de curso
        cy.contains('button', 'Editar').click({force:true})

        cy.get('input[placeholder="Nombre del curso"]').clear().type('Curso de Prueba Automatizado')
        cy.get('input[placeholder="número"]').type('10')

        //Ingresar Fechas
        cy.get('.input-solicitud-date').first().type('2025-10-30');
        cy.get('.input-solicitud-date').eq(1).type('2025-11-10')

        //Guardar solicitud
        cy.get('.botones-solicitud').contains('button', 'Guardar').click({force:true})

        //Enviar solicitud
        cy.get('.botones-solicitud').contains('button', 'Enviar Solicitud').click({force:true})
    })

    it.skip('Ingresar a material de apoyo', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.cursos-section').get('.curso-card').first().click({force : true})
    })

    it.skip('Ir al modulo de empleados', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        cy.get('.container_options').contains('a', 'Empleados').click({force:true});

        //Agregar Empleado
        cy.get('.btn_createEmploye').click()
        cy.get('.modal-bodyCreateEmploye').find('input[name="nombres"]').first().type('Evie')
        cy.get('.modal-left input[name="apellidos"]').first().type('Frye')
        cy.get('select.TipoDocumento[name="tipoDocumento"]').select('CedulaCiudadania')
        cy.get('.modal-left').find('input[name="cedula"]').type(92837468)
        cy.get('.modal-left').find('input[name="celular"]').first().type(3214567988)
        cy.get('.modal-left').find('input[name="email"').first().type('evie@gmail.com')
        cy.get('.status-container').find('.status-buttons').contains('button', 'Activo').first().click({force:true})
        cy.get('.save-button').first().click({force:true})

    })

    it('Cerrar Sesión', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})
        
        //Ingresar credenciales del rol manager
        cy.get('input[type="email"]').first()
            .type('yixeha6414@dwakm.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({force : true})
    })
        
})  
    