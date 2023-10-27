import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import * as R from "ramda";

import { Color, Layer, LayersSliceState, PixelationPattern, PixelationSource, PixelationType } from "../types";
import { getHeightForAspectRatio, getUuid, getWidthForAspectRatio, getWindow } from "../utils/utils";

export type ActionWithLayer = {
    meta?: { arg?: Layer },
    payload?: { layer: Layer } | Layer
} | PayloadAction<any>;


export type LayerAction<T = {}> = PayloadAction<{ layer: Layer } & T>
const getLayer = (state: LayersSliceState, action: ActionWithLayer): Layer => {
    const layerId = (action as any)?.meta?.arg?.id
        // payload IS a layer
        || (action.payload && ('id' in action?.payload) && action?.payload?.id)
        // payload has a layer-propery which is a layer
        || (action.payload && ('layer' in action?.payload) && action?.payload?.layer?.id)
        || -1;

    return state.layers.find(layer => layer.id === layerId)!;
}

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
                    requireAdjustedPixelsRefresh: true,
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
                    requireSpectrumPixelsRefresh: true,
                    pixelate: PixelationType.none,
                    requirePatternCacheRefresh: true,
                    patterns: [
                        {
                            "id": "82636431-d653-4812-b590-c700f2a21a87",
                            "limit": 64,
                            "pattern": [[false, false], [false, false]]
                        },
                        {
                            "id": "e7eb4971-c280-4a92-8f22-4432b37cc431",
                            "limit": 128,
                            "pattern": [[true, false], [false, true]]
                        },
                        {
                            "id": "b6704a93-ad5e-4ecb-9374-16fb3f3b65f0",
                            "limit": 128,
                            "pattern": [[true, true], [true, true]]
                        }
                    ],
                    pixelateSource: PixelationSource.autoColor,
                    pixelateAutoColors: [0, 1, 2, 3, 4, 5, 6, 7],
                    pixelateTargetColor: { ink: 7, paper: 0, bright: false },
                    brightnessThreshold: 50
                },
                ...state.layers.map((layer) => { layer.active = false; return layer })
            ];
        },
        setActive: (state, action: LayerAction) => {
            state.layers.forEach(layer => layer.active = layer.id === action.payload.layer.id);
        },
        changeLayerOrdering: (state, action: PayloadAction<{ toIndex: number, fromIndex: number }>) => {
            const temp = R.clone(state.layers[action.payload.toIndex]);
            state.layers[action.payload.toIndex] = R.clone(
                state.layers[action.payload.fromIndex]
            );
            state.layers[action.payload.fromIndex] = temp;
        },
        showHideLayer: (state, action: LayerAction) => {
            const layer = getLayer(state, action);
            layer.shown = !layer.shown;
        },
        expandLayer: (state, action: LayerAction) => {
            const layer = getLayer(state, action);
            layer.expanded = !layer.expanded;
        },
        setLayerName: (state, action: LayerAction<{ name: string }>) => {
            getLayer(state, action).name = action.payload.name;
        },
        setLayerRequireAdjustedPixelsRefresh: (state, action: LayerAction<{ required: boolean }>) => {
            const layer = getLayer(state, action);
            layer.requireAdjustedPixelsRefresh = action.payload.required;
            // refresh speccy image if source pixels have changed 
            layer.requireSpectrumPixelsRefresh = layer.requireSpectrumPixelsRefresh || action.payload.required;
        },
        setLayerSrcDimensions: (state, action: LayerAction<{ height: number, width: number }>) => {
            const layer = getLayer(state, action);
            layer.originalHeight = action.payload.height;
            layer.height = action.payload.height;
            layer.originalWidth = action.payload.width;
            layer.width = action.payload.width;
            layer.loading = false;
            layer.loaded = true;
        },
        setLayerX: (state, action: LayerAction<{ x: number }>) => {
            getLayer(state, action).x = action.payload.x;
        },
        setLayerY: (state, action: LayerAction<{ y: number }>) => {
            getLayer(state, action).y = action.payload.y;
        },
        setLayerHeight: (state, action: LayerAction<{ height: number }>) => {
            const layer = getLayer(state, action);
            layer.height = action.payload.height;
            if (layer.preserveLayerAspectRatio) {
                layer.width = getWidthForAspectRatio(layer);
            }
        },
        setLayerWidth: (state, action: LayerAction<{ width: number }>) => {
            const layer = getLayer(state, action);
            layer.width = action.payload.width;
            if (layer.preserveLayerAspectRatio) {
                layer.height = getHeightForAspectRatio(layer);
            }
        },
        preserveLayerAspectRatio: (state, action: LayerAction<{ preserveLayerAspectRatio: boolean }>) => {
            const layer = getLayer(state, action);
            layer.preserveLayerAspectRatio = action.payload.preserveLayerAspectRatio;
            if (action.payload.preserveLayerAspectRatio) {
                layer!.height = getHeightForAspectRatio(layer);
            }
        },
        setLayerRotate: (state, action: LayerAction<{ rotate: number }>) => {
            getLayer(state, action).rotate = action.payload.rotate;
        },
        setLayerFlipX: (state, action: LayerAction<{ flipX: boolean }>) => {
            getLayer(state, action).flipX = action.payload.flipX;
        },
        setLayerFlipY: (state, action: LayerAction<{ flipY: boolean }>) => {
            getLayer(state, action).flipY = action.payload.flipY;
        },
        setLayerBlur: (state, action: LayerAction<{ blur: number }>) => {
            getLayer(state, action).blur = action.payload.blur;
        },
        setLayerEdgeEnhance: (state, action: LayerAction<{ edgeEnhance: number }>) => {
            getLayer(state, action).edgeEnhance = action.payload.edgeEnhance;
        },
        setLayerHue: (state, action: LayerAction<{ hue: number }>) => {
            getLayer(state, action).hue = action.payload.hue;
        },
        setLayerSaturation: (state, action: LayerAction<{ saturation: number }>) => {
            getLayer(state, action).saturation = action.payload.saturation;
        },
        setLayerRed: (state, action: LayerAction<{ red: number }>) => {
            getLayer(state, action).red = action.payload.red;
        },
        setLayerGreen: (state, action: LayerAction<{ green: number }>) => {
            getLayer(state, action).green = action.payload.green;
        },
        setLayerBlue: (state, action: LayerAction<{ blue: number }>) => {
            getLayer(state, action).blue = action.payload.blue;
        },
        setLayerBrightness: (state, action: LayerAction<{ brightness: number }>) => {
            getLayer(state, action).brightness = action.payload.brightness;
        },
        setLayerContrast: (state, action: LayerAction<{ contrast: number }>) => {
            getLayer(state, action).contrast = action.payload.contrast;
        },
        setLayerInvert: (state, action: LayerAction<{ invert: boolean }>) => {
            getLayer(state, action).invert = action.payload.invert;
        },

        setLayerShadows: (state, action: LayerAction<{ shadows: number }>) => {
            getLayer(state, action).shadows = action.payload.shadows;
        },
        setLayerMidtones: (state, action: LayerAction<{ midtones: number }>) => {
            getLayer(state, action).midtones = action.payload.midtones;
        },
        setLayerHighlights: (state, action: LayerAction<{ highlights: number }>) => {
            getLayer(state, action).highlights = action.payload.highlights;
        },
        setLayerRequireSpectrumPixelsRefresh: (state, action: LayerAction<{ required: boolean }>) => {
            getLayer(state, action).requireSpectrumPixelsRefresh = action.payload.required;
        },
        setLayerPixelate: (state, action: LayerAction<{ pixelate: PixelationType }>) => {
            getLayer(state, action).pixelate = action.payload.pixelate;
        },
        setLayerPixelateSource: (state, action: LayerAction<{ pixelateSource: PixelationSource }>) => {
            getLayer(state, action).pixelateSource = action.payload.pixelateSource;
        },
        setLayerPixelateAutoColors: (state, action: LayerAction<{ colors: number[] }>) => {
            getLayer(state, action).pixelateAutoColors = action.payload.colors;
        },
        setLayerPixelateTargetColor: (state, action: LayerAction<{ color: Color }>) => {
            getLayer(state, action).pixelateTargetColor = action.payload.color;
        },
        setLayerBrightnessThreshold: (state, action: LayerAction<{ brightnessThreshold: number }>) => {
            getLayer(state, action).brightnessThreshold = action.payload.brightnessThreshold;
        },
        setLayerRequirePatternCacheRefresh: (state, action: LayerAction<{ required: boolean }>) => {
            getLayer(state, action).requirePatternCacheRefresh = action.payload.required;
        },
        addLayerPattern: (state, action: LayerAction<{ insertBefore: number }>) => {
            const layer = getLayer(state, action);

            const existingPatterns = layer.patterns;
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
                layer.patterns.push(newLayer);
            } else {
                // insert before something
                layer.patterns.splice(
                    action.payload.insertBefore!,
                    0,
                    newLayer
                );
            }

        },
        updateLayerPattern: (state, action: LayerAction<{ idx: number, pattern: PixelationPattern }>) => {
            getLayer(state, action).patterns[action.payload.idx] = {
                ...action.payload.pattern,
                limit: Math.min(action.payload.pattern.limit, 255)
            }
        },
        removeLayerPattern: (state, action: LayerAction<{ idx: number }>) => {
            getLayer(state, action).patterns.splice(action.payload.idx, 1);
        },
        removeLayer: (state, action: LayerAction) => {
            const win = getWindow();
            const layerId = action.payload.layer.id;

            win._imageData && delete win._imageData[layerId];
            win._maskData && delete win._maskData[layerId];
            win.adjustedPixels && delete win.adjustedPixels[layerId];
            win.pixels && delete win.pixels[layerId];
            win.patternCache && delete win.patternCache[layerId];

            const idx = state.layers.map(layer => layer.id).indexOf(layerId);
            state.layers = state.layers.filter(layer => layer.id !== layerId);

            if (idx > 0) {
                state.layers[idx - 1].active = true;
            } else {
                if (state.layers.length) {
                    state.layers[0].active = true;
                }
            }
        },
        duplicateLayer: (state, action: LayerAction) => {
            const win = getWindow();
            const layer = action.payload.layer;

            const newLayer: Layer = {
                ...layer,
                id: getUuid(),
                active: true,
                name: "Copy of " + layer.name
            };

            win._imageData[newLayer.id] = R.clone(win._imageData[layer.id]);
            win._maskData[newLayer.id] = R.clone(win._maskData[layer.id]);

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
    setLayerRequireAdjustedPixelsRefresh,
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
    setLayerRequireSpectrumPixelsRefresh,
    setLayerPixelate,
    setLayerPixelateSource,
    setLayerPixelateAutoColors,
    setLayerPixelateTargetColor,
    setLayerBrightnessThreshold,
    removeLayer,
    duplicateLayer,
    setLayerRequirePatternCacheRefresh,
    addLayerPattern,
    updateLayerPattern,
    removeLayerPattern,
    changeBackground,
} = layersSlice.actions;

export default layersSlice.reducer;
