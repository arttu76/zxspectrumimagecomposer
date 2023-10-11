import { ExtendedWindow, Layer, Undefinable } from "./types";

export const getWindow = () => window as unknown as ExtendedWindow;

export const getJson = async <T>(url: string): Promise<T> => {
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

export const getOriginalAspectRatio = (layer: Layer): number => (
    safeZero(layer.originalWidth) / safeOne(layer.originalHeight)
);

export const getWidthForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.height) / safeOne(layer.originalHeight)
    * getOriginalAspectRatio(layer)
    * safeZero(layer.originalWidth)
);

export const getHeightForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.width) / safeOne(layer.originalWidth)
    * 1 / getOriginalAspectRatio(layer)
    * safeZero(layer.originalHeight)
);
