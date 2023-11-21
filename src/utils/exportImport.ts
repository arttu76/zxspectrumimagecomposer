import { Keys, Nullable, State, Undefinable } from "../types";
import { getWindow, showAlert } from "./utils";


export const pack8bit = (values: number[]): string => {
    let result = "";
    for (let i = 0; i < values.length; i += 2) {
        result += String.fromCharCode((values[i] << 8) | (values[i + 1] || 0));
    }
    return result;
}
export function unpack8bit(str: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < str.length; i++) {
        const value = str ? str.charCodeAt(i) : 0;
        result.push(value >> 8);
        result.push(value & 0xFF);
    }
    return result;
}

export const packBoolean = (values: Nullable<boolean>[]): string => {
    let result = "";
    let bit = 0;
    let value = 0;
    for (let i = 0; i < values.length; i++) {
        value |= ((values[i] ? 1 : 0) << bit);
        bit++;
        if (bit === 16) {
            result += String.fromCharCode(value);
            value = 0;
            bit = 0;
        }
    }
    return result;
}

export function unpackBoolean(str: string): boolean[] {
    const result: boolean[] = [];
    for (let i = 0; i < str.length; i++) {
        const value = str.charCodeAt(i);
        for (let bit = 0; bit < 16; bit++) {
            result.push(!!(value >> bit));
        }
    }
    return result;
}


export const saveStateImageMaskPixelAttributeDataToLocalStorage = (state: State): Nullable<string> => {
    try {

        const win = getWindow();
        localStorage.setItem(Keys.state, JSON.stringify(state));

        const packedMaskData = Object.keys(win[Keys.maskData]).reduce(
            (acc, val) => ({
                ...acc, [val]: Array.from(win[Keys.maskData][val]) // Uint16Array to Array thanks to stupid typescript
                    .map(item => String.fromCharCode(item))
                    .join('')
            }),
            {}
        );
        localStorage.setItem(Keys.maskData, JSON.stringify(packedMaskData));

        localStorage.setItem(Keys.manualPixels, JSON.stringify(win[Keys.manualPixels]));
        localStorage.setItem(Keys.manualAttributes, JSON.stringify(win[Keys.manualAttributes]));

        const packedImageData = Object.keys(win[Keys.imageData]).reduce(
            (acc, val) => ({ ...acc, [val]: pack8bit(win[Keys.imageData][val]) }),
            {}
        );
        localStorage.setItem(Keys.imageData, JSON.stringify(packedImageData));

        return null;

    } catch (err) {
        console.log(err);
        return "Unable to save your project - you will not be able to restore your session in case you exit this page."
            + " This usual occurs if your source images are so large that they exceed the maximum size of local storage."
            + " If you have your source images in a safe place, don't worry: just upload the source files - most likely all other"
            + " data (your layers, manually edited pixels etc) are saved."
    }
}

export const restoreStateImageMaskPixelAttributeDataFromLocalStorage = (): State | undefined => {
    const win = getWindow();

    try {
        win[Keys.imageData] = {};
        win[Keys.maskData] = {};
        const packedImageDataJSON = localStorage.getItem(Keys.imageData);
        if (packedImageDataJSON) {
            const parsed = JSON.parse(packedImageDataJSON);
            const keys = Object.keys(parsed);
            win[Keys.imageData] = keys.reduce(
                (acc, val) => ({ ...acc, [val]: unpack8bit(parsed[val]) }),
                {}
            )
        }

        const packedMaskDataJSON = localStorage.getItem(Keys.maskData);
        if (packedMaskDataJSON) {
            const parsed = JSON.parse(packedMaskDataJSON);
            const keys = Object.keys(parsed);
            win[Keys.maskData] = keys.reduce(
                (acc, val) => ({ ...acc, [val]: parsed[val].split('').map((item: string) => item.charCodeAt(0)) }),
                {}
            )
        }

        win[Keys.manualPixels] = JSON.parse(localStorage.getItem(Keys.manualPixels) || '{}');
        win[Keys.manualAttributes] = JSON.parse(localStorage.getItem(Keys.manualAttributes) || '{}');

    } catch (err) {
        console.log(err);
        showAlert('Unable to restore previous session. Sorry about that!');
        localStorage.clear();
        location.reload();
    }

    win[Keys.patternCache] = {};
    win[Keys.adjustedPixels] = {};
    win[Keys.adjustedPixels] = {};
    win[Keys.adjustedSpectrumAttributes] = {};

    return JSON.parse('' + localStorage.getItem(Keys.state)) as Undefinable<State> || undefined;
}

export const saveEverything = (state: State): string => {
    saveStateImageMaskPixelAttributeDataToLocalStorage(state);
    return JSON.stringify({
        [Keys.state]: localStorage.getItem(Keys.state),
        [Keys.imageData]: localStorage.getItem(Keys.imageData),
        [Keys.maskData]: localStorage.getItem(Keys.maskData),
        [Keys.manualPixels]: localStorage.getItem(Keys.manualPixels),
        [Keys.manualAttributes]: localStorage.getItem(Keys.manualAttributes),
    });
}

export const loadEverything = (everything: string): void => {
    try {
        const dump = JSON.parse(everything);
        localStorage.setItem(Keys.state, dump[Keys.state]);
        localStorage.setItem(Keys.imageData, dump[Keys.imageData]);
        localStorage.setItem(Keys.maskData, dump[Keys.maskData]);
        localStorage.setItem(Keys.manualPixels, dump[Keys.manualPixels]);
        localStorage.setItem(Keys.manualAttributes, dump[Keys.manualAttributes]);
        location.reload();
    } catch (err) {
        console.error(err);
        showAlert('Unable to load your project. Sorry about that!');
    }
}
