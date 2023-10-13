import "../styles/ColorPicker.scss";
import { Color } from "../types";
import { spectrumColor } from "../utils/utils";
import { ColorComponentPicker } from "./ColorComponentPicker";
import { Input } from "./CustomElements";
import { LayerProperyGroup } from "./LayerPropertyGroup";

export const ColorPicker: React.FC<{
    title: string;
    color: Color;
    chooseColor: (color: Color) => void;
}> = ({ title, color, chooseColor }) =>
        <LayerProperyGroup title={title}>
            <div className="ColorPicker">
                <div className="ColorItem">
                    <div>Ink:</div>
                    <ColorComponentPicker
                        colorComponent={color?.ink}
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
                                "color": spectrumColor[color.bright ? 'bright' : 'normal'][color.ink],
                                "backgroundColor": spectrumColor[color.bright ? 'bright' : 'normal'][color.paper]
                            }}>
                            Sample
                        </div>
                        <Input
                            tooltip={!!color?.bright ? 'Target bright colors' : 'Target normal colors'}
                            type="checkbox"
                            checked={color?.bright}
                            onClick={() => chooseColor({ ...color, bright: !color.bright })}
                        />
                    </div>
                </div>
            </div >
        </LayerProperyGroup>