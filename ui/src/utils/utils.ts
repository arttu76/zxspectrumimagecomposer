import * as R from 'ramda';
import { ExtendedWindow, Grid, Layer, LocalStorageKeys, Nullable, Percentage, Rgb, SpectrumPixelCoordinate, State, ToolType, Undefinable } from "../types";
import { isMaskSet } from './maskManager';

export const getWindow = () => window as unknown as ExtendedWindow;

const pack = (values: number[]): string => {
    let result = "";
    for (let i = 0; i < values.length; i += 2) {
        result += String.fromCharCode((values[i] << 8) | (values[i + 1] || 0));
    }
    return result;
}
function unpack(str: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < str.length; i++) {
        const value = str ? str.charCodeAt(i) : 0;
        result.push(value >> 8);
        result.push(value & 0xFF);
    }
    return result;
}

export const persistStateImageMaskData = (state: State) => {
    const win = getWindow();
    localStorage.setItem(LocalStorageKeys.state, JSON.stringify(state));
    // localStorage.setItem(LocalStorageKeys.maskData, JSON.stringify(win._maskData));

    const keys = Object.keys(win._imageData);
    const packedImageData = keys.reduce(
        (acc, val) => ({ ...acc, [val]: pack(win._imageData[val]) }),
        {}
    );
    localStorage.setItem(LocalStorageKeys.imageData, JSON.stringify(packedImageData));
}
export const restoreStateImageMaskData = (): State | undefined => {
    const win = getWindow();

    win._imageData = {};
    win._maskData = {};
    const packedImageDataJSON = localStorage.getItem(LocalStorageKeys.imageData);
    if (packedImageDataJSON) {
        const parsed = JSON.parse(packedImageDataJSON);
        const keys = Object.keys(parsed);
        win[LocalStorageKeys.imageData] = keys.reduce(
            (acc, val) => ({ ...acc, [val]: unpack(parsed[val]) }),
            {}
        )
    }
    // localStorage.getItem(LocalStorageKeys.maskData) && (win._maskData = JSON.parse(localStorage.getItem(LocalStorageKeys.maskData) || '{}'));

    win.patternCache = {};
    win.adjustedPixels = {};
    win.pixels = {};
    win.attributes = {};

    return JSON.parse('' + localStorage.getItem(LocalStorageKeys.state)) as Undefinable<State> || undefined;
}

export const getSourceRgb = (
    layer: Layer,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    currentTool: ToolType = ToolType.nudge
): Nullable<Rgb> => {
    const win = getWindow();
    if (!win || !win._imageData) {
        return null;
    }

    let { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, x, y);

    if (layer.flipX && layer.originalWidth) {
        layerX = layer.originalWidth - layerX;
    }
    if (layer.flipY && layer.originalHeight) {
        layerY = layer.originalHeight - layerY;
    }

    const layerOffset = (layerX + layerY * safeZero(layer.originalWidth)) * 3;

    return (
        typeof win?._imageData[layer.id] === 'object'
        && layer.loaded
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
            win?._imageData[layer.id][layerOffset],
            win?._imageData[layer.id][layerOffset + 1],
            win?._imageData[layer.id][layerOffset + 2]
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

export const fetchJson = async <T>(url: string): Promise<T> => {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (err) {
        console.error("Error fetching json: " + err);
        throw err;
    }
}

export const debounce = (func: Function, wait: number) => {
    let timeout: Undefinable<ReturnType<typeof setTimeout>>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const safe = (value: Undefinable<number>, fallback: number) => value || fallback;
export const safeZero = (value: Undefinable<number>): number => safe(value, 0);
export const safeOne = (value: Undefinable<number>): number => safe(value, 1);

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

export const getOriginalAspectRatio = (layer: Layer): number => (
    safeZero(layer.originalWidth) / safeOne(layer.originalHeight)
);

export const getWidthForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.height) * getOriginalAspectRatio(layer)
);

export const getHeightForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.width) / getOriginalAspectRatio(layer)
);

export const getInitialized2DArray = <T>(rows: number, columns: number, initialValue: T): Grid<T> => {
    return Array.from({ length: rows }, () => Array<T>(columns).fill(initialValue));
}

export const getLayerXYFromScreenCoordinates = (layer: Layer, x: number, y: number) => {

    const xScale = safeZero(layer.width) / safeOne(layer.originalWidth);
    const yScale = safeZero(layer.height) / safeOne(layer.originalHeight);

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
        layerX: Math.round(safeZero(layer.width) / 2 + dx),
        layerY: Math.round(safeZero(layer.height) / 2 + dy)
    }
}

export const booleanOrNull = (value: Nullable<boolean>): boolean | null => value === null ? null : value;
