import '../styles/LayerPropertyEditor.scss';

import { Layer } from "../types";
import { Button } from './CustomElements';

export const LayerPropertyEditor: React.FC<{
	layer: Layer;
	fieldName: keyof Layer;
	change: (action: any, fieldName: keyof Layer, value: number | boolean) => void;
	min: number;
	max: number;
	allowOutOfBounds?: boolean; // can adjust value outside of min/max
	title: string;
	reset?: number;
	extra?: string;
}> = ({ layer, fieldName, change, min, max, allowOutOfBounds, title, reset, extra }) => {
	const value = parseInt(layer[fieldName] as string, 10) || 0;

	const changeValue = (newValue: string | number) =>
		change(layer, fieldName, parseInt('' + newValue, 10) || 0);

	return (
		<div className="LayerPropertyEditor">
			<div className="textFields">
				<div>
					{title}:{extra && <span className="extra">{extra}</span>}
				</div>
				<div>
					<Button
						tooltip="Change by -8"
						onClick={() => allowOutOfBounds ? changeValue(value - 8) : changeValue(Math.max(min, value - 8))}>-8</Button>
					<Button
						tooltip="Change by -1"
						onClick={() => allowOutOfBounds ? changeValue(value - 1) : changeValue(Math.max(min, value - 1))}>-1</Button>
					<input
						size={5}
						type="text"
						value={value}
						onChange={(e) => changeValue(e.target.value)}
					/>
					<Button
						tooltip="Change by +1"
						onClick={() => allowOutOfBounds ? changeValue(value + 1) : changeValue(Math.min(max, value + 1))}>+1</Button>
					<Button
						tooltip="Change by +8"
						onClick={() => allowOutOfBounds ? changeValue(value + 8) : changeValue(Math.min(max, value + 8))}>+8</Button>
					{reset !== undefined && <Button
						dimmed={value === reset}
						icon="settings_backup_restore"
						tooltip={`${value !== reset ? 'Reset to' : 'Already at'} ${reset}`}
						onClick={() => changeValue(reset)}
					/>}
				</div>
			</div>
			<div className="range">
				<input
					style={{ width: "200px" }}
					type="range"
					min={min}
					max={max}
					value={value}
					onChange={(e) => changeValue(e.target.value)}
				/>
			</div>
		</div>
	);
};
