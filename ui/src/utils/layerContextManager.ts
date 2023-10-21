import * as R from 'ramda';
import { AttributeImage, BitImage, Color, Grid, Layer, Nullable, PixelationSource, Rgb, ToolType } from '../types';
import { getColorAdjusted, getInverted } from './colors';
import { computeAttributeBlockColor } from './dithering';
import { getInitialized2DArray, getSourceRgb, rangeExclusive } from './utils';

export type PatternCache = BitImage[];

export type AdjustedPixels = Grid<Nullable<Rgb>>;

export type DitheringErrorBuffer = Grid<number>;

export interface LayerContext {
    layer: Layer,
    currentTool: ToolType,
    patternCache: PatternCache,
    adjustedPixels: AdjustedPixels,
    ditheringErrorBuffer: DitheringErrorBuffer,
    attributes: AttributeImage;
}

export const initializeLayerContext = (layer: Layer, currentTool: ToolType): LayerContext => {

    const adjustedPixels = getInitialized2DArray<Nullable<Rgb>>(192, 256, null);
    rangeExclusive(192, y => rangeExclusive(256, x => {
        const rgb = getSourceRgb(layer, x, y, currentTool);
        if (rgb !== null) {
            const inverted = getInverted(layer, rgb);
            const adjusted = getColorAdjusted(layer, inverted);
            adjustedPixels[y][x] = adjusted;
        }
    }));

    return {
        layer,
        currentTool,
        patternCache: R.map(
            brightness => R.reduce(
                (acc, pattern) => (acc !== layer.patterns[layer.patterns.length - 1].pattern)
                    ? acc // already chose something other than the last pattern
                    : brightness < pattern.limit ? pattern.pattern : acc,
                layer.patterns.length ? layer.patterns[layer.patterns.length - 1].pattern : [],
                R.init(layer.patterns)
            ),
            R.range(0, 256)
        ),
        adjustedPixels,
        ditheringErrorBuffer: getInitialized2DArray(192 + 2, 256 + 2, 0),
        attributes: getInitialized2DArray<Nullable<Color>>(24, 32, null)
    }
};

export const getDitheringContextAttributeBlockColor = (ctx: LayerContext, x: number, y: number): Nullable<Color> => {
    if (ctx.layer.pixelateSource === PixelationSource.targetColor) {
        return ctx.layer.pixelateTargetColor;
    }

    const attrX = Math.floor(x / 8);
    const attrY = Math.floor(y / 8);
    if (ctx.attributes[attrY][attrX] === null) {
        ctx.attributes[attrY][attrX] = computeAttributeBlockColor(ctx, x, y);
    }
    return ctx.attributes[attrY][attrX];

}
