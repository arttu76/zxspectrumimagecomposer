import * as R from 'ramda';
import { BitImage, Grid, Layer, Nullable, Rgb, ToolType } from '../types';
import { getInitialized2DArray } from './utils';

export type PatternCache = BitImage[];

export type AdjustedPixels = Grid<Nullable<Rgb>>;

export type DitheringErrorBuffer = Grid<number>;

export interface LayerContext {
    layer: Layer,
    currentTool: ToolType,
    patternCache: PatternCache,
    ditheringErrorBuffer: DitheringErrorBuffer,
}

export const initializeLayerContext = (layer: Layer, currentTool: ToolType): LayerContext => {
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
        ditheringErrorBuffer: getInitialized2DArray(192 + 2, 256 + 2, 0)
    }
};
