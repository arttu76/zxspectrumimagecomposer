import { ExtendedWindow, Grid, Layer, Nullable, Rgb, ToolType, Undefinable } from "../types";
import { getGrowableGridData } from "./growableGridManager";

export const getWindow = () => window as unknown as ExtendedWindow;

export const getSourceRgb = (layer: Layer, x: number, y: number, currentTool: ToolType): Nullable<Rgb> => {
    const win = getWindow();
    if (!win || !win._imageData) {
        return null;
    }

    const { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, x, y);
    const layerOffset = (layerX + layerY * safeZero(layer.originalWidth)) * 3;

    return (
        typeof win?._imageData[layer.src] === 'object'
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
            win?._imageData[layer.src][layerOffset],
            win?._imageData[layer.src][layerOffset + 1],
            win?._imageData[layer.src][layerOffset + 2]
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
export const safeZero = (value: Undefinable<number>) => safe(value, 0);
export const safeOne = (value: Undefinable<number>) => safe(value, 1);

export const limit8Bit = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export const clampOneZero = (value: number) => Math.max(0, Math.min(1, value));

export const rangeExclusive = (maxValueExclusive: number, callback: (value: number) => void) => {
    for (let i = 0; i < maxValueExclusive; i++) {
        callback(i);
    }
}

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
