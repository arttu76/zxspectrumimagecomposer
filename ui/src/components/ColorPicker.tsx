import "../styles/ColorPicker.scss";
import { Color } from "../types";
import { spectrumColor } from "../utils/colors";
import { ColorComponentPicker } from "./ColorComponentPicker";
import { ColorsIndexPicker } from "./ColorsIndexPicker";
import { Input } from "./CustomElements";
import { LayerProperyGroup } from "./LayerPropertyGroup";

export const ColorPicker: React.FC<{
    title: string;
    // for picking one color with ink, paper and brightness
    color?: Color;
    chooseColor?: (color: Color) => void;
    // for picking one or multiple inks
    colors?: number[];
    chooseColors?: (colors: number[]) => void;
}> = ({ title, color, chooseColor, colors, chooseColors }) => <>
    {color && chooseColor && <LayerProperyGroup title={title}>
        <div className="ColorPicker">
            <div className="ColorItem">
                <div>Ink:</div>
                <ColorComponentPicker
                    colorComponent={color.ink}
                    bright={color?.bright || false}
                    chooseColorComponent={colorComponent => chooseColor({ ...color, ink: colorComponent })}
                />
            </div>
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
    </LayerProperyGroup>}
    {colors && chooseColors && <LayerProperyGroup title={title}>
        <div className="ColorPicker">
            <div className="ColorItem">
                <ColorsIndexPicker
                    colors={colors}
                    chooseColors={colors => chooseColors(colors)}
                />
            </div>
        </div >
    </LayerProperyGroup>}
</>