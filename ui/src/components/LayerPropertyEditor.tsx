import '../styles/LayerPropertyEditor.scss'

import { Layer } from "../types";

export const LayerPropertyEditor: React.FC<{
	layer: Layer;
	fieldName: keyof Layer;
	change: (action: any, fieldName: keyof Layer, value: number | boolean) => void;
	min: number;
	max: number;
	title: string;
	reset?: number;
	extra?: string;
}> = ({ layer, fieldName, change, min, max, title, reset, extra }) => {
	const value = parseInt(layer[fieldName] as string, 10);
	if (isNaN(value)) {
		return <div></div>;
	}

	const changeValue = (newValue: string | number) =>
		change(layer, fieldName, parseInt('' + newValue, 10) || 0);

	return (
		<div className="LayerPropertyEditor">
			<span style={{ display: "inline-block", width: "75px" }}>
				{title}:
			</span>
			<input
				size={5}
				type="text"
				value={value}
				onChange={(e) => changeValue(e.target.value)}
			/>{" "}
			<button onClick={() => changeValue(value - 8)}>-8</button>
			<button onClick={() => changeValue(value - 1)}>-1</button>
			<button onClick={() => changeValue(value + 1)}>+1</button>
			<button onClick={() => changeValue(value + 8)}>+8</button>
			<input
				style={{ width: "200px" }}
				type="range"
				min={min}
				max={max}
				value={value}
				onChange={(e) => changeValue(e.target.value)}
			/>
			{reset ? (
				<button onClick={() => changeValue(reset)}>reset</button>
			) : (
				""
			)}
			{extra ? " " + extra : ""}
		</div>
	);
};
