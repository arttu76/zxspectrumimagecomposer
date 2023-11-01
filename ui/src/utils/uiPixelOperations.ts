import { BrushShape, Layer, Nullable, Rgb, SpectrumPixelCoordinate, ToolType } from "../types";
import { spectrumColor } from "./colors";
import { isMaskSet } from "./maskManager";
import { bias, getWindow } from "./utils";

export const replaceEmptyWithBackground = (source: Nullable<Rgb>, x: number, y: number, backgroundColor: number): Rgb => {
    if (source) {
        return source;
    }

    if (backgroundColor < 0) {
        const base = 128
            + Math.floor(((x / 8) + Math.floor((y / 8) % 2)) % 2) * 64
            + (x + y % 2) % 2 * 34;
        return [base, base, base];
    }

    return spectrumColor.normal[backgroundColor];
}

export const addMaskUiToLayer = (source: Rgb, layer: Nullable<Layer>, toolType: ToolType, x: number, y: number): Rgb => {

    if (
        toolType !== ToolType.mask
        || !layer
        || !getWindow()?._maskData
        || !getWindow()?._maskData[layer.id]
    ) {
        return [...source];
    }

    return isMaskSet(layer, x, y, true)
        ? [
            Math.round(255 * 0.8 + source[0] * 0.2),
            Math.round(0 * 0.8 + source[1] * 0.2),
            Math.round(0 * 0.8 + source[2] * 0.2),
        ]
        : [...source];
}

export const addAttributeGridUi = (attributeGridOpacity: number, rgb: Rgb, x: number, y: number): Rgb => {
    if (attributeGridOpacity === 0) {
        return [...rgb];
    }

    const evenX = (x % 16 < 8);
    const evenY = (y % 16 < 8);
    const target = ((evenX && !evenY) || (!evenX && evenY)) ? 255 : 0;

    return [
        Math.round(rgb[0] * (1 - attributeGridOpacity) + target * attributeGridOpacity),
        Math.round(rgb[1] * (1 - attributeGridOpacity) + target * attributeGridOpacity),
        Math.round(rgb[2] * (1 - attributeGridOpacity) + target * attributeGridOpacity)
    ];

}


export const addMouseCursor = (
    rgb: Rgb,
    tool: ToolType,
    brushShape: BrushShape,
    brushSize: number,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    mouseX: SpectrumPixelCoordinate,
    mouseY: SpectrumPixelCoordinate
): Rgb => {

    // no cursor
    if (
        tool === ToolType.nudge
    ) {
        return [...rgb];
    }

    // attribute block cursor
    if (tool === ToolType.attributes) {
        return (
            Math.floor(x / 8) === Math.floor(mouseX / 8)
            && Math.floor(y / 8) === Math.floor(mouseY / 8)
        ) ? rgb.map(c => bias(c, 255 - c, 0.25)) as Rgb
            : [...rgb];
    }

    const xDiff = x - mouseX;
    const yDiff = y - mouseY;
    const halfSize = brushSize / 2;

    if (
        mouseX < (x - halfSize)
        || mouseX > (x + brushSize)
        || mouseY < (y - brushSize)
        || mouseY > (y + brushSize)
    ) {
        return [...rgb];
    }

    const isInside = brushShape === BrushShape.circle
        ? Math.sqrt(xDiff * xDiff + yDiff * yDiff) < halfSize
        : Math.abs(xDiff) < halfSize && Math.abs(yDiff) < halfSize;

    return isInside
        ? rgb.map(c => bias(c, 255 - c, 0.25)) as Rgb
        : [...rgb];
}
