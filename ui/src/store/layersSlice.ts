import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import * as R from "ramda";

import { ImageFileData, Layer, LayersSliceState, PixelationPattern, PixelationType } from "../types";
import { getHeightForAspectRatio, getJson, getWidthForAspectRatio, getWindow } from "../utils";

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

const getNextLayerId = (state: LayersSliceState): number => (
    (
        (state.layers || [])
            .map((layer: Layer) => layer.id)
            .reduce((acc, val) => Math.max(acc, val), 0)
    ) || 0
) + 1;

export const loadLayerSrc = createAsyncThunk(
    'layers/loadLayerSrc',
    async (layer: Layer) => await getJson<ImageFileData>(
        window.location.protocol
        + '//'
        + window.location.hostname
        + ':13000'
        + '/?url=' + encodeURIComponent(layer.src)
    )
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
                    id: getNextLayerId(state),
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
                    saturation: 100,
                    red: 100,
                    green: 100,
                    blue: 100,
                    brightness: 0,
                    contrast: 0,
                    invert: false,
                    pixelate: PixelationType.none,
                    patterns: []
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
            state.layers[getLayerIndex(state, action)].preserveLayerAspectRatio =
                action.payload.preserveLayerAspectRatio;
        },
        setLayerRotate: (state, action: PayloadAction<{ layer: Layer, rotate: number }>) => {
            state.layers[getLayerIndex(state, action)].rotate =
                action.payload.rotate;
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
        addLayerPattern: (state, action: PayloadAction<{ layer: Layer }>) => {
            const idx = getLayerIndex(state, action);
            const limit = state.layers[idx]!.patterns.length === 0
                ? 50
                : Math.round(50 + (state.layers[idx]!.patterns.map(p => p.limit).reduce((acc, val) => Math.max(acc, val)) || 0));
            state.layers[getLayerIndex(state, action)].patterns.push({
                limit,
                pattern: [[true, false], [false, true]]
            });
        },
        updateLayerPattern: (state, action: PayloadAction<{ layer: Layer, idx: number, pattern: PixelationPattern }>) => {
            state.layers[getLayerIndex(state, action)].patterns[action.payload.idx] = action.payload.pattern;
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
                id: getNextLayerId(state),
                active: true,
            });

            win._maskData[newLayer.id] = R.clone(
                win._maskData[state.layers[idx]!.id]
            );

            state.layers = [
                ...state.layers.map((layer) => { layer.active = false; return layer; }),
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
                    win._maskData = [];
                }
                win._maskData[state.layers[idx]!.id] = action.payload.data.map(() => false);

                state.layers[idx]!.loading = false;
                state.layers[idx]!.loaded = true;
                state.repaint = Date.now();
            })
            .addCase(loadLayerSrc.rejected, (state, action) => {
                const idx = getLayerIndex(state, action);
                const layer = state.layers[idx]!;
                layer.loading = false;
                console.log('Can not load this layer! ' + layer.src);
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
    setLayerSaturation,
    setLayerRed,
    setLayerGreen,
    setLayerBlue,
    setLayerBrightness,
    setLayerContrast,
    setLayerInvert,
    setLayerPixelate,
    removeLayer,
    duplicateLayer,
    addLayerPattern,
    updateLayerPattern,
    removeLayerPattern,
    changeBackground,
} = layersSlice.actions;

export default layersSlice.reducer;
