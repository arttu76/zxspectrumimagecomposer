import { ExtendedWindow, Layer, Undefinable } from "../types";

export const getWindow = () => window as unknown as ExtendedWindow;

export const getUuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
    safeZero(layer.height) * getOriginalAspectRatio(layer)
);

export const getHeightForAspectRatio = (layer: Layer): number => Math.round(
    safeZero(layer.width) / getOriginalAspectRatio(layer)
);

const colors = {
    normal: [
        [0, 0, 0],
        [27, 0, 216],
        [214, 0, 4],
        [214, 0, 217],
        [30, 223, 8],
        [42, 219, 217],
        [216, 221, 10],
        [217, 217, 217]
    ],
    bright: [
        [0, 0, 0],
        [31, 0, 254],
        [248, 0, 9],
        [242, 0, 245],
        [36, 255, 4],
        [49, 255, 255],
        [252, 255, 9],
        [255, 255, 255]
    ]
};
export const spectrumColor: Readonly<typeof colors> = colors;
