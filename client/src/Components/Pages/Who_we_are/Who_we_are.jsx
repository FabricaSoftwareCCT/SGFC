import { Footer } from "../../Layouts/Footer/Footer";
import { Main } from "../../Layouts/Main/Main";
import ilustration_01 from "../../../assets/Ilustrations/Frame01.svg";
import "./Who_we_are.css";
import { Header } from "../../Layouts/Header/Header";

export const Who_we_are = () => {
  return (
    <>
      <Header />
      <Main>
        <picture className="ilustration_who">
          <img
            className="image_who"
            src={ilustration_01}
            alt="ilustration 01"
          />
        </picture>
        <section className="container_description_who">
          <h1 className="title_who">
            ¿Quiénes <span className="span_somos">somos</span>?
          </h1>
          <p className="description_who">
            <b>SGFC – Sistema de Gestión de Formación Complementaria</b> es una solución tecnológica desarrollada en la Fábrica de Software del SENA, sede Centro de Comercio y Turismo.

            <br /><br />Este proyecto nace con el propósito de digitalizar y modernizar la gestión académica de los cursos complementarios que ofrece el SENA en alianza con el sector empresarial, facilitando procesos como la programación, asignación de instructores, seguimiento de aprendices y control documental.

            <br /><br />Nuestro compromiso es aportar al mejoramiento continuo de la formación para el trabajo, impulsando una experiencia más eficiente, transparente y colaborativa entre todos los actores del ecosistema formativo.
          </p>
        </section>
      </Main>
      <Footer />
    </>
  );
};
