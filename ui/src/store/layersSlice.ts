import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import * as R from "ramda";

import { Color, ImageFileData, Layer, LayersSliceState, PixelationPattern, PixelationSource, PixelationType } from "../types";
import { fetchJson, getHeightForAspectRatio, getUuid, getWidthForAspectRatio, getWindow } from "../utils/utils";
import { RootState } from "./store";

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

export const loadLayerSrc = createAsyncThunk<ImageFileData | undefined, Layer>(
    'layers/loadLayerSrc',
    async (layer: Layer, thunkAPI) => {

        const state = thunkAPI.getState() as RootState;

        const src = (
            '' + state.layers.layers.find(l => l.id === layer.id)!.src
        ).toLowerCase().trim();

        if (!src) {
            alert("Layer source address must not be empty!");
            return;
        }

        if (!src.startsWith("http")) {
            alert(
                "Layer source address must start with http(s)://\n\n"
                + "You have set layer source address to be:\n\n" + src
            );
            return;
        }

        return await fetchJson<ImageFileData>(
            window.location.protocol
            + '//'
            + window.location.hostname
            + ':13000'
            + '/?url=' + encodeURIComponent(src)
        )
    }
);

const initialState: LayersSliceState = {
    repaint: 0,
    layers: [],
    background: -1
}

