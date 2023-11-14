import * as R from 'ramda';
import { ExtendedWindow, Grid, Keys, Layer, Nullable, Percentage, Rgb, SourceImageCoordinate, SpectrumPixelCoordinate, State, ToolType, Undefinable, XY } from "../types";
import { isMaskSet } from './maskManager';

export const getWindow = () => window as unknown as ExtendedWindow;

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

export const persistStateImageMaskPixelAttributeData = (state: State) => {
    const win = getWindow();
    localStorage.setItem(Keys.state, JSON.stringify(state));

    const packedImageData = Object.keys(win[Keys.imageData]).reduce(
        (acc, val) => ({ ...acc, [val]: pack8bit(win[Keys.imageData][val]) }),
        {}
    );
    localStorage.setItem(Keys.imageData, JSON.stringify(packedImageData));

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
}

export const restoreStateImageMaskPixelAttributeData = (): State | undefined => {
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
        alert('Unable to restore previous session. Sorry about that!');
        localStorage.clear();
        location.reload();
    }

    win[Keys.patternCache] = {};
    win[Keys.adjustedPixels] = {};
    win[Keys.pixels] = {};
    win[Keys.attributes] = {};

    return JSON.parse('' + localStorage.getItem(Keys.state)) as Undefinable<State> || undefined;
}

export const getSourceRgb = (
    layer: Layer,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    currentTool: ToolType = ToolType.nudge
): Nullable<Rgb> => {
    if (!layer.imageId) {
        return null;
    }

    const win = getWindow();
    if (!win || !win[Keys.imageData]) {
        return null;
    }

    let { x: layerX, y: layerY } = getLayerXYFromScreenCoordinates(layer, x, y);

    if (layer.flipX && layer.originalWidth) {
        layerX = layer.originalWidth - layerX;
    }
    if (layer.flipY && layer.originalHeight) {
        layerY = layer.originalHeight - layerY;
    }

    const layerOffset = (layerX + layerY * safeZero(layer.originalWidth)) * 3;

    return (
        typeof win?._imageData[layer.imageId] === 'object'
        && layer.imageId
        && layer.shown
        && layerX >= 0
        && layerX < safeZero(layer.originalWidth)
        && layerY >= 0
        && layerY < safeZero(layer.originalHeight)
        && (
            currentTool !== ToolType.mask
            || !isMaskSet(layer, layerX, layerY, true)
        )
    )
        ? [
            win?._imageData[layer.imageId][layerOffset],
            win?._imageData[layer.imageId][layerOffset + 1],
            win?._imageData[layer.imageId][layerOffset + 2]
        ] as Rgb
        : null;
}

export const getUuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const debounce = (func: Function, wait: number) => {
    let timeout: Undefinable<ReturnType<typeof setTimeout>>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const safe = (value: Undefinable<Nullable<number>>, fallback: number) => value || fallback;
export const safeZero = (value: Undefinable<Nullable<number>>): number => safe(value, 0);
export const safeDivide = (numerator: Undefinable<Nullable<number>>, denominator: Undefinable<Nullable<number>>): number => safe(numerator, 0) / safe(denominator, 1);

export const bias = (a: number, b: number, bias: Percentage) => a * bias + b * (1 - bias);

export const clamp8Bit = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

export const clampOneZero = (value: number): number => Math.max(0, Math.min(1, value));

export const rangeExclusive = <T = number>(maxValueExclusive: number): T[] => R.range(0, maxValueExclusive) as T[];

export const applyRangeExclusive = <T = number>(maxValueExclusive: number, callback: (value: T) => void) => {
    for (let i = 0; i < maxValueExclusive; i++) {
        callback(i as T);
    }
}

export const applyRange2DExclusive = <T = number>(maxOuterExclusive: number, maxInnerExclusive: number, callback: (outer: T, inner: T) => void) => {
    applyRangeExclusive<T>(maxOuterExclusive, (outer: T) => {
        applyRangeExclusive<T>(maxInnerExclusive, (inner: T) => {
            callback(outer as T, inner as T);
        });
    });
}

export const map2D = <T>(grid: Grid<T>, mapper: (value: T, x: number, y: number) => T): Grid<T> => grid.map((row, y) => row.map((value, x) => mapper(value, x, y)));

export const getOriginalAspectRatio = (layer: Layer): number => safeDivide(layer.originalWidth, layer.originalHeight);

export const getWidthForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.height) * getOriginalAspectRatio(layer)
);

export const getHeightForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.width) / getOriginalAspectRatio(layer)
);


export const dotProduct = (a: XY<number>, b: XY<number>): number => a.x * b.x + a.y * b.y;

export const toFromVector = (a: XY<number>, b: XY<number>): XY<number> => ({ x: a.x - b.x, y: a.y - b.y });

export const getInitialized2DArray = <T>(rows: number, columns: number, initialValue: T): Grid<T> => {
    return Array.from({ length: rows }, () => Array<T>(columns).fill(initialValue));
}

export const getLayerXYFromScreenCoordinates = (layer: Layer, x: SpectrumPixelCoordinate, y: SpectrumPixelCoordinate): XY<SourceImageCoordinate> => {

    const xScale = safeDivide(layer.width, layer.originalWidth);
    const yScale = safeDivide(layer.height, layer.originalHeight);

    let dx = ((x - 256 / 2) - layer.x) / xScale;
    let dy = ((y - 192 / 2) - layer.y) / yScale;

    if (layer.rotate) {
        const radians = layer.rotate * -0.0174533; // Math.PI/180 * -1
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const rotatedX = dx * cos - dy * sin;
        const rotatedY = dx * sin + dy * cos;
        dx = rotatedX;
        dy = rotatedY;
    }

    return {
        x: Math.round(safeZero(layer.width) / 2 + dx),
        y: Math.round(safeZero(layer.height) / 2 + dy)
    }
}

export const booleanOrNull = (value: Nullable<boolean>): boolean | null => value === null ? null : value;
