import React from "react";

export const LayerNumberEditor = (props) => {
	const value = parseInt(props.layer[props.fieldName], 10);
	if (isNaN(value)) {
		return <div></div>;
	}

	const change = (newValue) =>
		props.change(props.layer, props.fieldName, parseInt(newValue, 10) || 0);

	return (
		<div>
			<span style={{ display: "inline-block", width: "75px" }}>
				{props.title}:
			</span>
			<input
				size="5"
				type="numeric"
				value={value}
				onChange={(e) => change(e.target.value)}
			/>{" "}
			<button onClick={(e) => change(value - 8)}>-8</button>
			<button onClick={(e) => change(value - 1)}>-1</button>
			<button onClick={(e) => change(value + 1)}>+1</button>
			<button onClick={(e) => change(value + 8)}>+8</button>
			<input
				style={{ width: "200px" }}
				type="range"
				min={props.min}
				max={props.max}
				value={value}
				onChange={(e) => change(e.target.value)}
			/>
			{props.reset ? (
				<button onClick={(e) => props.reset(props.layer)}>reset</button>
			) : (
				""
			)}
			{(props.resetTo || props.resetTo === 0) ? (
				<button onClick={(e) => change(props.resetTo)}>reset</button>
			) : (
				""
			)}

			{props.extra ? " " + props.extra : ""}
		</div>
	);
};
