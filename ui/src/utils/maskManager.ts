import { ExtendedWindow, Layer, Undefinable } from '../types';
import { getLayerXYFromScreenCoordinates, getWindow } from './utils';

const withMaskCoordinates = <T>(
    layer: Layer,
    x: number,
    y: number,
    spectrumScreenCoordinates: boolean,
    func: (win: ExtendedWindow, offset: number, bit: number) => T
): Undefinable<T> => {
    if (
        !layer?.loaded
        || !layer.originalHeight
        || !layer.originalWidth
    ) {
        return undefined;
    }

    if (spectrumScreenCoordinates) {
        const { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, x, y);
        const { win, offset, bit } = confirmMask(layer, layerX, layerY);
        return func(win, offset, bit);
    }

    const { win, offset, bit } = confirmMask(layer, x, y);
    return func(win, offset, bit);
}

export const confirmMask = (layer: Layer, x: number = 0, y: number = 0) => {
    const rowWidth = Math.ceil(layer.originalWidth! / 16);
    const bit = x % 16;
    const offset = y * rowWidth + (x - bit) / 16;
    const correctArraySize = rowWidth * layer.originalHeight!;

    const win = getWindow();
    if (!win._maskData) {
        win._maskData = {};
    }
    const maskData = win._maskData[layer.id];
    if (!maskData || maskData.length < correctArraySize) {
        win._maskData[layer.id] = new Uint16Array(correctArraySize).fill(0);
    }

    return { win, offset, bit };
}
export const isMaskSet = (layer: Layer, x: number, y: number, spectrumScreenCoordinates: boolean): boolean => {
    return withMaskCoordinates(
        layer,
        x,
        y,
        spectrumScreenCoordinates,
        (win, offset, bit) => (!!((win._maskData[layer.id][offset] >>> bit) & 1) || false)
    ) || false; // in case mask does not exit
}

export const setMask = (layer: Layer, x: number, y: number, value: boolean, spectrumScreenCoordinates: boolean): void => {
    withMaskCoordinates<void>(
        layer,
        x,
        y,
        spectrumScreenCoordinates,
        (win, offset, bit) => value
            ? win._maskData[layer.id][offset] |= 1 << bit
            : win._maskData[layer.id][offset] &= ~(1 << bit)
    );
}

export const mutateMask = (layer: Layer, modificationFunc: (value: boolean) => boolean) => {

    const { win } = confirmMask(layer);

    win._maskData[layer.id] = win._maskData[layer.id].map((value: number) => {
        let newValue = 0;
        for (let j = 0; j < 16; j++) {
            if (modificationFunc(!!((value >> j) & 1))) {
                newValue |= (1 << j);
            }
        }
        return newValue;
    });

}