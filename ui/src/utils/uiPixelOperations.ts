import { BrushShape, Layer, Nullable, Rgb, SourceImageCoordinate, SpectrumPixelCoordinate, ToolType, XY } from "../types";
import { spectrumColor } from "./colors";
import { isMaskSet } from "./maskManager";
import { applyRange2DExclusive, bias, getLayerXYFromScreenCoordinates, getWindow } from "./utils";

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

    // attribute block cursor
    if (tool === ToolType.attributes) {
        applyRange2DExclusive(192, 256, (yAttempt, xAttempt) => {
            if (
                Math.floor(xAttempt / 8) === Math.floor(x / 8)
                && Math.floor(yAttempt / 8) === Math.floor(y / 8)
            ) {
                result.push({ x: xAttempt, y: yAttempt });
            }
        });
        return result;
    }

    if (brushSize === 1) {
        return [{ x, y }];
    }
    if (brushSize === 2) {
        return [
            { x, y },
            { x: x + 1, y },
            { x, y: y + 1 },
            { x: x + 1, y: y + 1 }
        ].filter(xy => xy.x < 256 && xy.y < 192);
    }

    const halfSize = brushSize / 2;

    applyRange2DExclusive(192, 256, (yAttempt, xAttempt) => {
        if (
            xAttempt < (x - halfSize)
            || xAttempt > (x + brushSize)
            || yAttempt < (y - brushSize)
            || yAttempt > (y + brushSize)
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

    return result;
}

export const getCoordinatesCoveredByCursorInSourceImageCoordinates = (coordinates: XY<SpectrumPixelCoordinate>[], layer: Layer): XY<SourceImageCoordinate>[] => {

    const scalerFunction = (xy: XY<SpectrumPixelCoordinate>): XY<SourceImageCoordinate> => {
        const result = getLayerXYFromScreenCoordinates(layer, xy.x, xy.y);
        return {
            x: result.layerX,
            y: result.layerY
        };
    };

    const maxY = coordinates.reduce((acc, val) => Math.max(acc, val.y), -1);
    const yLimitSourceCoordinate: SourceImageCoordinate = scalerFunction({ y: maxY + 1, x: 0 }).y;

    interface CoordinateRow {
        y: number;
        nextY: number;
        minX: number;
        maxX: number;
        lastRow?: boolean;
    }

    const groupedByY = coordinates
        .reduce((acc, val) => {
            if (!acc.length) {
                return [{
                    y: val.y,
                    lastRow: val.y === maxY,
                    nextY: val.y === maxY ? val.y : val.y + 1,
                    minX: val.x,
                    maxX: val.x
                }];
            }
            const lastItem = acc[acc.length - 1];

            return (lastItem.y === val.y)
                ? [
                    ...acc.slice(0, -1),
                    {
                        ...lastItem,
                        maxX: val.x
                    }
                ]
                : [
                    ...acc,
                    {
                        y: val.y,
                        lastRow: val.y === maxY,
                        nextY: val.y === maxY ? val.y : val.y + 1,
                        minX: val.x,
                        maxX: val.x
                    }
                ]
        },
            [] as CoordinateRow[]
        );

    const transformed = groupedByY.map(item => {
        const yMinX = scalerFunction({ y: item.y, x: item.minX });
        const nextYmaxX = scalerFunction({ y: item.nextY, x: item.maxX });
        return {
            y: yMinX.y,
            nextY: item.lastRow ? yLimitSourceCoordinate : nextYmaxX.y,
            minX: yMinX.x,
            maxX: nextYmaxX.x
        }
    });

    const scaled = transformed.reduce((acc, val) => {
        let result = [...acc];
        for (let i = val.y; i < val.nextY; i++) {
            for (let j = val.minX; j < (val.maxX + 1); j++) {
                result.push({
                    y: i,
                    x: j
                });
            }
        }
        return result;
    }, [] as XY<SourceImageCoordinate>[]);

    return scaled;
}

export const addMouseCursor = (
    rgb: Rgb,
    x: SpectrumPixelCoordinate,
    y: SpectrumPixelCoordinate,
    coordinatesCoveredByCursor: XY<SpectrumPixelCoordinate>[]
): Rgb => {
    return coordinatesCoveredByCursor.find(xy => xy.x === x && xy.y === y)
        ? rgb.map(c => bias(c, 255 - c, 0.25)) as Rgb
        : [...rgb];
}
