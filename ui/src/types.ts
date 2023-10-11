export interface ExtendedWindow extends Window {
    _maskData: GrowableGrid<boolean>[]; // [layer id]
    _imageData: { [key: string]: number[] }; // { layer.src: [r,g,b,a, r,g,b,a ...] }
}

export type Undefinable<T> = T | undefined;
export type Nullable<T> = T | null;

export type DragState = {
    dragging: boolean,
    dragPreviousX: Undefinable<number>,
    dragPreviousY: Undefinable<number>
}

export interface GrowableGrid<T> {
    offsetX: number;
    offsetY: number;
    data: (Nullable<T>)[][];
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
    floydsteinberg = 'Floyd–Steinberg',
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
    originalHeight: Undefinable<number>;
    originalWidth: Undefinable<number>;
    height: Undefinable<number>;
    width: Undefinable<number>;
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
