import { useEffect, useState } from "react";
import "./CourseList.css"
import defaultCourseImage from '../../../assets/Ilustrations/f3.jpg'

export const CourseList = ({cursos, loading, onChange}) => {
	const [current, setCurrent] = useState(0);
	const [direction, setDirection] = useState("next");

	useEffect(() => {
		onChange(current)
	}, [current])

	const next = () => {
        setDirection("next");
        setCurrent((prev) => (prev + 1) % cursos.length);
    };

    const prev = () => {
        setDirection("prev");
        setCurrent((prev) => (prev - 1 + cursos.length) % cursos.length);
    };

    const getCursoAt = (indexOffset) => {
        const index = (current + indexOffset + cursos.length) % cursos.length;
        return cursos[index];
    };

	return (
		<div className="cursos-list-container">
			{loading ? (
				<p className="no-results">Cargando cursos...</p>
			) : cursos.length === 0 ? (
				<p className="no-results">No hay cursos disponibles</p>
			) : (
				<>
					{cursos.length > 1 && (
						<button className="arrow-courses left" onClick={prev}>
							❮
						</button>
					)}

					<div className="carousel-container-courses">
						<div
							key={current}
							className={`carousel-track-courses animate-${direction}`}
						>
							{[getCursoAt(-1), getCursoAt(0), getCursoAt(1)].map(
								(curso, idx) => (
									<div
										key={`${curso?.id || curso?.ID}-${current}`}
										className={`carousel-card-courses ${idx === 1
											? "card-center-courses animate-card"
											: "card-side-courses"
											}`}
									>
										<div className="imagen-curso">
											<img
												src={
													curso?.imagen
														? `data:image/jpeg;base64,${curso.imagen}`
														: defaultCourseImage
												}
												alt={curso?.nombre_curso}
											/>
											{idx === 1 && (
												<div className="overlay-course-info">
													<h3>{curso?.nombre_curso}</h3>
													<p><strong>Ficha:</strong> {curso?.ficha}</p>
												</div>
											)}
										</div>
									</div>
								)
							)}
						</div>
					</div>

					{cursos.length > 1 && (
						<button className="arrow-courses right" onClick={next}>
							❯
						</button>
					)}
				</>
			)}
		</div>
	)
}