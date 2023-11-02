import { ExtendedWindow, Keys, Layer, SourceImageCoordinate, Undefinable } from '../types';
import { getLayerXYFromScreenCoordinates, getWindow, safeZero } from './utils';

const withMaskCoordinates = <T>(
    layer: Layer,
    x: number,
    y: number,
    spectrumScreenCoordinates: boolean,
    func: (win: ExtendedWindow, offset: number, bit: number, layerX: SourceImageCoordinate, layerY: SourceImageCoordinate) => T
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
        return func(win, offset, bit, layerX, layerY);
    }

    const { win, offset, bit } = confirmMask(layer, x, y);
    return func(win, offset, bit, x, y);
}

export const confirmMask = (layer: Layer, x: number = 0, y: number = 0) => {
    const rowWidth = Math.ceil(layer.originalWidth! / 16);
    const bit = x % 16;
    const offset = y * rowWidth + (x - bit) / 16;
    const correctArraySize = rowWidth * layer.originalHeight!;

    const win = getWindow();
    if (!win[Keys.maskData]) {
        win[Keys.maskData] = {};
    }
    const maskData = win[Keys.maskData][layer.id];
    if (!maskData || maskData.length < correctArraySize) {
        win[Keys.maskData][layer.id] = new Uint16Array(correctArraySize).fill(0);
    }

    return { win, offset, bit };
}
export const isMaskSet = (layer: Layer, x: number, y: number, spectrumScreenCoordinates: boolean): boolean => {
    return withMaskCoordinates(
        layer,
        x,
        y,
        spectrumScreenCoordinates,
        (win, offset, bit, layerX, layerY) => (
            layerX >= 0
            && layerY >= 0
            && layerX < safeZero(layer.originalWidth)
            && layerY < safeZero(layer.originalHeight)
            && (!!((win[Keys.maskData][layer.id][offset] >>> bit) & 1) || false)
        )
    ) || false; // in case mask does not exit
}

export const setMask = (layer: Layer, x: number, y: number, value: boolean, spectrumScreenCoordinates: boolean): void => {
    withMaskCoordinates<void>(
        layer,
        x,
        y,
        spectrumScreenCoordinates,
        (win, offset, bit, layerX, layerY) => (
            layerX >= 0
            && layerY >= 0
            && layerX < safeZero(layer.originalWidth)
            && layerY < safeZero(layer.originalHeight)
            && (
                value
                    ? win[Keys.maskData][layer.id][offset] |= 1 << bit
                    : win[Keys.maskData][layer.id][offset] &= ~(1 << bit)
            )
        )
    );
}

export const mutateMask = (layer: Layer, modificationFunc: (value: boolean) => boolean) => {

    const { win } = confirmMask(layer);

    win[Keys.maskData][layer.id] = win[Keys.maskData][layer.id].map((value: number) => {
        let newValue = 0;
        for (let j = 0; j < 16; j++) {
            if (modificationFunc(!!((value >> j) & 1))) {
                newValue |= (1 << j);
            }
        }
        return newValue;
    });

}