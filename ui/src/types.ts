export type Undefinable<T> = T | undefined;
export type Nullable<T> = T | null;

export type Percentage = number;

export type Distance = number;

export type Id = string;

export type Rgb = [number, number, number];
export type Hsl = Rgb;

export type Grid<T> = T[][]

export type FlatRgbData = number[];

export type RgbImage = Grid<Rgb>;
export type PartialRgbImage = Grid<Nullable<Rgb>>; // partial = image can have "holes" (nulls)

export type BitImage = Grid<boolean>;

export type ErrorValueImage = Grid<number>;
export type ImageFilterKernel = Grid<number>;
export type AttributeImage = Grid<Nullable<Color>>;

export interface withId {
    id: Id;
}

export interface ExtendedWindow extends Window {
    _maskData: { [key: Id]: GrowableGrid<boolean>; }; // key = layer id
    _imageData: { [key: string]: FlatRgbData }; // { layer.src: [r,g,b,a, r,g,b,a ...] }
}

export type DragState = {
    dragging: boolean,
    dragPreviousX: Undefinable<number>,
    dragPreviousY: Undefinable<number>
}

export interface Color {
    ink: number;
    paper: number;
    bright: boolean;
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
    data: number[]; // r,g,b,r,g,b,r,g,b,r,g,b...
}

export enum PixelationType {
    none = 'none',
    simple = 'simple',
    noise = 'noise',
    floydsteinberg = 'Floyd–Steinberg',
    pattern = 'pattern'
}

export enum PixelationSource {
    targetColor = 'targetColor',
    autoColor = 'autoColor'
}


export interface PixelationPattern extends withId {
    limit: number;
    pattern: BitImage;
}

export interface Layer extends withId {
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
    blur: number;
    hue: number;
    saturation: number;
    red: number;
    green: number;
    blue: number;
    brightness: number;
    contrast: number;
    shadows: number;
    midtones: number;
    highlights: number;
    invert: boolean;
    pixelate: PixelationType;
    patterns: PixelationPattern[];
    pixelateSource: PixelationSource;
    pixelateTargetColor: Color;
    brightnessThreshold: number;
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
