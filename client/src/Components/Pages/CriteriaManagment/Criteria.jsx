import { useNavigate } from "react-router-dom";
import { Header } from "../../Layouts/Header/Header";
import { useEffect } from "react";
import { Main } from "../../Layouts/Main/Main";

export const CriteriaManagement = () => {
	const navigate = useNavigate()

	const userSession = JSON.parse(localStorage.getItem("userSession")) || JSON.parse(sessionStorage.getItem("userSession"))

	const isLoggedIn = !!userSession
	const accountType = userSession?.accountType || null

	useEffect(() => {
		if (accountType === "Instructor" || accountType == "Administrador") {
			
		} else {
			navigate("/no-autorizado");
		}
	}, [])

	return (
		<>
			<Header/>
			<Main>
				<div>
					<h2>Criterios de <span className="complementary">Certificación</span></h2>
				</div>
			</Main>
		</>
	);
}