import { DitheringErrorBuffer, Layer, ToolType } from '../types';
import { getInitialized2DArray } from './utils';

export interface LayerContext {
    layer: Layer,
    currentTool: ToolType,
    ditheringErrorBuffer: DitheringErrorBuffer,
}

export const initializeLayerContext = (layer: Layer, currentTool: ToolType): LayerContext => {
    return {
        layer,
        currentTool,
        ditheringErrorBuffer: getInitialized2DArray(192 + 2, 256 + 2, 0)
    }
};
