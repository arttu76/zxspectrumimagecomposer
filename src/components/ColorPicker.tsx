import "../styles/ColorPicker.scss";
import { Color } from "../types";
import { spectrumColor } from "../utils/colors";
import { ColorComponentPicker } from "./ColorComponentPicker";
import { ColorsIndexPicker } from "./ColorsIndexPicker";
import { Button, Input } from "./CustomElements";
import { Group } from "./Group";

export const ColorPicker: React.FC<{
    title: string;
    // for picking one color with ink, paper and brightness
    color?: Color;
    allowInvert?: boolean;
    chooseColor?: (color: Color) => void;
    // for picking one or multiple inks
    colors?: number[];
    chooseColors?: (colors: number[]) => void;
}> = ({ title, color, chooseColor, allowInvert, colors, chooseColors }) => {

    const swapColors = () => {
        chooseColor!({ ...color!, ink: color!.paper, paper: color!.ink });
    }

    return <>
        {color && chooseColor && <Group title={title}>
            <div className="ColorPicker">
                <div className="ColorItem">
                    <div>Ink:</div>
                    <ColorComponentPicker
                        colorComponent={color.ink}
                        bright={color?.bright || false}
                        chooseColorComponent={colorComponent => chooseColor({ ...color, ink: colorComponent })}
                    />
                </div>
                {color && allowInvert && <Button
                    className="ColorPickerSwapButton"
                    icon="swap_horiz"
                    tooltip="Swap paper and ink (z)"
                    onClick={swapColors} />}
                <div className="ColorItem">
                    <div>Paper:</div>
                    <ColorComponentPicker
                        colorComponent={color?.paper}
                        bright={color?.bright || false}
                        chooseColorComponent={colorComponent => chooseColor({ ...color, paper: colorComponent })}
                    />
                </div>
                <div className="ColorItem">
                    <div>Bright:</div>
                    <div className="ColorItemCheckbox">
                        <div className="ColorSample"
                            style={{
                                "color": "rgb(" + (color.bright ? spectrumColor.bright : spectrumColor.bright)[color.ink].join(',') + ")",
                                "backgroundColor": "rgb(" + (color.bright ? spectrumColor.bright : spectrumColor.bright)[color.paper].join(',') + ")"
                            }}>Sample</div>
                        <Input
                            tooltip={!!color?.bright ? 'Target bright colors' : 'Target normal colors'}
                            type="checkbox"
                            checked={color?.bright}
                            onClick={() => chooseColor({ ...color, bright: !color.bright })}
                        />
                    </div>
                </div>
            </div >
        </Group>}
        {colors && chooseColors && <Group title={title}>
            <div className="ColorPicker ColorsIndexPicker">
                <div className="ColorItem">
                    <ColorsIndexPicker
                        colors={colors}
                        chooseColors={colors => chooseColors(colors)}
                    />
                </div>
            </div >
        </Group>}
    </>
}