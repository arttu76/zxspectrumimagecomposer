import { ColorPicker } from "../components/ColorPicker";
import "../styles/ColorPicker.scss";
import { Color } from "../types";

export const InkPaperBrightPicker: React.FC<{
    color: Color;
    chooseColor: (color: Color) => void;
}> = ({ color, chooseColor }) =>
        <div className="InkPaperBrightPicker">

            Ink:
            <ColorPicker
                bright={!!color.bright}
                colorComponent={color.ink || 7}
                chooseColorComponent={ink => chooseColor({ ...color, ink })} />

            <br />
            Paper:
            <ColorPicker
                bright={!!color.bright}
                colorComponent={color.paper || 0}
                chooseColorComponent={paper => chooseColor({ ...color, paper })} />

            <br />
            Bright:
            <input type="checkbox"
                checked={!!color.bright}
                onChange={e => chooseColor({ ...color, bright: e.currentTarget.checked })} />

        </div >

