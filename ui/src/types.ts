export interface ExtendedWindow extends Window {
    _maskData: boolean[][]; // [layer id][x*y]
    _imageData: { [key: string]: number[] }; // { layer.src: [r,g,b,a, r,g,b,a ...] }
}

export type DragState = {
    dragging: boolean,
    dragPreviousX: undefined | number,
    dragPreviousY: undefined | number
}

export interface GrowableGrid<T> {
    offsetX: number;
    offsetY: number;
    pixels: T[][];
}

export interface ImageFileData {
    id: string;
    timestamp: number;
    width: number;
    height: number;
    data: number[];
}

export enum PixelationType {
    none = 'none',
    simple = 'simple',
    noise = 'noise',
    pattern = 'pattern'
}

export interface PixelationPattern {
    limit: number;
    pattern: boolean[][];
}

export interface Layer {
    id: number;
    active: boolean;
    shown: boolean;
    expanded: boolean;
    src: string;
    loading: boolean;
    loaded: boolean;
    originalHeight: number | undefined;
    originalWidth: number | undefined;
    height: number | undefined;
    width: number | undefined;
    preserveLayerAspectRatio: boolean;
    x: number;
    y: number;
    rotate: number;
    saturation: number;
    red: number;
    green: number;
    blue: number;
    brightness: number;
    contrast: number;
    invert: boolean;
    pixelate: PixelationType;
    patterns: PixelationPattern[];
}
export interface LayersSliceState {
    repaint: number;
    layers: Layer[];
    background: number;
}
export enum ToolType {
    nudge = 'nudge',
    mask = 'mark',
    attributes = 'attributes'
}
export enum BrushShape {
    block = 'block',
    circle = 'circle'
}
export interface ToolsSliceState {
    zoom: number;
    crisp: boolean;
    tool: ToolType;
    brushSize: number;
    brushShape: BrushShape;
    attributeGridOpacity: number;
}

export interface State {
    tools: ToolsSliceState;
    layers: LayersSliceState;
}
