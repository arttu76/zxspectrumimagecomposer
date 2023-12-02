import * as R from 'ramda';
import { ExtendedWindow, Grid, Keys, Layer, Nullable, Percentage, Rgb, SourceImageCoordinate, SpectrumPixelCoordinate, ToolType, Undefinable, XY } from "../types";
import { isMaskSet } from './maskManager';

export const getWindow = () => window as unknown as ExtendedWindow;

export const resize = () => window.dispatchEvent(new Event('resize'));

export const showAlert = (...message: string[]) => {
    setTimeout(
        () => alert(message.join('\n\n')),
        1
    );
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
