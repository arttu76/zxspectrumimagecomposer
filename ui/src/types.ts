export type Undefinable<T> = T | undefined;
export type Nullable<T> = T | null;

export type Percentage = number;

export type SourceImageCoordinate = number;

export type SpectrumPixelCoordinate = number;

export type Distance = number;

export type Id = string;

export type Rgb = [number, number, number];
export type Hsl = Rgb;

export type Grid<T> = T[][]

export type FlatRgbData = number[];

export type RgbImage = Grid<Rgb>;
export type PartialRgbImage = Grid<Nullable<Rgb>>; // partial = image can have "holes" (nulls)

export type BitImage = Grid<boolean>;
export type PartialBitImage = Grid<Nullable<boolean>>; // partial = image can have "holes" (nulls)

export type ImageFilterKernel = Grid<number>;
export type PartialAttributeImage = Grid<Nullable<Color>>;

export type DitheringErrorBuffer = Grid<number>;

export type PatternCache = BitImage[];

export interface withId {
    id: Id;
}

export enum Keys {
    state = '_state',
    imageData = '_imageData',
    maskData = '_maskData',

    adjustedPixels = '_adjustedPixels',
    attributes = '_attributes',
    pixels = '_pixels',

    manualPixels = '_manualPixels',
    manualAttributes = '_manualAttributes',

    patternCache = '_patternCache'
}

export interface ExtendedWindow extends Window {
    [Keys.imageData]: { [key: Id]: FlatRgbData }; // { layer.id: [r,g,b,a, r,g,b,a ...] }
    [Keys.maskData]: { [key: Id]: Uint16Array; }; // key = layer id 

    [Keys.patternCache]: { [key: Id]: PatternCache }

    // source image pixels modified by layer settings - same size as source image
    [Keys.adjustedPixels]: { [key: Id]: PartialRgbImage }

    // source image pixels computed from adjustedPixels and layer settings - spectrum screen sized
    [Keys.pixels]: { [key: Id]: PartialBitImage }
    // source image attributes computed from adjustedPixels and layer settings - spectrum screen sized
    [Keys.attributes]: { [key: Id]: PartialAttributeImage }

    // manually set pixels and attributes - spectrum screen sized
    [Keys.manualPixels]: { [key: Id]: GrowableGrid<boolean> }
    [Keys.manualAttributes]: { [key: Id]: GrowableGrid<Color> }
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

export interface XY<T> {
    x: T,
    y: T
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
    name: string;
    loading: boolean;
    loaded: boolean;
    originalHeight: Undefinable<number>;
    originalWidth: Undefinable<number>;
    requireAdjustedPixelsRefresh: boolean; // when settings have been adjusted so that window[layer.id].adjustedPixels needs to be updated
    height: Undefinable<number>;
    width: Undefinable<number>;
    preserveLayerAspectRatio: boolean;
    x: number;
    y: number;
    rotate: number;
    flipX: boolean;
    flipY: boolean;
    blur: number;
    edgeEnhance: number;
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
    requireSpectrumPixelsRefresh: boolean; // when settings have been adjusted so that window[layer.id].pixels and attributes need to be updated
    pixelate: PixelationType;
    requirePatternCacheRefresh: boolean;
    patterns: PixelationPattern[];
    pixelateSource: PixelationSource;
    pixelateAutoColors: number[];
    pixelateTargetColor: Color;
    brightnessThreshold: number;
    manualAttributesOffsetX: number;
    manualAttributesOffsetY: number;
}
export interface LayersSliceState {
    layers: Layer[];
    background: number;
}
export enum ToolType {
    nudge = 'nudge',
    mask = 'mark',
    pixels = 'pixels',
    attributes = 'attributes',
    export = 'export'
}
export enum BrushShape {
    block = 'block',
    circle = 'circle'
}
export enum MaskBrushType {
    brush = 'brush',
    eraser = 'eraser'
}
export enum PixelBrushType {
    ink = 'ink',
    paper = 'paper',
    eraser = 'eraser'
}

export enum AttributeBrushType {
    ink = 'ink',
    paper = 'paper',
    bright = 'bright',
    all = 'all',
    eraser = 'eraser'
}

export interface ToolsSliceState {
    zoom: number;
    crisp: boolean;
    tool: ToolType;
    maskBrushType: MaskBrushType;
    pixelBrushType: PixelBrushType;
    attributeBrushType: AttributeBrushType;
    brushSize: number;
    brushShape: BrushShape;
    manualAttribute: Color;
    hideSourceImage: boolean;
    hideManualPixels: boolean;
    hideManualAttributes: boolean;
    attributeGridOpacity: number;
}

export interface State {
    tools: ToolsSliceState;
    layers: LayersSliceState;
}
