
describe('Pruebas de funcionalidad del rol Administrador', () => {
    before(() => {
    Cypress.session.clearAllSavedSessions();
  });
  // Función para iniciar sesión
  const loginAdministrador = () => {
    cy.visit('http://localhost:5173/');
    cy.get('.button_signIn').first().click({ force: true });
    
    // Ingresar credenciales del administrador
    cy.get('input[type="email"]').first().type('administrador@gmail.com');
    cy.get('input[type="password"]').type('Admin1234*');
    
    // Iniciar sesión
    cy.get('.button_register').click();
    
    // Esperar a que la redirección se complete
    cy.url().should('include', 'http://localhost:5173/');
    
  };

  // Configuración de la sesión
  beforeEach(() => {
    cy.session('administrador', loginAdministrador, {
      validate: () => {
        // Verificar que la sesión sigue activa
        cy.visit('http://localhost:5173/');
        
        // Volver a la página principal para no interferir con las pruebas
        cy.visit('http://localhost:5173/');
      },
      cacheAcrossSpecs: false // Mantener sesión entre archivos de prueba
    });
    
    // Visitar la página después de restaurar la sesión
    cy.visit('http://localhost:5173/');
  });


    it.skip('Buscar cursos', ()=>{
        cy.visit("http://localhost:5173/Cursos/BuscarCursos") 
        
        //Usar Filtros de Buscar Cursos
        //Primer filtro - Estado
        cy.get('.filter-select').eq(0).select('Activo').wait(1000)

        // Segundo filtro - Oferta  
       cy.get('.filter-group select').eq(1).select('cerrada').wait(1000)
       cy.get('.filter-group select').eq(0).select('En oferta').wait(1000)

        //Tercer Filtro
        cy.get('.search-input').get('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software')

    })

    it.skip('Crear Curso', () => {
    cy.visit("http://localhost:5173/Cursos/CrearCurso") 
    
    cy.get('.ficha-container').find('input[placeholder="000000"]').type('2825020')
    cy.contains('label', 'Nombre del Curso').parent('.form-group').find('input').type('Gestión de Bases de Dtos', { force: true });

    const description = 'A'.repeat(100);
    cy.get('textarea[placeholder="Describe el curso en detalle (mínimo 100 caracteres)"]').type(description);       

    cy.contains('button', 'En Oferta').click()
    cy.contains('button', 'Abierta').click()

    cy.get('.info-item').find('input[placeholder="Número de días"]').clear().type('20')
    cy.get('.info-item').find('input[placeholder="Sena Agropecuario"]').type('Virtual')

    cy.get('.schedule-btn').first().click()

    cy.get('.date-input-wrapper').find('input[type="date"]').eq(0).type('2026-01-20')
    cy.get('.date-input-wrapper').find('input[type="date"]').last().type('2026-02-24')
    
    const selectTimeSlot = (time, day) => {
        const timeSlots = {
            '06:00': 1, '07:00': 2, '08:00': 3, '09:00': 4, '10:00': 5,
            '11:00': 6, '12:00': 7, '13:00': 8, '14:00': 9, '15:00': 10,
            '16:00': 11, '17:00': 12, '18:00': 13
        }
        
        const days = {
            'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
        }
        
        cy.get('.schedule-section-calendar')
            .find('table tbody tr').eq(timeSlots[time])
            .find('td').eq(days[day])
            .click()
    }

    cy.get('.schedule-section-calendar').then(($section) => {
        const hasTable = $section.find('table').length > 0;
        
        if (hasTable) {
            selectTimeSlot('08:00', 'Lun') 
            selectTimeSlot('08:00', 'Mar') 
            selectTimeSlot('14:00', 'Mié')
        } else {
            cy.get('.schedule-section-calendar').find('*').then(($elements) => {
                const plusElements = $elements.filter((index, el) => {
                    return el.textContent && el.textContent.trim() === '+';
                });
                
                if (plusElements.length >= 3) {
                    cy.wrap(plusElements[0]).click({ force: true });
                    cy.wrap(plusElements[1]).click({ force: true });
                    cy.wrap(plusElements[2]).click({ force: true });
                }
            });
        }
    });

    cy.wait(500);
    
    cy.contains('button','Guardar Horarios').click()
    
    cy.contains('Temario del Curso').parent().find('input[type="date"]').type('2026-11-11');

    cy.get('textarea[placeholder*="Agregar nuevo tema"]').type('Introducción al curso');
    cy.contains('button','+').click()

    cy.contains('button','Crear Curso').click()
    
   
})

it.skip('Crear Curso sin número de ficha', () => {
    cy.visit("http://localhost:5173/Cursos/CrearCurso") 
    
    
    cy.contains('label', 'Nombre del Curso').parent('.form-group').find('input').type('Gestión de Bases de Dtos', { force: true });

    const description = 'A'.repeat(100);
    cy.get('textarea[placeholder="Describe el curso en detalle (mínimo 100 caracteres)"]').type(description);       

    cy.contains('button', 'En Oferta').click()
    cy.contains('button', 'Abierta').click()

    cy.get('.info-item').find('input[placeholder="Número de días"]').clear().type('20')
    cy.get('.info-item').find('input[placeholder="Sena Agropecuario"]').type('Virtual')

    cy.get('.schedule-btn').first().click()

    cy.get('.date-input-wrapper').find('input[type="date"]').eq(0).type('2026-01-20')
    cy.get('.date-input-wrapper').find('input[type="date"]').last().type('2026-02-24')
    
    const selectTimeSlot = (time, day) => {
        const timeSlots = {
            '06:00': 1, '07:00': 2, '08:00': 3, '09:00': 4, '10:00': 5,
            '11:00': 6, '12:00': 7, '13:00': 8, '14:00': 9, '15:00': 10,
            '16:00': 11, '17:00': 12, '18:00': 13
        }
        
        const days = {
            'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
        }
        
        cy.get('.schedule-section-calendar')
            .find('table tbody tr').eq(timeSlots[time])
            .find('td').eq(days[day])
            .click()
    }

    cy.get('.schedule-section-calendar').then(($section) => {
        const hasTable = $section.find('table').length > 0;
        
        if (hasTable) {
            selectTimeSlot('08:00', 'Lun') 
            selectTimeSlot('08:00', 'Mar') 
            selectTimeSlot('14:00', 'Mié')
        } else {
            cy.get('.schedule-section-calendar').find('*').then(($elements) => {
                const plusElements = $elements.filter((index, el) => {
                    return el.textContent && el.textContent.trim() === '+';
                });
                
                if (plusElements.length >= 3) {
                    cy.wrap(plusElements[0]).click({ force: true });
                    cy.wrap(plusElements[1]).click({ force: true });
                    cy.wrap(plusElements[2]).click({ force: true });
                }
            });
        }
    });

    cy.wait(500);
    
    cy.contains('button','Guardar Horarios').click()
    
    cy.contains('Temario del Curso').parent().find('input[type="date"]').type('2026-11-11');

    cy.get('textarea[placeholder*="Agregar nuevo tema"]').type('Introducción al curso');
    cy.contains('button','+').click()

    cy.contains('button','Crear Curso').click()
    
   
})

    it.skip('Ingresar a Material de Apoyo',()=>{
        cy.visit("http://localhost:5173/SupportMaterial") 
       
        // Seleccionar el primer curso de la lista
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
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
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

    it.skip('Ir a la sección de Gestiones(Crear Instructor sin documento)', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        //Agregar Instructor
        cy.contains('button','Agregar Instructor').click()
        
        //Llenar datos del instructor
        cy.get('.input-field-create').eq(0).type('Joan');      // Nombres
        cy.get('.input-field-create').eq(1).type('Pérez');     // Apellidos
        cy.get('.input-field-create').eq(3).type('Ingeniero de Software'); // Título
        cy.get('.input-field-create').eq(4).type('3001234567'); // Celular
        cy.get('.input-field-create').eq(5).type('joan.perez@example.com'); // Email
        cy.contains('button','Activo').first().click({force:true}) // Estado
        cy.contains('button', 'Crear Instructor').click({force:true}) // Guardar Instructor
    })

    it.skip('Buscar Instructor y Modificar perfil Instructor', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
       
        cy.get('.search-input').get('input[placeholder="Buscar instructor..."]').type('joan')

        //Ver pefil de un instructor y Editar
        cy.get('.view-profile-btn-improved').first().click({force:true})
        cy.get('.submit-btn-update').contains('button', 'Editar Perfil').click()

        //Modificar datos del instructor
        cy.get('.form-grid-update input[name="nombres"]').clear({ force: true }).type('Joan Esteban', { force: true });
        cy.contains('button','Guardar Cambios').click()
    })

    it.skip('asignar un curso a un instructor desde gestionar instructores',()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.search-row').find('input[placeholder="Buscar por nombre o ficha"]').type('python')
        cy.contains('button','Asignar').first().click()
    })

    it.skip('Eliminar un curso asignado desde gestionar instructores',()=>{
        cy.visit("http://localhost:5173/Gestiones/Instructor") 
        
        cy.contains('button', 'Ver Perfil Completo').click()
        cy.contains('button', 'Gestionar Cursos').click()
        cy.get('.search-row').find('input[placeholder="Buscar por nombre o ficha"]').type('python')
        cy.get('.asignado-item').contains('button', 'Eliminar').click()
        cy.contains('button','Sí, eliminar').click()
    })

    it.skip('Crear un Gestor', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Gestor") 
    
        //Agregar Gestor
        cy.contains('button','Agregar Gestor').click()

        //Llenar datos del gestor
        cy.get('.input-field-create-gestor').eq(0).type('Juana');      // Nombres
        cy.get('.input-field-create-gestor').eq(1).type('Pérez');     // Apellidos
        cy.get('.input-field-create-gestor').eq(2).type('1234567899'); // Cédula
        cy.get('.input-field-create-gestor').eq(3).type('3231234567'); // Celular
        cy.get('.input-field-create-gestor').eq(4).type('juana.perez@example.com'); // Email
       
        cy.get('.status-btn-create-gestor').contains('button','Activo').first().click({force:true}) // Estado

        //Guardar Usuario
        cy.get('button.submit-btn-create-gestor[type="submit"]').click({force: true});
    })

    it.skip('Buscar y Modificar perfil de Gestor', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Gestor") 
        
        cy.get('.gg-input-search').get('input[placeholder="Buscar gestor..."]').type('juana')

        //Ver pefil de un Gestor y Editar
        cy.contains('button','Ver Perfil Completo').first().click({force:true})
        cy.contains('button','Editar Perfil').click()

        //Modificar datos del Gestor
        cy.get('.form-grid-gestor input[name="nombres"]').clear({ force: true }).type('Juana Maria', { force: true });
        cy.contains('button','Guardar Cambios').click({force:true})
    })

    it.skip('Modulo de Criterios de Certificación',()=>{
        cy.visit("http://localhost:5173/Gestiones/Criterios") 
        
        //Ver criterios de un curso
        cy.get('.criteria-btn-improved.primary').contains('Ver Criterios').click({force: true});
        cy.get('.button.see-criteria-button').contains('button', 'Ver criterios').click({force:true})
        
        //Agregar Criterios
        cy.get('.actions-left').get('.btn-primary').click({force:true})
        cy.get('.criteria-title-input').type('Asistencias')
        cy.get('.type-selector-btn').click()
        cy.contains('button', 'Asistencias').click()
        cy.get('.detail-input-group').get('input[placeholder="0"]').first().clear({force:true}).type('80')
        cy.get('.detail-input-group').get('input[placeholder="0"]').eq(1).clear({force:true}).type('100')

        //Guardar Criterio
        cy.contains('button', 'Confirmar Selección').click({force:true})

        //Añadir descripción al criterio y guardar
        cy.get('.criteria-description').type('El participante debe cumplir con el 80% de asistencias para certificar el curso.')
        cy.contains('button', 'Guardar Criterio').click({force:true})
    })

    it.skip('modificar y eliminar criterio de certificación',()=>{
        cy.visit("http://localhost:5173/Gestiones/Criterios") 
       
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios del curso').first().click({force:true})
        cy.contains('button', 'Modo Edición').first().click({force:true})
        cy.get('textarea.editing-criteria-description').first().clear().type('Nueva descripción editada para el primer criterio')
        cy.get('.btn-primary').contains('button', 'Guardar Cambios').first().click({force:true})
    })

    it.skip('Filtrado de Criterios de Certificación',()=>{
        cy.visit("http://localhost:5173/Gestiones/Criterios") 
       
        //Ver criterios de un curso
        cy.contains('button', 'Ver Criterios').first().click({force:true})
        cy.contains('button', 'Ver criterios').first().click({force:true})

        //Filtrar criterios
        cy.contains('button', 'Filtrar').click({force:true})
        cy.get('input[placeholder="Buscar por nombre..."]').first().type('awegerwherHERH')
        cy.get('.btn-primary').contains('button', 'Aplicar Filtros').click({force:true})
        cy.contains('button', 'Filtrar').click({force:true})
        cy.contains('button', 'Reporte').click({force:true})
    })

    it.skip('visitar modulo Gestión de Empresas', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Empresas") 
        
    })

    it.skip('Añadir una nueva empresa', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Empresas") 
        

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

    it.skip('Visualizar empresa y manager', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Empresas") 
      

        //Buscar Empresa
        cy.get('.search-input-container').find('input[placeholder="Buscar por nombre o NIT..."]').type('Tech Solutions')

        // 1. PRIMERO: Hacer clic para abrir el modal de creación/edición
        cy.contains('button', 'Manager').click({ force: true });
        cy.contains('button', 'Editar Perfil').click({force:true})

        
        // 3. LUEGO: Interactuar con los campos del modal
        cy.get('.input-field-manager').first().should('be.visible').clear().type('Carlos Andrés', { force: true });
        cy.get('.input-field-manager').eq(1).should('be.visible').clear().type('Ramirez López', { force: true });
        cy.get('.input-field-manager').eq(2).should('be.visible').clear().type('11114112', { force: true });
        cy.get('.input-field-manager').eq(3).should('be.visible').clear().type('3114556667', { force: true });;
        cy.get('.input-field-manager').eq(4).should('be.visible').clear().type('carlosramirez23@example.com', { force: true });;

        // 4. Cambiar estado (CORREGIDO - según tu HTML)
        // Opción 1: Si hay botones con texto "Activo" e "Inactivo"
        cy.get('.status-btn-manager').contains('button', 'Activo').click({force: true});
        cy.contains('button','Guardar Cambios').click({force:true})
        
        //Aceptar Cambio
        cy.get('.swal2-confirm.centered-swal-button.swal2-styled').click({force:true})
        
        //Gestionar Empresa 
        cy.contains('button', 'Gestionar').first().click({force:true})
        cy.contains('button', 'Editar Empresa').first().click({force:true})

        //Modificar datos de la empresa
        cy.get('input[name="nombre_empresa"').clear().type('Tech Solutions Updated')

        //Guardar cambios
        cy.contains('button', 'Guardar Cambios').click({force:true})
        
    })

    it.skip('Gestionar Empresa', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Empresas") 
        
        //Gestionar Empresa
        cy.contains('button','Gestionar').click()

        //Editar Empresa
        cy.get('.submit-btn-company').contains('button', 'Editar Empresa').click()

        //Llenar datos de Empresa
        cy.get('.form-section-company').find('input[name="nombre_empresa"]').clear().first().type('Mactech')
        cy.get('.form-section-company').find('input[name="NIT"]').clear().first().type('999999999')
        cy.get('.form-section-company').find('input[name="telefono"]').clear().first().type('1111111111')
        cy.get('.form-section-company').find('input[name="direccion"]').clear().first().type('dirección falsa')
        cy.get('.form-section-company').find('input[name="email_empresa"]').clear().first().type('mactech@gmail.com')
        cy.get('.form-section-company').contains('button','Activo').click()
        cy.contains('button', 'Guardar Cambios').first().click({force:true})
        

    })

    it.skip('Gestión de Empleados', ()=>{
        cy.visit("http://localhost:5173/Empleados/MisEmpleados") 
       
        //Agregar Empleado
        cy.get('.create-employee-btn-improved').click()
        cy.get('.form-grid-create-employe').find('input[name="nombres"]').first().type('Samuel')
        cy.get('.form-grid-create-employe input[name="apellidos"]').first().type('Herrera')
        // Dentro del contenedor específico
        cy.get('.input-field-create-employe').get('select[name="tipoDocumento"]').select('TarjetaIdentidad', { force: true });
        cy.get('.form-grid-create-employe').find('input[name="cedula"]').type(92836422)
        cy.get('.form-grid-create-employe').find('input[name="celular"]').first().type(3234367956)
        cy.get('.form-grid-create-employe').find('input[name="email"]').first().type('samuh679@nrlord.com')
        cy.get('.input-field-create-employe').get('select[name="empresaId"]').select('Mactech', { force: true });
        cy.contains('button', 'Activo').first().click({force:true})
        cy.contains('button', 'Crear Empleado').click({force:true})

        
    })

    it.skip('Editar Empleado', ()=>{
        cy.visit("http://localhost:5173/Empleados/MisEmpleados") 
       
        //Actualizar información del empleado
        cy.get('.profile-btn-improved').first().click({force:true})
        cy.get('.submit-btn-employe').first().click({force:true})
        cy.get('.form-grid-employe').find('input[name="nombres"]').clear().first().type('San Martin')
        cy.get('.form-grid-employe').find('input[name="apellidos"]').clear().type('De Napolés')
        cy.get('.form-grid-employe').find('input[name="documento"]').clear().type(45567867)
        cy.contains('button', 'Guardar Cambios').click({force:true})

    })

    it.skip('Gestión de Usuarios', ()=>{
        cy.visit("http://localhost:5173/Empleados/MisEmpleados") 
       
        //Usar filtro y cambiar rol a un usuario
        cy.get('.input-search-improved').first().type('San Martin')
        cy.contains('button', 'Ver Perfil').click()
        cy.contains('button', 'Editar Perfil').click()
        cy.contains('button', 'Guardar Cambios').click()

    })

    it.skip('Reportes y estadisticas',()=>{
        cy.visit("http://localhost:5173/GestionReporteEstadisticas/ReporteEstadisticas") 

        //Ingresar a un curso
        cy.get('.re-action-button').first().click({force:true})

        //Generar reporte de estudiantes
        cy.contains('button','Generar reporte')
    })

    it.skip('Asistencias y Progreso de Estudiantes',()=>{
        cy.visit("http://localhost:5173/reportes/asistencia-progreso")

        //Filtrar por aprendiz
        cy.get('select').first().select('3')

        //Generar reporte
        cy.contains('button','Generar reporte').click()

        //Descargar reporte
        cy.contains('button','Descargar PDF').click({force:true})
     
    })

    it.skip('visitar el historial de cambios', ()=>{
        cy.visit("http://localhost:5173/Gestiones/Historial") 
    })

    it.skip('cerrar sesión', ()=>{
        cy.visit("http://localhost:5173/") 

        //Cerrar sesión
        cy.get('.svg-inline--fa.fa-right-from-bracket').first().click({force : true})
    })

})