const layersSlice = createSlice({
    name: "layers",
    initialState,
    reducers: {
        repaint: (state) => {
            state.repaint = Date.now();
        },
        addLayer: (state) => {
            let src = "";
            if (state.layers.length === 0) {
                src = "http://www.metta.org.uk/travel/images/thumbs/turkey_boat_small.jpg";
            }
            if (state.layers.length === 1) {
                src = "https://i.pinimg.com/280x280_RS/b5/96/91/b5969183bd096593ddce4ac4d27dc60c.jpg";
            }

            state.layers = [
                {
                    id: getUuid(),
                    active: true,
                    shown: true,
                    expanded: true,
                    src,
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
                    hue: 0,
                    saturation: 100,
                    red: 100,
                    green: 100,
                    blue: 100,
                    brightness: 0,
                    contrast: 0,
                    invert: false,
                    pixelate: PixelationType.none,
                    patterns: [],
                    pixelateSource: PixelationSource.autoColor,
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
        setLayerSrc: (state, action: PayloadAction<{ layer: Layer, src: string }>) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx]!.src = action.payload.src;
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
            state.layers[idx].preserveLayerAspectRatio =
                action.payload.preserveLayerAspectRatio;

            if (action.payload.preserveLayerAspectRatio) {
                state.layers[idx]!.height = getHeightForAspectRatio(action.payload.layer);
            }
        },
        setLayerRotate: (state, action: PayloadAction<{ layer: Layer, rotate: number }>) => {
            state.layers[getLayerIndex(state, action)].rotate =
                action.payload.rotate;
        },
        setLayerHue: (state, action: PayloadAction<{ layer: Layer, hue: number }>) => {
            state.layers[getLayerIndex(state, action)].hue =
                action.payload.hue;
        },
        setLayerSaturation: (state, action: PayloadAction<{ layer: Layer, saturation: number }>) => {
            state.layers[getLayerIndex(state, action)].saturation =
                action.payload.saturation;
        },
        setLayerRed: (state, action: PayloadAction<{ layer: Layer, red: number }>) => {
            state.layers[getLayerIndex(state, action)].red =
                action.payload.red;
        },
        setLayerGreen: (state, action: PayloadAction<{ layer: Layer, green: number }>) => {
            state.layers[getLayerIndex(state, action)].green =
                action.payload.green;
        },
        setLayerBlue: (state, action: PayloadAction<{ layer: Layer, blue: number }>) => {
            state.layers[getLayerIndex(state, action)].blue =
                action.payload.blue;
        },
        setLayerBrightness: (state, action: PayloadAction<{ layer: Layer, brightness: number }>) => {
            state.layers[getLayerIndex(state, action)].brightness =
                action.payload.brightness;
        },
        setLayerContrast: (state, action: PayloadAction<{ layer: Layer, contrast: number }>) => {
            state.layers[getLayerIndex(state, action)].contrast =
                action.payload.contrast;
        },
        setLayerInvert: (state, action: PayloadAction<{ layer: Layer, invert: boolean }>) => {
            state.layers[getLayerIndex(state, action)].invert =
                action.payload.invert;
        },
        setLayerPixelate: (state, action: PayloadAction<{ layer: Layer, pixelate: PixelationType }>) => {
            state.layers[getLayerIndex(state, action)].pixelate =
                action.payload.pixelate;
        },
        setLayerPixelateSource: (state, action: PayloadAction<{ layer: Layer, pixelateSource: PixelationSource }>) => {
            state.layers[getLayerIndex(state, action)].pixelateSource = action.payload.pixelateSource;
        },
        setLayerPixelateTargetColor: (state, action: PayloadAction<{ layer: Layer, color: Color }>) => {
            state.layers[getLayerIndex(state, action)].pixelateTargetColor = action.payload.color;
        },
        setLayerBrightnessThreshold: (state, action: PayloadAction<{ layer: Layer, brightnessThreshold: number }>) => {
            state.layers[getLayerIndex(state, action)].brightnessThreshold =
                action.payload.brightnessThreshold;
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

            // other layers not using this data?
            if (
                state.layers
                    .filter((layer, layerIndex) => idx !== layerIndex && layer.src === action.payload.src)
                    .length === 0
            ) {
                if (win._imageData) {
                    console.log("trashing " + state.layers[idx]!.src);
                    delete win._imageData[state.layers[idx]!.src];
                }
            }

            if (win._maskData) {
                delete win._maskData[state.layers[idx]!.id];
            }

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
            const idx = getLayerIndex(state, action);
            const win = getWindow();

            const newLayer = R.mergeRight(state.layers[idx]!, {
                id: getUuid(),
                active: true,
            });

            win._maskData[newLayer.id] = R.clone(
                win._maskData[state.layers[idx]!.id]
            );

            state.layers = [
                ...state.layers.map(layer => ({ ...layer, active: false })),
                newLayer
            ];
        },
        changeBackground: (state, action) => {
            state.background = action.payload.background;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadLayerSrc.pending, (state, action) => {
                const idx = getLayerIndex(state, action);
                state.layers[idx]!.loading = true;
            })
            .addCase(loadLayerSrc.fulfilled, (state, action) => {

                const idx = getLayerIndex(state, action);
                state.layers[idx]!.loading = false;

                if (action.payload === undefined) {
                    console.log("loadLayerSrc.fulfilled got undefined payload");
                    return;
                }

                state.layers[idx]!.originalHeight = action.payload.height;
                state.layers[idx]!.height = action.payload.height;
                state.layers[idx]!.originalWidth = action.payload.width;
                state.layers[idx]!.width = action.payload.width;

                const win = getWindow();

                if (!win._imageData) {
                    win._imageData = {};
                }
                win._imageData[state.layers[idx]!.src] = action.payload.data;

                if (!win._maskData) {
                    win._maskData = {};
                }
                win._maskData[state.layers[idx]!.id] = {
                    offsetX: 0,
                    offsetY: 0,
                    data: []
                }
                state.layers[idx]!.loading = false;
                state.layers[idx]!.loaded = true;
                state.repaint = Date.now();
            })
            .addCase(loadLayerSrc.rejected, (state, action) => {
                const idx = getLayerIndex(state, action);
                const layer = state.layers[idx]!;
                layer.loading = false;
                alert(`Can not load this layer!\n${layer.src}`);
            })

    }
});

export const {
    repaint,
    addLayer,
    setActive,
    changeLayerOrdering,
    showHideLayer,
    expandLayer,
    setLayerSrc,
    setLayerX,
    setLayerY,
    setLayerHeight,
    setLayerWidth,
    setLayerRotate,
    preserveLayerAspectRatio,
    setLayerHue,
    setLayerSaturation,
    setLayerRed,
    setLayerGreen,
    setLayerBlue,
    setLayerBrightness,
    setLayerContrast,
    setLayerInvert,
    setLayerPixelate,
    setLayerPixelateSource,
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
