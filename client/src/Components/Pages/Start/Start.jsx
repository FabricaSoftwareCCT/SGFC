import { Header } from "../../Layouts/Header/Header";
import { Main } from "../../Layouts/Main/Main";
import { Footer } from "../../Layouts/Footer/Footer";
import ilustration_01 from "../../../assets/Ilustrations/Frame01.svg";

import "./Start.css";

export const Start = ({ setShowSignIn, setShowSignUp, setShowModalGeneral }) => {
  return (

    <div className="start">
      <Header
        setShowSignIn={setShowSignIn}
        setShowSignUp={setShowSignUp}
        setShowModalGeneral={setShowModalGeneral}
      />
      <Main>
        <div className="container_description">
          <h1>
            Sistema de Gestión de
            <br />
            <span className="complementary">Formación Complementaria</span>
          </h1>
          <p>
            Bienvenido al  <b>SGFC – Sistema de Gestión de Formación Complementaria
            </b>, una plataforma digital diseñada para facilitar la planificación, solicitud y seguimiento de cursos complementarios entre el SENA y el sector productivo.

            <br /><br />Aquí podrás explorar la oferta formativa disponible, solicitar capacitación para equipos de trabajo, consultar el avance de los cursos, generar reportes y gestionar todo el proceso de formación desde un entorno centralizado, ágil y seguro.

            <br /><br />SGFC promueve el fortalecimiento del talento humano mediante el uso de herramientas tecnológicas que optimizan la interacción entre instituciones educativas y empresas.
          </p>
        </div>
        <div className="container_ilustrationStart">
          <img src={ilustration_01} alt="" />
        </div>
      </Main>
      <Footer />
    </div>

  );
};
