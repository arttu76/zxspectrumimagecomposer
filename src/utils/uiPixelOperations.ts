import { BrushShape, Layer, Nullable, Rgb, SourceImageCoordinate, SpectrumPixelCoordinate, ToolType, XY } from "../types";
import { spectrumColor } from "./colors";
import { isMaskSet } from "./maskManager";
import { applyRange2DExclusive, bias, dotProduct, getLayerXYFromScreenCoordinates, getWindow, safeDivide, toFromVector } from "./utils";

const maskColor: Rgb = [255, 75, 0];

export const getBackgroundValue = (x: number, y: number): number => {
    return 128
        + Math.floor(((x / 8) + Math.floor((y / 8) % 2)) % 2) * 64
        + (x + y % 2) % 2 * 34;
}

export const replaceEmptyWithBackground = (source: Nullable<Rgb>, x: number, y: number, backgroundColor: number): Rgb => {
    if (source) {
        return source;
    }

    if (backgroundColor < 0) {
        const bg = getBackgroundValue(x, y);
        return [bg, bg, bg];
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
        return source;
    }

    return isMaskSet(layer, x, y, true)
        ? [
            Math.round(maskColor[0] * 0.8 + source[0] * 0.2),
            Math.round(maskColor[1] * 0.8 + source[1] * 0.2),
            Math.round(maskColor[2] * 0.8 + source[2] * 0.2),
        ]
        : source;
}

export const addAttributeGridUi = (attributeGridOpacity: number, rgb: Rgb, x: number, y: number): Rgb => {
    if (attributeGridOpacity === 0) {
        return rgb;
    }

    const evenX = (x % 16 < 8);
    const evenY = (y % 16 < 8);
    const target = ((evenX && !evenY) || (!evenX && evenY)) ? 255 : 0;

    const inverseAttributeGridOpacity = 1 - attributeGridOpacity;
    const grid = target * attributeGridOpacity;

    return [
        Math.round(rgb[0] * inverseAttributeGridOpacity + grid),
        Math.round(rgb[1] * inverseAttributeGridOpacity + grid),
        Math.round(rgb[2] * inverseAttributeGridOpacity + grid)
    ];

}

// return LAST (the most bottom-right) coordinate first for performance reasons
export const getCoordinatesCoveredByCursor = (
    tool: ToolType,
    brushShape: BrushShape,
    brushSize: number,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate
): XY<SpectrumPixelCoordinate>[] => {

    // no cursor
    if (
        tool === ToolType.nudge ||
        tool === ToolType.export
    ) {
        return [];
    }

    const result: XY<SpectrumPixelCoordinate>[] = [];

    const finalizeResults = (coords: XY<SpectrumPixelCoordinate>[]) => coords
        .filter(xy => xy.x > -1 && xy.x < 256 && xy.y > -1 && xy.y < 192)
        .sort((a, b) => a.y !== b.y ? b.y - a.y : b.x - a.x);

    // attribute block cursor
    if (
        tool === ToolType.attributes
        || (
            tool === ToolType.mask
            && brushShape === BrushShape.attributeSquare
        )
    ) {
        applyRange2DExclusive(192, 256, (yAttempt, xAttempt) => {
            if (
                Math.floor(xAttempt / 8) === Math.floor(x / 8)
                && Math.floor(yAttempt / 8) === Math.floor(y / 8)
            ) {
                result.push({ x: xAttempt, y: yAttempt });
            }
        });
        return finalizeResults(result);
    }

    if (brushSize === 1) {
        return [{ x, y }];
    }
    if (brushSize === 2) {
        return finalizeResults([
            { x, y },
            { x: x + 1, y },
            { x, y: y + 1 },
            { x: x + 1, y: y + 1 }
        ]);
    }

    const halfSize = brushSize / 2;

    applyRange2DExclusive(192, 256, (yAttempt, xAttempt) => {
        if (
            xAttempt < (x - halfSize)
            || xAttempt > (x + halfSize)
            || yAttempt < (y - halfSize)
            || yAttempt > (y + halfSize)
        ) {
            return;
        }

        const xDiff = xAttempt - x;
        const yDiff = yAttempt - y;

        if (
            brushShape === BrushShape.circle
                ? Math.sqrt(xDiff * xDiff + yDiff * yDiff) * 1.1 < halfSize
                : Math.abs(xDiff) < halfSize && Math.abs(yDiff) < halfSize
        ) {
            result.push({ x: xAttempt, y: yAttempt });
        }
    });

    return finalizeResults(result);
}

