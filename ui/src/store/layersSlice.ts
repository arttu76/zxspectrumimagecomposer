import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import * as R from "ramda";

import { Color, Layer, LayersSliceState, PixelationPattern, PixelationSource, PixelationType } from "../types";
import { getHeightForAspectRatio, getUuid, getWidthForAspectRatio, getWindow } from "../utils/utils";

export type ActionWithLayer = {
    meta?: { arg?: Layer },
    payload?: { layer: Layer } | Layer
} | PayloadAction<any>;

const getLayerIndex = (state: LayersSliceState, action: ActionWithLayer): number => {
    const layerId = (action as any)?.meta?.arg?.id
        // payload IS a layer
        || (action.payload && ('id' in action?.payload) && action?.payload?.id)
        // payload has a layer-propery which is a layer
        || (action.payload && ('layer' in action?.payload) && action?.payload?.layer?.id)
        || -1;

    const index = (state.layers || []).map(layer => layer.id).indexOf(layerId);
    if (index < 0) {
        console.log("Error! Layer id " + layerId + " not found!");
    }
    return index;
};

const initialState: LayersSliceState = {
    layers: [],
    background: -1
}

const layersSlice = createSlice({
    name: "layers",
    initialState,
    reducers: {
        addLayer: (state) => {
            state.layers = [
                {
                    id: getUuid(),
                    active: true,
                    shown: true,
                    expanded: true,
                    name: 'My layer',
                    loading: false,
                    loaded: false,
                    originalHeight: undefined,
                    originalWidth: undefined,
                    height: undefined,
                    width: undefined,
                    preserveLayerAspectRatio: true,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    flipX: false,
                    flipY: false,
                    blur: 0,
                    edgeEnhance: 0,
                    hue: 0,
                    saturation: 0,
                    red: 100,
                    green: 100,
                    blue: 100,
                    brightness: 0,
                    contrast: 0,
                    shadows: 0,
                    midtones: 0,
                    highlights: 0,
                    invert: false,
                    pixelate: PixelationType.none,
                    patterns: [],
                    pixelateSource: PixelationSource.autoColor,
                    pixelateAutoColors: [0, 1, 2, 3, 4, 5, 6, 7],
                    pixelateTargetColor: { ink: 7, paper: 0, bright: false },
                    brightnessThreshold: 50
                },
                ...state.layers.map((layer) => { layer.active = false; return layer })
            ];
        },
        setActive: (state, action: PayloadAction<Layer>) => {
            const idx = getLayerIndex(state, action);
            state.layers.forEach((layer, i) => (layer.active = i === idx));
        },
        changeLayerOrdering: (state, action: PayloadAction<{ toIndex: number, fromIndex: number }>) => {
            const temp = R.clone(state.layers[action.payload.toIndex]);
            state.layers[action.payload.toIndex] = R.clone(
                state.layers[action.payload.fromIndex]
            );
            state.layers[action.payload.fromIndex] = temp;
        },
        showHideLayer: (state, action: PayloadAction<Layer>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.shown = !state.layers[idx]!.shown;
        },
        expandLayer: (state, action: PayloadAction<Layer>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.expanded = !state.layers[idx]!.expanded;
        },
        setLayerName: (state, action: PayloadAction<{ layer: Layer, name: string }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.name = action.payload.name;
        },
        setLayerSrcDimensions: (state, action: PayloadAction<{ layer: Layer, height: number, width: number }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.originalHeight = action.payload.height;
            state.layers[idx]!.height = action.payload.height;
            state.layers[idx]!.originalWidth = action.payload.width;
            state.layers[idx]!.width = action.payload.width;
            state.layers[idx]!.loading = false;
            state.layers[idx]!.loaded = true;
        },
        setLayerX: (state, action: PayloadAction<{ layer: Layer, x: number }>) => {
            state.layers[getLayerIndex(state, action)].x = action.payload.x;
        },
        setLayerY: (state, action: PayloadAction<{ layer: Layer, y: number }>) => {
            state.layers[getLayerIndex(state, action)].y = action.payload.y;
        },
        setLayerHeight: (state, action: PayloadAction<{ layer: Layer, height: number }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.height = action.payload.height;
            if (state.layers[idx]!.preserveLayerAspectRatio) {
                state.layers[idx]!.width = getWidthForAspectRatio(action.payload.layer);
            }
        },
        setLayerWidth: (state, action: PayloadAction<{ layer: Layer, width: number }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.width = action.payload.width;
            if (state.layers[idx]!.preserveLayerAspectRatio) {
                state.layers[idx]!.height = getHeightForAspectRatio(action.payload.layer);
            }
        },
        preserveLayerAspectRatio: (state, action: PayloadAction<{ layer: Layer, preserveLayerAspectRatio: boolean }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx].preserveLayerAspectRatio = action.payload.preserveLayerAspectRatio;

            if (action.payload.preserveLayerAspectRatio) {
                state.layers[idx]!.height = getHeightForAspectRatio(action.payload.layer);
            }
        },
        setLayerRotate: (state, action: PayloadAction<{ layer: Layer, rotate: number }>) => {
            state.layers[getLayerIndex(state, action)].rotate = action.payload.rotate;
        },
        setLayerFlipX: (state, action: PayloadAction<{ layer: Layer, flipX: boolean }>) => {
            state.layers[getLayerIndex(state, action)].flipX = action.payload.flipX;
        },
        setLayerFlipY: (state, action: PayloadAction<{ layer: Layer, flipY: boolean }>) => {
            state.layers[getLayerIndex(state, action)].flipY = action.payload.flipY;
        },

        setLayerBlur: (state, action: PayloadAction<{ layer: Layer, blur: number }>) => {
            state.layers[getLayerIndex(state, action)].blur = action.payload.blur;

        },
        setLayerEdgeEnhance: (state, action: PayloadAction<{ layer: Layer, edgeEnhance: number }>) => {
            state.layers[getLayerIndex(state, action)].edgeEnhance = action.payload.edgeEnhance;
        },
        setLayerHue: (state, action: PayloadAction<{ layer: Layer, hue: number }>) => {
            state.layers[getLayerIndex(state, action)].hue = action.payload.hue;
        },
        setLayerSaturation: (state, action: PayloadAction<{ layer: Layer, saturation: number }>) => {
            state.layers[getLayerIndex(state, action)].saturation = action.payload.saturation;
        },
        setLayerRed: (state, action: PayloadAction<{ layer: Layer, red: number }>) => {
            state.layers[getLayerIndex(state, action)].red = action.payload.red;
        },
        setLayerGreen: (state, action: PayloadAction<{ layer: Layer, green: number }>) => {
            state.layers[getLayerIndex(state, action)].green = action.payload.green;
        },
        setLayerBlue: (state, action: PayloadAction<{ layer: Layer, blue: number }>) => {
            state.layers[getLayerIndex(state, action)].blue = action.payload.blue;
        },
        setLayerBrightness: (state, action: PayloadAction<{ layer: Layer, brightness: number }>) => {
            state.layers[getLayerIndex(state, action)].brightness = action.payload.brightness;
        },
        setLayerContrast: (state, action: PayloadAction<{ layer: Layer, contrast: number }>) => {
            state.layers[getLayerIndex(state, action)].contrast = action.payload.contrast;
        },
        setLayerInvert: (state, action: PayloadAction<{ layer: Layer, invert: boolean }>) => {
            state.layers[getLayerIndex(state, action)].invert = action.payload.invert;
        },

        setLayerShadows: (state, action: PayloadAction<{ layer: Layer, shadows: number }>) => {
            state.layers[getLayerIndex(state, action)].shadows = action.payload.shadows;
        },
        setLayerMidtones: (state, action: PayloadAction<{ layer: Layer, midtones: number }>) => {
            state.layers[getLayerIndex(state, action)].midtones = action.payload.midtones;
        },
        setLayerHighlights: (state, action: PayloadAction<{ layer: Layer, highlights: number }>) => {
            state.layers[getLayerIndex(state, action)].highlights = action.payload.highlights;
        },

        setLayerPixelate: (state, action: PayloadAction<{ layer: Layer, pixelate: PixelationType }>) => {
            state.layers[getLayerIndex(state, action)].pixelate = action.payload.pixelate;
        },
        setLayerPixelateSource: (state, action: PayloadAction<{ layer: Layer, pixelateSource: PixelationSource }>) => {
            state.layers[getLayerIndex(state, action)].pixelateSource = action.payload.pixelateSource;
        },
        setLayerPixelateAutoColors: (state, action: PayloadAction<{ layer: Layer, colors: number[] }>) => {
            state.layers[getLayerIndex(state, action)].pixelateAutoColors = action.payload.colors;
        },
        setLayerPixelateTargetColor: (state, action: PayloadAction<{ layer: Layer, color: Color }>) => {
            state.layers[getLayerIndex(state, action)].pixelateTargetColor = action.payload.color;
        },
        setLayerBrightnessThreshold: (state, action: PayloadAction<{ layer: Layer, brightnessThreshold: number }>) => {
            state.layers[getLayerIndex(state, action)].brightnessThreshold = action.payload.brightnessThreshold;
        },
        addLayerPattern: (state, action: PayloadAction<{ layer: Layer, insertBefore: number }>) => {
            const idx = getLayerIndex(state, action);

            const existingPatterns = state.layers[idx].patterns;
            const firstPattern = !existingPatterns.length;
            const insertAtEnd = action.payload.insertBefore === existingPatterns.length;

            const newLayer = {
                id: getUuid(),
                limit: firstPattern
                    ? 128
                    : insertAtEnd
                        ? Math.round((255 + existingPatterns[existingPatterns.length - 1].limit) / 2)
                        : action.payload.insertBefore > 1
                            ? Math.round((existingPatterns[action.payload.insertBefore! - 1].limit + existingPatterns[action.payload.insertBefore!].limit) / 2)
                            : Math.round(existingPatterns[action.payload.insertBefore!].limit / 2),
                pattern: insertAtEnd
                    ? [[true, true], [true, true]]
                    : firstPattern
                        ? [[false, false]]
                        : JSON.parse(JSON.stringify(action.payload.layer.patterns[action.payload.insertBefore!].pattern))
            };

            if (insertAtEnd) {
                // insert at end
                state.layers[getLayerIndex(state, action)].patterns.push(newLayer);
            } else {
                // insert before something
                state.layers[getLayerIndex(state, action)].patterns.splice(
                    action.payload.insertBefore!,
                    0,
                    newLayer
                );
            }

        },
        updateLayerPattern: (state, action: PayloadAction<{ layer: Layer, idx: number, pattern: PixelationPattern }>) => {
            state.layers[getLayerIndex(state, action)].patterns[action.payload.idx] = {
                ...action.payload.pattern,
                limit: Math.min(action.payload.pattern.limit, 255)
            }
        },
        removeLayerPattern: (state, action: PayloadAction<{ layer: Layer, idx: number }>) => {
            state.layers[getLayerIndex(state, action)].patterns.splice(action.payload.idx, 1);
        },
        removeLayer: (state, action: PayloadAction<Layer>) => {
            const idx = getLayerIndex(state, action);
            const win = getWindow();

            win._imageData && delete win._imageData[action.payload.id];
            win._maskData && delete win._maskData[action.payload.id];

            state.layers.splice(idx, 1);

            if (state.layers.length > idx) {
                state.layers[idx]!.active = true;
            } else {
                if (state.layers.length) {
                    state.layers[idx - 1].active = true;
                }
            }
        },
        duplicateLayer: (state, action: PayloadAction<Layer>) => {
            const win = getWindow();

            const newLayer = {
                ...action.payload,
                id: getUuid(),
                active: true,
                name: "Copy of " + action.payload.name
            };

            win._imageData[newLayer.id] = R.clone(win._imageData[action.payload.id]);
            win._maskData[newLayer.id] = R.clone(win._maskData[action.payload.id]);

            state.layers = [
                newLayer,
                ...state.layers.map(layer => ({ ...layer, active: false }))
            ];

        },
        changeBackground: (state, action) => {
            state.background = action.payload.background;
        },
    }
});

export const {
    addLayer,
    setActive,
    changeLayerOrdering,
    showHideLayer,
    expandLayer,
    setLayerName,
    setLayerSrcDimensions,
    setLayerX,
    setLayerY,
    setLayerHeight,
    setLayerWidth,
    setLayerRotate,
    setLayerFlipX,
    setLayerFlipY,
    preserveLayerAspectRatio,
    setLayerBlur,
    setLayerEdgeEnhance,
    setLayerHue,
    setLayerSaturation,
    setLayerRed,
    setLayerGreen,
    setLayerBlue,
    setLayerBrightness,
    setLayerContrast,
    setLayerHighlights,
    setLayerMidtones,
    setLayerShadows,
    setLayerInvert,
    setLayerPixelate,
    setLayerPixelateSource,
    setLayerPixelateAutoColors,
    setLayerPixelateTargetColor,
    setLayerBrightnessThreshold,
    removeLayer,
    duplicateLayer,
    addLayerPattern,
    updateLayerPattern,
    removeLayerPattern,
    changeBackground,
} = layersSlice.actions;

export default layersSlice.reducer;
