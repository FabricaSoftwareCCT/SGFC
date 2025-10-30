describe('Gestion de Actas', ()=>{
    it.skip('Gestionar acta de concertación', ()=>{
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

        //Entrar a Gestión de Actas
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Actas').first().click({force:true})

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

        //Ingresar credenciales del rol administrador
        cy.get('input[type="email"]').first()
            .type('administrador@gmail.com')
        cy.get('input[type="password"]')
            .type('Admin1234*')
            
        //Iniciar sesión
        cy.get(".button_register").click()

        // Click forzado en el botón Gestiones
        cy.get('.container_options').get('.gestiones').first().click({force:true})

        //Entrar a Gestión de Actas
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Actas').first().click({force:true})

        //Visualizar Acta
        cy.get('.resultTableGestionsCompany').find('.Contenedor-emojis').get('img[alt="ver"]').first().click({force:true})

        //Verificar que el acta se visualice correctamente
        cy.contains('a', 'Acta').click({force:true})
    })
    
    it.skip('Cambiar estado de acta',()=>{
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

        //Entrar a Gestión de Actas
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Actas').first().click({force:true})

        //Visualizar Acta
        cy.get('.resultTableGestionsCompany').find('.Contenedor-emojis').get('img[alt="ver"]').first().click({force:true})

        //cambiar estado y Guardar
        cy.get('.selectEstadoActa').eq(0).select('Aprobada')
        cy.contains('button', 'Guardar Estado').click({force:true})
        const estados = ['pendiente', 'aprobada', 'rechazada'];
  
        estados.forEach(estado => {cy.contains('p.statusOptionActas', estado).click()
        cy.wait(1000); 
        })
    })

    it('Generar Acta de Lugar de Formación', ()=>{
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

        //Entrar a Gestión de Actas
        cy.get('.dropdown-gestiones').contains('button', 'Gestión de Actas').first().click({force:true})

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
})