// specifically for mask tool
export const getCoordinatesCoveredByCursorInSourceImageCoordinates = (
    brushShape: BrushShape,
    brushSize: number,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    layer: Layer
): XY<SourceImageCoordinate>[] => {
    if (!layer || !layer.originalWidth || !layer.originalHeight) {
        return [];
    }

    if (brushShape === BrushShape.circle) {
        const cursorInSourceImage = getLayerXYFromScreenCoordinates(layer, x, y);
        const scaledBrushSize = safeDivide(brushSize * layer.originalWidth, layer.width);
        const halfSize = scaledBrushSize / 2;
        const result: XY<SourceImageCoordinate>[] = [];
        applyRange2DExclusive(scaledBrushSize, scaledBrushSize, (yOffset, xOffset) => {
            const xAttempt = cursorInSourceImage.x - halfSize + xOffset;
            const yAttempt = cursorInSourceImage.y - halfSize + yOffset;

            if (
                xAttempt < 0
                || yAttempt < 0
                || xAttempt >= layer.originalWidth!
                || yAttempt >= layer.originalHeight!
            ) {
                return;
            }

            const xDiff = xAttempt - cursorInSourceImage.x;
            const yDiff = yAttempt - cursorInSourceImage.y;
            if (Math.sqrt(xDiff * xDiff + yDiff * yDiff) * 1.1 < halfSize) {
                result.push({ x: Math.round(xAttempt), y: Math.round(yAttempt) });
            }
        });

        return result;
    }

    const getSourceImageCoordinatesByBoxCorners = (
        maxBrush: number, // don't process whole image unneccessarily
        northWestCorner: XY<SourceImageCoordinate>,
        northEastCorner: XY<SourceImageCoordinate>,
        southEastCorner: XY<SourceImageCoordinate>,
        southWestCorner: XY<SourceImageCoordinate>
    ): XY<SourceImageCoordinate>[] => {
        const ab = toFromVector(northEastCorner, northWestCorner);
        const bc = toFromVector(southEastCorner, northEastCorner);
        const cd = toFromVector(southWestCorner, southEastCorner);
        const da = toFromVector(northWestCorner, southWestCorner);

        const result: XY<SourceImageCoordinate>[] = [];
        const cursorInSourceImage = getLayerXYFromScreenCoordinates(layer, x, y);
        applyRange2DExclusive(maxBrush, maxBrush, (yOffset, xOffset) => {
            const p: XY<number> = {
                x: Math.round(cursorInSourceImage.x - maxBrush / 2 + xOffset),
                y: Math.round(cursorInSourceImage.y - maxBrush / 2 + yOffset)
            };
            if (
                dotProduct(ab, toFromVector(p, northWestCorner)) > 0
                && dotProduct(bc, toFromVector(p, northEastCorner)) > 0
                && dotProduct(cd, toFromVector(p, southEastCorner)) > 0
                && dotProduct(da, toFromVector(p, southWestCorner)) > 0
            ) {
                result.push(p);
            }
        });
        return result;
    }

    if (brushShape === BrushShape.block) {
        const halfBrushSize = brushSize / 2;
        return getSourceImageCoordinatesByBoxCorners(
            Math.max(
                safeDivide(brushSize * layer.originalWidth, layer.width),
                safeDivide(brushSize * layer.originalHeight, layer.height)
            ),
            getLayerXYFromScreenCoordinates(layer, x - halfBrushSize, y - halfBrushSize),
            getLayerXYFromScreenCoordinates(layer, x + halfBrushSize, y - halfBrushSize),
            getLayerXYFromScreenCoordinates(layer, x + halfBrushSize, y + halfBrushSize),
            getLayerXYFromScreenCoordinates(layer, x - halfBrushSize, y + halfBrushSize)
        );
    }

    if (brushShape === BrushShape.attributeSquare) {
        const attrXStart = Math.floor(x / 8) * 8 - 1;
        const attrXEnd = attrXStart + 8 + 1;
        const attrYStart = Math.floor(y / 8) * 8 - 1;
        const attrYEnd = attrYStart + 8 + 1;

        return getSourceImageCoordinatesByBoxCorners(
            // brush size is 8 because brush is attribute-block sized
            Math.max(
                safeDivide(16 * layer.originalWidth, layer.width),
                safeDivide(16 * layer.originalHeight, layer.height)
            ),
            getLayerXYFromScreenCoordinates(layer, attrXStart, attrYStart),
            getLayerXYFromScreenCoordinates(layer, attrXEnd, attrYStart),
            getLayerXYFromScreenCoordinates(layer, attrXEnd, attrYEnd),
            getLayerXYFromScreenCoordinates(layer, attrXStart, attrYEnd)
        );

    }

    return [];
}

export const addMouseCursor = (
    rgb: Rgb,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    coordinatesCoveredByCursor: XY<SpectrumPixelCoordinate>[]
): Rgb => {
    if (!coordinatesCoveredByCursor.length) {
        return rgb;
    }

    const xy = coordinatesCoveredByCursor[coordinatesCoveredByCursor.length - 1];

    if (xy.x === x && xy.y === y) {
        coordinatesCoveredByCursor.pop();
        return [
            bias(maskColor[0], rgb[0], 0.66),
            bias(maskColor[1], rgb[1], 0.66),
            bias(maskColor[2], rgb[2], 0.66)
        ];
    }

    return rgb;
}
