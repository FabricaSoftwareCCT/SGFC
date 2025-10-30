describe ("Prueba instructor", () => {
      it.skip ("Inicio sesión de instructor y ver curso", ()=>{
        cy.visit ('http://localhost:5173/')

        //Ingresar como instructor
        cy.get ('.button_signIn').first().click({force : true}).get('.content_createAccount')
        cy.get('.form_register').first().find('input[type="email"]').first().type('wayasa2839@dwakm.com')
        cy.get('.password-container').first().find('input[type="password"]').first().type('gkiBvZ0?')
        cy.get('.button_register').click({force : true})   
    })

    it.skip("Seleccionar el modulo de cursos y ver mis cursos", ()=>{
        cy.visit("http://localhost:5173/")
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        //Ingresar al modulo de cursos
        cy.get('.courses-menu').get('.courses').first().click({force:true})

        //Entrar a los cursos
        cy.get('.courses-menu').find('.dropdown-courses').contains('button','Mis cursos').first().click({force:true})
    })

    it.skip('Buscar Cursos', ()=>{
        cy.visit("http://localhost:5173/")
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol instrcutor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
            
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
        cy.get('.options_Search').find('input[type="text"]').type('FRONTEND')
    })

    it.skip('buscar un curso y ver detalles', ()=>{
        cy.visit("http://localhost:5173/")
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales del rol instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
            
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
        cy.get('.options_Search').find('input[type="text"]').type('FRONTEND')

        //Ingresar a curso
        cy.get('.carousel-wrapper').find('.carousel-card-search-course').first().click({force:true})

        //ver fechas de inicio y fin del curso
        cy.get('.calendar-btn').first().click({force:true})
        cy.get('.container_return_EditCalendar button.closeModal').click();
        cy.get('.action-buttons').find('.material-btn').click({force:true}) 
        cy.get('.material-container-c').find('.btn-back-c').contains('button', 'Volver al Curso').click({force:true})
    })

    it.skip('Ver y crear material de apoyo', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Volver a dar click en cursos pero ahora dandole click a la opción de Material de Apoyo
        cy.get('.container_options').get('.courses-menu').contains('button', 'Cursos').first().click({force : true})
        cy.get('.dropdown-courses').contains('button', 'Material de Apoyo').first().click({force : true})
        cy.get('.cursos-section').get('.curso-card').first().click({force : true})
        cy.get('.upload-btn').click()

        // Obtener los botones de opciones
        cy.get('.status-btn').should('have.length', 3);

        // Recorrer las tres opciones
        const opciones = ['PDF', 'Video', 'Enlace'];
    
        opciones.forEach((opcion, index) => {
        // Hacer clic en cada opción
        cy.get('.status-btn').eq(index)
            .click()
            .should('have.class', 'selected')
            .and('contain', opcion);})
        cy.get('.inputFilterOptionText').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ') 
        cy.get('.modal-bodyUpdateInstructor').find('.upload-btn').first().click({force:true})
        cy.get('.material-link').contains('https://www.youtube.com/watch?v=dQw4w9WgXcQ').click()
        cy.get('.btn-eliminar').first().click({force:true})
    })

    it.skip('Criterios de Certificación', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Cursos
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force:true})

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.container_options').contains('button', 'Criterios de certificación').first().click({force:true})

        //Ver criterios de un curso
        cy.contains('button', 'Ver criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})
        
        //Agregar Criterios
        cy.contains('button', '+').click()
        cy.get('.new-criteria-space').find('input[placeholder="Añadir un titulo"]').type('Actividades de aprendizaje')
        cy.get('.criteria-head').find('.select-criteria-type').click()
        cy.contains('button', 'Actividades').click()
        cy.get('input[placeholder="0"]').first().clear().type('80')
        cy.get('input[placeholder="0"]').eq(1).clear().type('100')

        //Guardar Criterio
        cy.get('.modal-background').contains('button', 'Guardar').click({force:true})

        //Añadir descripción al criterio y guardar
        cy.get('.criteria-data').find('textarea[placeholder="Añadir una descripción..."]').type('El participante debe cumplir con el 80% de asistencias para certificar el curso.')
        cy.get('.end-button').contains('button', 'Guardar').click({force:true})
    })

    it.skip('Editar criterios de certificación', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force:true})

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.container_options').contains('button', 'Criterios de certificación').first().click({force:true})

        
        //Ver criterios de un curso
        cy.contains('button', 'Ver criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})
        cy.contains('button', 'Editar').first().click({force:true})
        cy.get('textarea.description-edition.criteria-description').first().clear().type('Nueva descripción editada para el primer criterio')
        cy.get('.buttons-right').contains('button', 'Guardar').first().click({force:true})
    })

    it.skip('Filtrar criterios de certificación y descargar criterios', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.courses-menu').contains('button', 'Cursos').first().click({force:true})

        //Entrar a Gestión de Criterios de Certificación
        cy.get('.container_options').contains('button', 'Criterios de certificación').first().click({force:true})

         //Ver criterios de un curso
        cy.contains('button', 'Ver criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})

        //Filtrar criterios
        cy.contains('button', 'Filtrar').click({force:true})
        cy.get('input[placeholder="Nombre..."]').first().type('Asistencias')
        cy.get('button[id="filtrar-button"').click({force:true})
        cy.contains('button', 'Filtrar').click({force:true})
        cy.contains('button', 'Descargar').click({force:true})

        //Generar Reporte
        cy.get('.modal-background').contains('button', 'Generar reporte').click({force:true})
        cy.get('.modal-background').contains('a', 'Descargar').click({force:true})
    })

    it.skip('Ir al modulo de Mis Actas', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de gestor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.gestiones').contains('a', 'Mis Actas').first().click({force:true})

    })

    it.skip('Generar Actas', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.gestiones').contains('a', 'Mis Actas').first().click({force:true})

        //Generar Acta
        cy.get('.button-proceedings-generar').first().click({force:true})

        //Seleccionar Acta
        cy.get('.container-modal-acta').get('.option-1Acta').click()

        //Editar Acta
        cy.get('.botones-solicitud-proceedings').find('button[id="editar1"]').click({force:true})

        //Rellenar campos del acta
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre de la entidad"]').type('Entidad de Prueba')
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Ciudad"]').type('Armenia')
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Sede, modalidad"]').type('Virtual')
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del coordinador académico"]').type('Rodolfo Pérez')
        cy.contains('button', '+ Agregar instructor').click({force:true})
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del instructor participante"]').type('Antonio Gómez')
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre del curso"]').type('Gestión de Proyectos')
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre instructor asignado"]').type('Patricia Ramírez')
        
        //Ingresar Fechas
        cy.get('.input-solicitud-date-proceedings').first().type('2025-10-29');
        cy.get('.input-solicitud-date-proceedings').eq(1).type('2025-10-30')

        //Ingresar Horas
        cy.get('.input-solicitud-time-proceedings').first().type('08:00');
        cy.get('.input-solicitud-time-proceedings').eq(1).type('13:00');

        //Seleccionar Modalidad
        cy.get('.input-solicitud-select-proceedings').select('Virtual')

        //Agregar Participantes
        cy.contains('button', '+ Agregar participante').click()
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Nombre participante"]').type('Laura Martínez')

        //Seguir con el resto de campos
        cy.get('.textarea-proceedings').first().clear().type('Nuevas notas relevantes para el curso.')
        cy.get('.textarea-proceedings').eq(1).clear().type('Condiciones especiales actualizadas:{enter}• Sala virtual para 3 personas{enter}• Material 48 horas antes')

        //Agregar firmas
        const personas = ['Patricia Ramírez', 'Rodolfo Pérez', 'Antonio Gómez', 'Laura Martínez'];
  
        personas.forEach(persona => {
        cy.contains('td', persona).parent('tr').within(() => {cy.contains('button', 'Agregar firma').click();});
        cy.wait(5000);
        cy.get('.submit-button-proceedings-firmar').click();
        cy.wait(1000); // Esperar entre firmas
        })

        cy.get('.submit-button-proceedings').contains('button', 'Guardar').click({force:true})
        cy.get('.submit-button-proceedings').contains('button', 'Generar acta').click({force:true})
    })

    it.skip('Visualizar acta de concertación', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de intstructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})


        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.gestiones').contains('a', 'Mis Actas').first().click({force:true})


        //Visualizar Acta
        cy.get('.resultTableGestionsCompany').find('.Contenedor-emojis').get('img[alt="ver"]').first().click({force:true})

        //Verificar que el acta se visualice correctamente
        cy.contains('a', 'Acta').click({force:true})
    })

    it.skip('generar acta de luga de formación', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        // Click forzado en el botón Gestiones
        cy.get('.container_options').find('.gestiones').contains('a', 'Mis Actas').first().click({force:true})

        //Generar Acta
        cy.get('.button-proceedings-generar').first().click({force:true})

        //Seleccionar Acta
        cy.get('.container-modal-acta').get('.option-2Acta').click()

        //Editar Acta
        cy.get('.training-place-proceeding-submit-button').contains('button', 'Editar').click({force:true})

        //Rellenar campos del acta
        cy.get('.training-place-proceeding-input').get('input[placeholder="Dirección completa del lugar"]').type('Calle 123 #45-67')
        cy.get('.training-place-proceeding-input').get('input[placeholder="Número de personas que puede albergar"]').type('15')
        cy.get('.training-place-proceeding-input').get('input[placeholder="Descripción de las instalaciones disponibles"]').type('Descripción')
        cy.contains('button', '+ Agregar').click()
        cy.get('.input-solicitud-proceedings').get('input[placeholder="Recurso disponible (ej. equipos, mobiliario, conectividad, etc.)"]').type('Computadores y proyector')

        cy.get('.training-place-proceeding-input').get('textarea[id="observaciones-inspeccion"]').type('Observaciones de prueba para el acta de lugar de formación.')
        cy.get('.training-place-proceeding-input').get('textarea[id="documentos-respaldo"]').type('Observaciones de prueba para el acta de lugar de formación.')
        cy.get('.training-place-proceeding-input').get('input[placeholder="Nombre del Inspector"]').type('Edgar Hincapié')

        //Agregar firma
        cy.contains('button', 'Agregar firma').click()       
        cy.wait(5000);
        cy.get('.submit-button-proceedings-firmar').click();
        cy.wait(1000);

        //Guardar y Generar Acta
        cy.get('.training-place-proceeding-submit-button').contains('button', 'Guardar').click({force:true})
        cy.get('.training-place-proceeding-submit-button').contains('button', 'Generar acta').click({force:true})
    })

    it('Cerrar sesión instructor', ()=>{
        cy.visit("http://localhost:5173/") 
        cy.get(".button_signIn").first().click({force : true})

        //Ingresar credenciales con el rol de instructor
        cy.get('input[type="email"]').first()
            .type('wayasa2839@dwakm.com')
        cy.get('input[type="password"]')
            .type('gkiBvZ0?')
       
         //Iniciar sesión
        cy.get(".button_register").click({force:true})

        //Cerrar sesión
        cy.get('.container_options_profile').find('img[alt="Cerrar sesión"]').first().click({force : true})
    })
})
