
describe('Prueba manager', () => {
  // Limpiar sesiones antes de todas las pruebas
before(() => {
  Cypress.session.clearAllSavedSessions();
});

// Función para iniciar sesión como manager
const loginManager = () => {
  cy.visit('http://localhost:5173/');
  cy.get('.button_signIn').first().click({ force: true });
  
  // Ingresar credenciales del rol manager
  cy.get('input[type="email"]').first()
    .type('joanfernandez@gmail.com');
  cy.get('input[type="password"]')
    .type('Prueba1234*');
    
  // Iniciar sesión
  cy.get('.button_register').click();

  // Rellenar datos de perfil manager (si es necesario)
  cy.url().then((url) => {
    if (url.includes('/profile') || url.includes('/perfil')) {
      cy.get('.container_profile').find('input[name="nombres"]').first().type('Juan Carlos');
      cy.get('.container_profile').find('input[name="apellidos"]').first().type('Pérez Gómez');
      cy.get('.container_profile').find('input[name="celular"]').first().type('5551234567');

      // Rellenar datos de la empresa
      cy.get('.container_data').find('input[name="Empresa.direccion"]').first().type('Calle Falsa 123');
      cy.get('.container_data').find('input[name="Empresa.telefono"]').first().type('5559876544');
      cy.get('.container_data').find('input[name="Empresa.email_empresa"]').first().type('mactech@gmail.com');
      cy.get('.container_data').find('input[name="Empresa.categoria"]').first().type('Tecnología');
      cy.get('select[name="departamento"]').select('Quindío');
      cy.get('select[name="ciudad"]').select('Armenia');
      cy.get('.name_company').find('input[name="Empresa.nombre_empresa"').type('MacTech Solutions');
      cy.get('.name_company').find('input[name="Empresa.NIT"').type('900123455');
      cy.get('select[name="estado"]').select('Activo');
      cy.get('.updateProfile1').click();
    }
  });
  
  // Esperar a que la redirección se complete
  cy.url().should('include', 'http://localhost:5173/');
};

// Configuración de la sesión antes de cada prueba
beforeEach(() => {
  cy.session('manager', loginManager, {
    validate: () => {
      // Verificar que la sesión sigue activa
      cy.visit('http://localhost:5173/');
      // Verificar que estamos autenticados
      cy.get('.container_options_profile').should('exist');
      
      // Volver a la página principal para no interferir con las pruebas
      cy.visit('http://localhost:5173/');
    },
    cacheAcrossSpecs: false
  });
  
  // Visitar la página después de restaurar la sesión
  cy.visit('http://localhost:5173/');
});

  it.skip('Ingresar al modulo de cursos y luego a la sección de Mis cursos', () => {
    cy.visit("http://localhost:5173/Cursos/MisCursos");
    
    //Entrar a un curso asignado
    cy.get('.course-card-carousel').click({force : true});
  });

  it.skip('Seleccionar buscar cursos', () => {
    // Visitar directamente la página de búsqueda de cursos
    cy.visit("http://localhost:5173/Cursos/BuscarCursos");
    
    //Usar Filtros de Buscar Cursos
    cy.get('.search-input-container').find('input[placeholder="¿Qué curso estás buscando?"]').type('Analisis y Desarrollo de Software');

    cy.get('.filter-select').eq(1).select('Cerrada').wait(1000);
    cy.get('.filter-select').eq(0).select('En oferta').wait(1000);
  });

  it.skip('Solicitar Curso', () => {
    // Ingresar al modulo de cursos
    cy.get('.courses-menu .courses').first().click({ force: true });

    cy.get('.courses-menu').find('.dropdown-courses').contains('button', 'Solicitar curso').first().click({ force: true });

    // Editar formulario de solicitud de curso
    cy.contains('button', 'Editar').click({ force: true });

    cy.get('input[placeholder="Nombre del curso"]').clear().type('Curso de Prueba Automatizado');
    cy.get('input[placeholder="número"]').type('10');

    // Ingresar Fechas
    cy.get('.input-solicitud-date').first().type('2025-10-30');
    cy.get('.input-solicitud-date').eq(1).type('2025-11-10');

    // Guardar solicitud
    cy.get('.botones-solicitud').contains('button', 'Guardar').click({ force: true });

    // Enviar solicitud
    cy.get('.botones-solicitud').contains('button', 'Enviar Solicitud').click({ force: true });
  });

  it.skip('Ingresar a material de apoyo', () => {
    cy.visit("http://localhost:5173/SupportMaterial") 
       
    // Seleccionar el primer curso de la lista
    cy.get('.support-cursos-grid').get('.support-curso-card').first().click({force : true})
  });

  it.skip('Ir al modulo de empleados', () => {
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
  });

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

  it.skip('Inscribir empleado a curso', () => {
    cy.visit("http://localhost:5173/Empleados/InscribirEmpleados")

    //Selecciona empleados
    cy.get('.ie-selection-btn.ie-select-all').click()

    //Sleccionar curso
    cy.get('.ie-course-btn').click()

    cy.get('.radio-container').click()

    //Confirmar inscripción
    cy.contains('button', 'Confirmar Inscripción').click({force : true})
  })  

  it.skip('descargar reporte de empleados', () => {
    cy.visit("http://localhost:5173/Empleados/MisEmpleados")

    cy.get('.report-btn-improved').contains('button','Reporte').first().click({force : true})
  })

  it.skip('Cerrar Sesión', () => {
    cy.visit("http://localhost:5173/") 

        //Cerrar sesión
    cy.get('.svg-inline--fa.fa-right-from-bracket').first().click({force : true})
  });
});