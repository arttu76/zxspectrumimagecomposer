import * as R from 'ramda';
import { ExtendedWindow, Grid, Layer, LocalStorageKeys, Nullable, Percentage, Rgb, State, ToolType, Undefinable } from "../types";
import { getGrowableGridData } from "./growableGridManager";

export const getWindow = () => window as unknown as ExtendedWindow;

export const persistStateImageMaskData = (state: State) => {
    const win = getWindow();
    localStorage.setItem(LocalStorageKeys.state, JSON.stringify(state));
    localStorage.setItem(LocalStorageKeys.imageData, JSON.stringify(win._imageData));
    localStorage.setItem(LocalStorageKeys.maskData, JSON.stringify(win._maskData));
}
export const restoreStateImageMaskData = (): State | undefined => {
    const win = getWindow();

    win._imageData = {};
    win._maskData = {};
    localStorage.getItem(LocalStorageKeys.imageData) && (win._imageData = JSON.parse(localStorage.getItem(LocalStorageKeys.imageData) || '{}'));
    localStorage.getItem(LocalStorageKeys.maskData) && (win._maskData = JSON.parse(localStorage.getItem(LocalStorageKeys.maskData) || '{}'));

    win.adjustedPixels = {};
    win.pixels = {};
    win.attributes = {};

    const state = JSON.parse('' + localStorage.getItem(LocalStorageKeys.state)) as Undefinable<State> || undefined;

    // remove unused image data and/or mask data
    if (state) {
        const layerIds = state.layers.layers.map(layer => layer.id);

        Object.keys(win._imageData).forEach(key => {
            if (!layerIds.includes(key)) {
                delete win._imageData[key];
            }
        });

        Object.keys(win._maskData).forEach(key => {
            if (!layerIds.includes(key)) {
                delete win._maskData[key];
            }
        });
    }

    return JSON.parse('' + localStorage.getItem(LocalStorageKeys.state)) as Undefinable<State> || undefined;
}

export const getSourceRgb = (layer: Layer, x: number, y: number, currentTool: ToolType = ToolType.nudge): Nullable<Rgb> => {
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
            currentTool === ToolType.mask
            || !getGrowableGridData(win._maskData[layer.id], layerX, layerY)
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

export const rangeExclusive = (maxValueExclusive: number): number[] => R.range(0, maxValueExclusive);

export const applyRangeExclusive = (maxValueExclusive: number, callback: (value: number) => void) => {
    for (let i = 0; i < maxValueExclusive; i++) {
        callback(i);
    }
}

export const applyRange2DExclusive = (maxOuterExclusive: number, maxInnerExclusive: number, callback: (outer: number, inner: number) => void) => {
    applyRangeExclusive(maxOuterExclusive, (outer) => {
        applyRangeExclusive(maxInnerExclusive, (inner) => {
            callback(outer, inner);
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
    const layerOffsetX = Math.floor((x - layer.x) * (safeZero(layer.originalWidth) / safeOne(layer.width)));
    const layerOffsetY = Math.floor((y - layer.y) * (safeZero(layer.originalHeight) / safeOne(layer.height)));

    let layerX = layerOffsetX - safeZero(layer.originalWidth) / 2;
    let layerY = layerOffsetY - safeZero(layer.originalHeight) / 2;

    if (layer.rotate) {
        const radians = layer.rotate * -0.0174533;
        let rotatedX = layerX * Math.cos(radians) - layerY * Math.sin(radians);
        let rotatedY = layerX * Math.sin(radians) + layerY * Math.cos(radians);
        layerX = rotatedX;
        layerY = rotatedY;
    }

    return {
        layerX: Math.floor(safeZero(layer.originalWidth) / 2 + layerX),
        layerY: Math.floor(safeZero(layer.originalWidth) / 2 + layerY)
    }
}

export const booleanOrNull = (value: Nullable<boolean>): boolean | null => value === null ? null : value;
