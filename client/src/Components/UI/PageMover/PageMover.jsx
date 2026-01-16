import "./PageMover.css"

export const PageMover = ({max=1, value=1, next, prev}) => {
	return (
		<div className="page-mover-container">
			<button
				className="page-move-button"
				onClick={() => {
					if (value > 1)
						prev()
				}}
			>&#9664;</button>
			<span className="page-mover-label">{value}/{max}</span>
			<button
				className="page-move-button"
				onClick={() => {
					if (value < max)
						next()
				}}
			>&#9654;</button>
		</div>
	)
}