import { rangeExclusive } from "../utils/utils";
import { Button } from "./CustomElements";

export const ColorsIndexPicker: React.FC<{
    colors: number[];
    chooseColors: (colors: number[]) => void;
}> = ({ colors, chooseColors }) => {

    const isColorSelected = (colorIndex: number) => (colors || []).includes(colorIndex);

    const toggleColor = (colorIndex: number) => {
        const newColors = isColorSelected(colorIndex)
            ? (colors || []).filter(c => c !== colorIndex)
            : [...(colors || []), colorIndex];

        if (newColors.length > 1) {
            chooseColors(newColors);
        }
    }

    const setAllOn = () => {
        chooseColors(rangeExclusive(8));
    }

    return <>
        <div className="ColorsPicker">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(c => <div
                key={c}
                onClick={() => toggleColor(c)}
                className={`color color${c}${isColorSelected(c) ? ' selected' : ''}`}
            >{c}</div>
            )}
        </div>
        {(colors || []).length < 3 && <div className="ColorsPicker ColorsPickerWarning">
            <br />
            <div>At least 2 colors must be selected</div>
        </div>}
        {(colors || []).length < 7 && <div className="ColorsPicker ColorsPickerAll">
            <br />
            <Button tooltip="Allow dithering to use all Spectrumcolors"
                onClick={setAllOn}>Choose all colors</Button>
        </div>}

    </>
}
