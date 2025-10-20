describe('Prueba de modulo de gestión de gestores', ()=>{
    it.skip("visitar la pagina e iniciar sesion como Gestor", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        
    })

    it.skip("Ingresar a Cursos, después Mis cursos y probar los filtros", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a los cursos
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force : true})

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

    it("Ver un curso con su infromación", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a los cursos
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force : true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})
        cy.wait(4000)

        //Darc Click en Ver Curso y su información
        cy.get('.cursos-list-container').get('.ver-curso').first().click({force:true})
        cy.get('.calendar-btn').click()
        cy.get('.modal-overlay').find('.closeModal').click({force:true})
        cy.wait(4000)
        cy.get('.material-btn').click()
        cy.wait(4000)
        cy.get('.btn-back-c').click()
    })
        
        

    it.skip("Crear Curso",()=>{
         cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a dar click en cursos pero ahora dandole click a la opción de Crear cursos
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Crear curso').first().click({force:true})

        //Crear curso
        cy.get('.container_createCourse').find('.containerDetails_course').find('input[placeholder="Agregar nombre del curso"]').type('Frontend',{force:true})

        const description ='A'.repeat(300)
        cy.get('.container_createCourse').find('.containerInput_description_course').find('textarea[placeholder="Agregar descripción del curso (mínimo 300 caracteres)"]').type(description)

        cy.get('.containerDetails_course2').find('.containerInput_ficha').find('input[id="fichaCourse"]').type(2825019)

        cy.contains('.offer-button', 'Abierta').click()
        cy.contains('.offer-button', 'Activo').click()

        cy.get('.addDate').first().click()

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
    })

    it.skip("Ingresar a Buscar cursos y probar filtros", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})
        
        //Volver a dar click en cursos pero ahora dandole click a la opción de buscar cursos
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
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

    it.skip('Revisar la sección de Material de Apoyo',()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a gestiones pero ahora dandole click a Material de Apoyo
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.cursos-section').get('.curso-card').first().click({force : true})
        cy.get('.archivos-section').get('.btn-eliminar').first().click({force : true})
    })

    it.skip('Ingresar a un curso y editar su información', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a los cursos
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force : true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})
        cy.get('.cursos-list-container').get('.ver-curso').first().click({force:true})
        cy.get('.edit-btn').click()

        const descripcion = 'A'.repeat(300)
        cy.get('.container_createCourse')
        .find('.containerInput_description_course')
        .find('textarea[placeholder="Agregar descripción del curso (mínimo 300 caracteres)"]')
        .clear()
        .should('have.value', '')  // Verifica que esté vacío
        .type(descripcion)
        .should('have.value', descripcion)  // Verifica que se haya escrito

        cy.get('buttonCreate_Course').click({force:true})

    })

    it("Dar click a Gestiones, luego a Gestión de Empleados", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('bator41024@fixwap.com')
        cy.get('input[type="password"]')
            .type('Prueba1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Empleados').first().click({force : true})
    })

})
    



        

