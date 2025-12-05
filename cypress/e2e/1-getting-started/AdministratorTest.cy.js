describe('Probar el modulo de administrador', ()=>{
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
    })

    it.skip("Ingresar a mis cursos", ()=>{
        cy.visit("http://localhost:5173/")
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})

        //Recorrer los filtros
        const textosFiltros = ['Todos', 'Finalizados', 'Oferta abierta', 'Oferta cerrada'];
        textosFiltros.forEach((texto) => {
        // Buscar por texto completo del botón
        cy.contains('button', texto).click();
        cy.contains('button', texto).should('have.class', 'active');
        cy.wait(1000);
        });

        //Dar click en Ver cursos Activos
        cy.contains('button','Ver Cursos Activos').click()

        //Dar click en ver en oferta
        cy.contains('button','Ver en oferta').click()

        //Dar click en crear nuevo curso
        cy.contains('button', 'Crear nuevo curso').click()
    })

    it.skip('Buscar cursos', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})
        
        //Volver a dar click en cursos pero ahora dandole click a la opción de buscar cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Buscar cursos').first().click({force:true})

        
        //Usar Filtros de Buscar Cursos
        //Primer filtro - Estado
        cy.get('.filter-select').eq(0).select('Activo').wait(1000)

        // Segundo filtro - Oferta  
       cy.get('.filter-group select').eq(1).select('cerrada').wait(1000)
       cy.get('.filter-group select').eq(0).select('En oferta').wait(1000)

        //Tercer Filtro
        cy.get('.search-input').get('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software')

    })

    it.skip('Crear Curso',()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a dar click en cursos pero ahora dandole click a la opción de Crear cursos
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Crear curso').first().click({force:true})

        //Crear curso
        cy.get('.ficha-container').find('input[placeholder="000000"]').type('2825024')
        cy.contains('label', 'Nombre del Curso').parent('.form-group').find('input').type('Python', { force: true });

        const description = 'A'.repeat(100);
        cy.get('textarea[placeholder="Describe el curso en detalle (mínimo 100 caracteres)"]').type(description);       

        
        cy.contains('button', 'En Oferta').click()
        cy.contains('button', 'Abierta').click()

        cy.get('.info-item').find('input[placeholder="Número de días"]').clear().type('20')
        cy.get('.info-item').find('input[placeholder="Sena Agropecuario"]').type('Virtual')

        cy.get('.schedule-btn').first().click()

        //Ingresar Fechas
        cy.get('.organized-date-inputs').contains('label', 'Fecha inicio:').find('input[type="date"]').eq(0).type('2026-11-20')
        cy.get('.organized-date-inputs').contains('label', 'Fecha fin:').find('input[type="date"]').last().type('2026-11-24')
        
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
      
        //Agregar fecha al temario
        cy.contains('Temario del Curso').parent().find('input[type="date"]').type('2026-11-11');

        //Agregar Temario
        cy.get('textarea[placeholder*="Agregar nuevo tema"]').type('Introducción al curso');
        cy.contains('button','+').click()

        //Guardar curso
        cy.contains('button','Crear Curso').click()
    })

    it.skip('ingresar a las inscripciones de un curso',()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        cy.get('.courses-menu').get('.courses').first().click({force:true})
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})

        //Seleccionar curso
        cy.contains('button','Ver Curso Seleccionado').click()

        //ver inscripciones
        cy.contains('button','Ver Inscripciones').click()
    })

    it.skip('Ingresar a Material de Apoyo',()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a dar click en cursos pero ahora dandole click a la opción de Material de Apoyo
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.support-cursos-grid').get('.support-curso-card').first().click({force : true})
        cy.get('.support-create-btn.outline').click({force:true})

                /// Obtener los botones de opciones
        cy.get('.type-option-support').should('have.length', 3);

        // Recorrer las tres opciones
        const opciones = ['PDF', 'Video', 'Enlace'];

        opciones.forEach((opcion, index) => {
        // Solo hacer clic y verificar texto
        cy.get('.type-option-support').eq(index)
            .click()
            .should('contain', opcion);
        });

        // Solo en la última opción (Enlace) hacer las acciones adicionales
        cy.get('.type-option-support').eq(2).click(); // Asegurar que Enlace está seleccionado
        cy.get('.link-input-support').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        cy.get('.add-link-btn-support').contains('button', 'Agregar').click({force:true});
        cy.contains('button', 'Crear Material').click({force:true});
        cy.contains('button', 'Perfecto').click({force:true});

        // Resto de acciones
        cy.get('.action-btn.edit-btn').first().click({ force: true });
        cy.get('.support-material-input').clear().type('https://www.youtube.com/watch?v=vOzHbrYHpQ0&list=RDvOzHbrYHpQ0&start_radio=1').click();
        cy.get('.action-btn.save-btn').contains('button', 'Guardar').click({ force: true });
        cy.get('.swal2-confirm.centered-swal-button.swal2-styled').contains('button','Entendido').click({ force: true });
        cy.get('.action-btn.delete-btn').first().click({ force: true });
        cy.get('.swal2-confirm.centered-swal-button.swal2-styled').click({ force: true });
    })


    it.skip('Ir a la sección de Gestiones(Crear Instructor)', ()=>{
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
        cy.contains('button','Agregar Instructor').click()
        
        //Llenar datos del instructor
        cy.get('.input-field-create').eq(0).type('Joan');      // Nombres
        cy.get('.input-field-create').eq(1).type('Pérez');     // Apellidos
        cy.get('.input-field-create').eq(2).type('1234567890'); // Cédula
        cy.get('.input-field-create').eq(3).type('Ingeniero de Software'); // Título
        cy.get('.input-field-create').eq(4).type('3001234567'); // Celular
        cy.get('.input-field-create').eq(5).type('joan.perez@example.com'); // Email
        cy.contains('button','Activo').first().click({force:true}) // Estado
        cy.contains('button', 'Crear Instructor').click({force:true}) // Guardar Instructor
    })

    it.skip('Buscar Instructor y Modificar perfil Instructor', ()=>{
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
        cy.get('.search-input').get('input[placeholder="Buscar instructor..."]').type('joan')

        //Ver pefil de un instructor y Editar
        cy.get('.view-profile-btn-improved').first().click({force:true})
        cy.get('.submit-btn-update').contains('button', 'Editar Perfil').click()

        //Modificar datos del instructor
        cy.get('.form-grid-update input[name="nombres"]').clear({ force: true }).type('Joan Esteban', { force: true });
        cy.contains('button','Guardar Cambios').click()
    })

    it.skip('asignar un curso a un instructor desde gestionar instructores',()=>{
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
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.search-row').find('input[placeholder="Buscar por nombre o ficha"]').type('python')
        cy.contains('button','Asignar').first().click()
    })

    it.skip('Eliminar un curso asignado desde gestionar instructores',()=>{
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
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.search-row').find('input[placeholder="Buscar por nombre o ficha"]').type('python')
        cy.get('.asignado-item').contains('button', 'Eliminar').click()
        cy.contains('button','Sí, eliminar').click()
    })

    it.skip('Crear un Gestor', ()=>{
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
        cy.contains('button','Agregar Gestor').click()

        //Llenar datos del gestor
        cy.get('.input-field-create-gestor').eq(0).type('Juana');      // Nombres
        cy.get('.input-field-create-gestor').eq(1).type('Pérez');     // Apellidos
        cy.get('.input-field-create-gestor').eq(2).type('1234567890'); // Cédula
        cy.get('.input-field-create-gestor').eq(3).type('3231234567'); // Celular
        cy.get('.input-field-create-gestor').eq(4).type('juana.perez@example.com'); // Email
       
        cy.get('.status-btn-create-gestor').contains('button','Activo').first().click({force:true}) // Estado

        //Guardar Usuario
        cy.get('button.submit-btn-create-gestor[type="submit"]').click({force: true});
    })

    it.skip('Buscar y Modificar perfil de Gestor', ()=>{
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

        //Buscar Gestor
        cy.contains('button', 'Gestión de Gestores').first().click({force:true})
        cy.get('.gg-input-search').get('input[placeholder="Buscar gestor..."]').type('juana')

        //Ver pefil de un Gestor y Editar
        cy.contains('button','Ver Perfil Completo').first().click({force:true})
        cy.contains('button','Editar Perfil').click()

        //Modificar datos del Gestor
        cy.get('.form-grid-gestor input[name="nombres"]').clear({ force: true }).type('Juana Maria', { force: true });
        cy.contains('button','Guardar Cambios').click({force:true})
    })

    it.skip('Modulo de Criterios de Certificación',()=>{
     // Agregar manejo de errores para excepciones no capturadas
    Cypress.on('uncaught:exception', (err, runnable) => {
        console.error('Excepción no capturada:', err);
        // Retornar false para evitar que Cypress falle la prueba
        return false;
    });
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

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.dropdown-gestiones').contains('button', 'Criterios de certificación').first().click({force:true})

        //Ver criterios de un curso
        cy.get('.criteria-btn-improved.primary').contains('Ver Criterios').click({force: true});
        cy.get('.button.see-criteria-button').contains('button', 'Ver criterios').click({force:true})
        
        //Agregar Criterios
        cy.get('.buttons-right').contains('button', '+').click({force:true})
        cy.get('.new-criteria-space').find('input[placeholder="Añadir un titulo"]').type('Asistencias')
        cy.get('.criteria-head').find('.select-criteria-type').click()
        cy.contains('button', 'Asistencias').click()
        cy.get('input[placeholder="0"]').first().clear().type('80')
        cy.get('input[placeholder="0"]').eq(1).clear().type('100')

        //Guardar Criterio
        cy.get('.modal-background').contains('button', 'Guardar').click({force:true})

        //Añadir descripción al criterio y guardar
        cy.get('.criteria-data').find('textarea[placeholder="Añadir una descripción..."]').type('El participante debe cumplir con el 80% de asistencias para certificar el curso.')
        cy.get('.end-button').contains('button', 'Guardar').click({force:true})
    })

    it.skip('modificar y eliminar criterio de certificación',()=>{
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

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.dropdown-gestiones').contains('button', 'Criterios de certificación').first().click({force:true})
        
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios del curso').first().click({force:true})
        cy.contains('button', 'Editar').first().click({force:true})
        cy.get('textarea.description-edition.criteria-description').first().clear().type('Nueva descripción editada para el primer criterio')
        cy.get('.buttons-right').contains('button', 'Guardar').first().click({force:true})
    })

    it.skip('Filtrado de Criterios de Certificación',()=>{
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

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.dropdown-gestiones').contains('button', 'Criterios de certificación').first().click({force:true})
        
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})

        //Filtrar criterios
        cy.contains('button', 'Filtrar').click({force:true})
        cy.get('input[placeholder="Nombre..."]').first().type('Asistencias')
        cy.get('button[id="filtrar-button"').click({force:true})
        cy.contains('button', 'Filtrar').click({force:true})
        cy.contains('button', 'Descargar').click({force:true})
    })

    it.skip('visitar modulo Gestión de Empresas', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Empresas
        cy.get('.container_options').get('.empresas').first().click({force:true})

    })

    it.skip('Añadir una nueva empresa', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Empresas
        cy.get('.container_options').get('.empresas').first().click({force:true})
        cy.contains('button', 'Añadir Empresa').click({force:true})

        //Llenar datos del manaer
        cy.get('.form-group-dual').find('input[name="email"]').type('manger@gmail.com')
        cy.get('.form-group-dual').find('input[name="password"]').type('Prueba1234*')
        cy.get('.form-group-dual').find('input[name="confirmPassword"]').type('Prueba1234*')

        //Llenar datos de la empresa
        cy.get('.form-group-dual').find('input[name="nombre_empresa"]').type('Tech Solutions')
        cy.get('.form-group-dual').find('input[name="NIT"]').type('900123456')
        cy.get('select[name="categoria"]').select('tecnologia');
        cy.get('.form-group-dual').find('input[name="direccion"]').type('Calle 123 #45-67, Ciudad')
        cy.get('.form-group-dual').find('input[name="telefono"]').type('3001234567')
        cy.get('.form-group-dual').find('input[name="email_empresa"]').type('Techno@gmail.com')
        cy.get('select[name="departamento_ID"]').select('Quindío');
        cy.get('select[name="ciudad_ID"]').select('Armenia');
        cy.get('.form-group-dual').find('textarea[id="descripcion"]').type('Descripción')
        cy.contains('button', 'Crear Empresa y Manager').click({force:true})
    })

    it('Visualizar empresa y manager', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Empresas
        cy.get('.container_options').get('.empresas').first().click({force:true})

        //Buscar Empresa
        cy.get('.search-input-container').find('input[placeholder="Buscar por nombre o NIT..."]').type('Tech Solutions')

        //Agregarle manager a la empresa
        cy.contains('button', 'Manager').first().click({force:true})
        cy.contains('button', 'Editar Perfil').first().click({force:true})

        cy.get('.input-field-manager').get('input[name="nombres"]').clear().type('Carlos Andrés', { force: true });
        cy.get('input[name="apellidos"]').clear().type('Ramírez López', { force: true });
        cy.get('input[name="celular"]').clear().type('3115556677', { force: true });
        cy.get('input[name="documento"]').first().clear().type('1122334455', { force: true });
        cy.get('input[name="email"]').clear().type('carlos.ramirez@example.com', { force: true });

        // 4. Cambiar estado (CORREGIDO - según tu HTML)
        // Opción 1: Si hay botones con texto "Activo" e "Inactivo"
        cy.contains('button', 'Activo').click({force: true});

        // Opción 2: Si es un toggle o radio buttons
        cy.get('.input-group-manager:contains("Estado")')
        .find('button.active, input[value="activo"]')
        .click({force: true});
        
        //Gestionar Empresa 
        cy.contains('button', 'Gestionar').first().click({force:true})
        cy.contains('button', 'Editar Empresa').first().click({force:true})

        //Modificar datos de la empresa
        cy.get('input[name="nombre_empresa"').clear().type('Tech Solutions Updated')

        //Guardar cambios
        cy.contains('button', 'Guardar Cambios').click({force:true})
        
    })

    it('Gestionar Empresa', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Empresas
        cy.get('.container_options').get('.empresas').first().click({force:true})

        //Gestionar Empresa
        cy.contains('button','Gestionar').click()

        //Editar Empresa
        cy.get('.edit-button-updateEmpresa').contains('button', 'Editar Empresa').click()

        //Llenar datos de Empresa
        cy.get('.modal-left-update').find('input[name="nombre_empresa"]').first().type('Mactech')
        cy.get('.modal-left-update').find('input[name="NIT"]').first().type('999999999')
        cy.get('.modal-left-update').find('input[name="categoria"]').first().type('Tecnologia')
        cy.get('select.input_updateData').eq(0).select('Quindío');
        cy.get('select.input_updateData').eq(1).select('Armenia');
        cy.get('.modal-left-update').find('input[name="telefono"]').first().type('1111111111')
        cy.get('.modal-left-update').find('input[name="direccion"]').first().type('dirección falsa')
        cy.get('.modal-left-update').find('input[name="email_empresa"]').first().type('mactech@gmail.com')
        cy.get('.modal-left-update').contains('button','Activo').click()
        cy.get('.modal-right').get('.edit-button-updateEmpresa').contains('button', 'Guardar Cambios').first().click({force:true})
        

    })

    it.skip('Gestión de Empleados', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

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
        cy.get('select[name="empresaId"].empresa-select').select('Tech Solutions - 900123456')
        cy.get('.status-container').find('.status-buttons').contains('button', 'Activo').first().click({force:true})
        cy.get('.save-button').first().click({force:true})

        
    })

    it.skip('Editar Empleado', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

         //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Empleados').first().click({force : true})

        //Actualizar información del empleado
        cy.get('.profile-btn').first().click({force:true})
        cy.get('.edit-button-updateInstructor').first().click({force:true})
        cy.get('.modal-left-update').find('input[type="text"]').clear().first().type('San Martin')
        cy.get('.modal-left-update').find('input[name="apellidos"]').clear().type('De Napolés')
        cy.get('img[alt="Subir documento"]').click()
        cy.get('.custom-dropdown').click();
        cy.contains('.dropdown-option', 'Cédula de ciudadanía').click();
        cy.get('.modal-left-update').find('input[name="documento"]').clear().type(45567867)
        cy.get('.modal-left-update').find('.status-buttons').contains('button', 'activo').first().click({force:true})
        cy.get('.edit-button-updateInstructor').click({force:true})

    })

    it.skip('Gestión de Usuarios', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Usuarios').first().click({force : true})

        //Usar filtro y cambiar rol a un usuario
        cy.get('.filterOptionName').first().find('input[placeholder="Escriba el nombre del usuario"]').type('Joan')
        cy.contains('button', 'Filtrar'). click()
        cy.contains('button', 'Ver usuario').click()
        cy.contains('button', 'Editar usuario').click()
        cy.contains('button','Empresa').click()
        cy.contains('button', 'Guardar Cambios').click()

    })

    it.skip('Reportes y estadisticas',()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //dar click a Gestiones
        cy.get('.container_options').get('.gestiones-menu').contains('button', 'Gestiones').first().click({force : true})
        cy.get('.dropdown-gestiones').contains('button', 'Reporte y Estadísticas').first().click({force : true})

        //Ingresar a un curso
        cy.get('.tabla-fila-estadisticas').first().click({force:true})

        //Generar reporte de estudiantes
        cy.contains('button','Generar reporte')
    })

    it.skip('visitar el historial de cambios', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //dar click a Hisotiral
        cy.get('a[href="/Gestiones/Historial"]').first().click({force:true});
    })

    it.skip('cerrar sesión', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({force : true})
    })

})