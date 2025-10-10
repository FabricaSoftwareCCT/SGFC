import { useNavigate } from "react-router-dom"
import "./GoBackArrow.css"

export const GoBackArrow = () => {
	const navigate = useNavigate()
	return (
		<button
			className="go-back-arrow-flying"
			onClick={() => navigate(-1)}
		>
			&larr;
		</button>
	)
}