describe('Prueba de modulo de gestión de gestores', ()=>{
    it.skip("visitar la pagina e iniciar sesion como Gestor", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        
    })

    it.skip("Ingresar a Cursos, después Mis cursos y probar los filtros", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
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

    it.skip("Ver un curso con su infromación", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
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
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a dar click en cursos pero ahora dandole click a la opción de Crear cursos
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Crear curso').first().click({force:true})

        //Crear curso
        cy.get('.container_createCourse').find('.containerDetails_course').find('input[placeholder="Agregar nombre del curso"]').type('Analisis y Desarrollo de Software',{force:true})

        const description ='A'.repeat(300)
        cy.get('.container_createCourse').find('.containerInput_description_course').find('textarea[placeholder="Agregar descripción del curso (mínimo 300 caracteres)"]').type(description)

        cy.get('.containerDetails_course2').find('.containerInput_ficha').find('input[id="fichaCourse"]').type(2825020)

    
        cy.contains('.offer-button', 'Cerrada').click()
        cy.contains('.offer-button', 'En oferta').click()

        cy.get('input[placeholder="NIT de la empresa"]').type('900123456');
        cy.get('.resultados-empresa li').contains('Tech Solutions').click();

        cy.get('.containerDetails_course2').get('.duracion-inputs').find('input[placeholder="Días"]').type('30')
        cy.get('.containerDetails_course2').get('.lugar-formacion').find('input[type="text"]').type('Virtual')

        cy.get('.addDate').first().click()

        //Ingresar Fechas
        cy.get('.organized-date-inputs').contains('label', 'Fecha inicio:').find('input[type="date"]').type('2025-10-31')
        cy.get('.organized-date-inputs').contains('label', 'Fecha fin:').find('input[type="date"]').type('2025-11-25')

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
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
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
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a gestiones pero ahora dandole click a Material de Apoyo
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.cursos-section').get('.curso-card').first().click({force : true})
    })

    it.skip('Ingresar a un curso y editar su información', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
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

        cy.get('.buttonCreate_Course').contains('Actualizar curso').click();


    })

    it.skip("Dar click a Gestiones, luego a Gestión de Empleados", ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
       cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Empleados').first().click({force : true})
        
        //Actualizar información del empleado
        cy.get('.profile-btn').first().click({force:true})
        cy.get('.edit-button-updateInstructor').first().click({force:true})
        cy.get('.modal-left-update').find('input[type="text"]').first().clear().type('San Martin')
        cy.get('.modal-left-update').find('input[name="apellidos"]').clear().type('De Napolés')
        cy.get('img[alt="Subir documento"]').click()
        cy.get('.custom-dropdown').click();
        cy.contains('.dropdown-option', 'Cédula de ciudadanía').click();
        cy.get('.modal-left-update').find('input[name="documento"]').clear().type(45567869)
        cy.get('.modal-left-update').find('.status-buttons').contains('button', 'activo').first().click({force:true})
        cy.get('.edit-button-updateInstructor').click({force:true})
        
    })

    it.skip('Crear empleado desde Gestor', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
       cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Empleados').first().click({force : true})

         //Agregar Empleado
        cy.get('.btn_createEmploye').click()
        cy.get('.modal-bodyCreateEmploye').find('input[name="nombres"]').first().type('Marco')
        cy.get('.modal-left input[name="apellidos"]').first().type('Polo')
        cy.get('select.TipoDocumento[name="tipoDocumento"]').select('CedulaCiudadania')
        cy.get('.modal-left').find('input[name="cedula"]').type(92837467)
        cy.get('.modal-left').find('input[name="celular"]').first().type(3214567980)
        cy.get('.modal-left').find('input[name="email"]').first().type('canajef689@nrlord.com')
        cy.get('select[name="empresaId"].empresa-select').select(1); 
        cy.get('.status-container').find('.status-buttons').contains('button', 'Activo').first().click({force:true})
        cy.get('.save-button').first().click({force:true})

    })

    it.skip('Usar filtros para buscar empleados', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
       cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Empleados').first().click({force : true})

        //Filtro por nombre
        //cy.get('#inputNameCC').type('Juan').should('have.value', 'Juan');

        // 2. Filtrar por Empresa
        cy.get('#selectEmpresa.filter-select').select('1');

        // 3. Filtrar por Tipo de Documento
        cy.get('#selectTipoDocumento.filter-select').select('Cédula de Ciudadanía').should('have.value', 'CedulaCiudadania'); 

        // 4. Filtrar por Estado (Activo)
        cy.get('.sectionStatusFilter').contains('Activo').click();

    })

    it.skip("Ingresar reporte y estadisticas", () =>{
             cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('royib51906@filipx.com')
        cy.get('input[type="password"]')
            .type('GGX}Jh5i')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Ingresar a reporte y estadísticas
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Reporte y Estadísticas').first().click({force : true})
        cy.get('.button-generar-reporte-estadisticas').click({force : true})
        cy.get('.tabla-datos-estadisticas').get('.tabla-fila-estadisticas').first().click({force : true})
        cy.get('.button-filtro-reporte-estudiantes').click({force : true})
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').first().find('input[type="text"]').type('A')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(1).find('input[type="text"]').type('G')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(2).find('input[type="text"]').type('12344567890')
        cy.contains('.filtro-opcion-estudiantes', 'Activo').click({force: true})
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(4).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').eq(5).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-estudiantes').find('.filtro-grupo-estudiantes').get('.filtro-botones-estudiantes').find('button', 'Limpiar').click({force : true})
        cy.get('.tabla-datos-estudiantes').get('.tabla-fila-estudiantes').first().click({force : true})
        cy.get('.container-tabla-estudiantes').get('.button-generar-reporte-estudiantes').click({force : true})

        //eficiencia
        cy.get('.container-tabla-estudiantes').get('.button-eficiencia-estudiantes').click({force : true})
        cy.get('.container-tabla-eficiencia').get('.button-filtro-reporte-eficiencia').click({force : true})
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').first().find('input[type="text"]').type('A')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(1).find('input[type="text"]').type('n')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(2).find('input[type="text"]').type('1234567890')
        cy.contains('.filtro-opcion-eficiencia', 'Activo').first().click(6,0,{force: true})
        cy.contains('.filtro-boton-pequeno-eficiencia', 'Actividades Faltantes').first().click(6,0,{force: true})
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').eq(5).find('input[type="number"]').type('2')
        cy.get('.filtro-menu-eficiencia').find('.filtro-grupo-eficiencia').get('.filtro-botones-eficiencia').find('button', 'Limpiar').click({force : true})
        cy.get('.tabla-datos-eficiencia').get('.tabla-fila-eficiencia').first().click({force : true})
        cy.get('.container-tabla-eficiencia').get('.button-generar-reporte-eficiencia').click({force : true})
        cy.get('.button-volver-eficiencia').click({force : true})
        cy.get('.button-volver-estudiantes').click({force : true})
   })

})
    



        



