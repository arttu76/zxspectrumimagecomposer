import {
    createSlice,
    createAsyncThunk,
} from "@reduxjs/toolkit";

import * as R from 'ramda';

const getLayerIndex = (state, action) => {
    const index = R.compose(
        R.indexOf(action.payload.layer.id),
        R.pluck('id')
    )(state.layers || []);
    if (index < 0) {
        console.log("Error! Layer id " + action.payload.layer.id + " not found!");
    }
    return index;
}

const getNextLayerId = state => R.compose(
    R.reduce(R.max, 0),
    R.pluck('id')
)(state.layers || []) + 1;

export const loadLayerSrc = createAsyncThunk(
    "layers/loadLayerSrc",
    async (payload) => {
        const layer = payload.layer;
        const response = await fetch("http://localhost:13000/?url=" + encodeURIComponent(layer.src));
        if (!response.ok) throw Error(response.statusText);
        const responseJson = await response.json();
        return {
            ...responseJson,
            layer
        };
    }
);

const layersSlice = createSlice({
    name: 'layers',
    initialState: {
        repaint: 0,
        attributeGrid: false,
        layers: [],
        background: -1
    },
    reducers: {
        repaint: (state) => {
            state.repaint = Date.now();
        },
        setLayers: (state, action) => {
            console.log("set layers");
            console.log(action.payload);
        },
        setAttributeGrid: (state, action) => {
            state.attributeGrid = action.payload.attributeGrid;
        },
        addLayer: (state, action) => {

            let src = "";
            if (state.layers.length === 0) {
                src = "http://www.metta.org.uk/travel/images/thumbs/turkey_boat_small.jpg";
            }
            if (state.layers.length === 1) {
                src = "https://i.pinimg.com/280x280_RS/b5/96/91/b5969183bd096593ddce4ac4d27dc60c.jpg";
            }

            state.layers = R.compose(
                R.prepend({
                    id: getNextLayerId(state),
                    active: true,
                    shown: true,
                    expanded: true,
                    src,
                    loaded: false,
                    originalHeight: null,
                    originalWidth: null,
                    height: null,
                    width: null,
                    preserveLayerAspectRatio: true,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    color: 100,
                    brightness: 0,
                    contrast: 0,
                    invert: false,
                    pixelate: 'none'
                }),
                R.map(R.assoc('active', false))
            )(state.layers || []);
        },
        setActive: (state, action) => {
            const idx = getLayerIndex(state, action);
            state.layers.forEach((layer, i) => layer.active = i === idx);
        },
        changeLayerOrdering: (state, action) => {
            const temp = R.clone(state.layers[action.payload.toIndex]);
            state.layers[action.payload.toIndex] = R.clone(state.layers[action.payload.fromIndex]);
            state.layers[action.payload.fromIndex] = temp;
        },
        mergeLayerDown: (state, action) => {
            console.log("not implemented");
        },
        showHideLayer: (state, action) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx].shown = !state.layers[idx].shown;
        },
        expandLayer: (state, action) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx].expanded = !state.layers[idx].expanded;
        },
        setLayerSrc: (state, action) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx].src = action.payload.src;
            state.layers[idx].loaded = false;
        },
        setLayerX: (state, action) => {
            state.layers[getLayerIndex(state, action)].x = action.payload.x;
        },
        setLayerY: (state, action) => {
            state.layers[getLayerIndex(state, action)].y = action.payload.y;
        },
        setLayerHeight: (state, action) => {
            const idx = getLayerIndex(state, action);
            const originalAspect = (state.layers[idx].width / state.layers[idx].originalWidth) /
                (state.layers[idx].height / state.layers[idx].originalHeight);
            state.layers[idx].height = action.payload.height;
            if (state.layers[idx].preserveLayerAspectRatio) {
                const ratio = state.layers[idx].height / state.layers[idx].originalHeight;
                state.layers[idx].width = Math.round(state.layers[idx].originalWidth * ratio * originalAspect);
            }
        },
        resetLayerHeight: (state, action) => {
            const idx = getLayerIndex(state, action);
            const originalAspect = (state.layers[idx].width / state.layers[idx].originalWidth) /
                (state.layers[idx].height / state.layers[idx].originalHeight);
            state.layers[idx].height = state.layers[idx].originalHeight;
            if (state.layers[idx].preserveLayerAspectRatio) {
                state.layers[idx].width = Math.round(state.layers[idx].originalWidth * originalAspect);
            }
        },
        setLayerWidth: (state, action) => {
            const idx = getLayerIndex(state, action);
            const originalAspect = (state.layers[idx].height / state.layers[idx].originalHeight) /
                (state.layers[idx].width / state.layers[idx].originalWidth);
            state.layers[idx].width = action.payload.width;
            if (state.layers[idx].preserveLayerAspectRatio) {
                const ratio = state.layers[idx].width / state.layers[idx].originalWidth;
                state.layers[idx].height = Math.round(state.layers[idx].originalHeight * ratio * originalAspect);
            }
        },
        resetLayerWidth: (state, action) => {
            const idx = getLayerIndex(state, action);
            const originalAspect = (state.layers[idx].height / state.layers[idx].originalHeight) /
                (state.layers[idx].width / state.layers[idx].originalWidth);
            state.layers[idx].width = state.layers[idx].originalWidth;
            if (state.layers[idx].preserveLayerAspectRatio) {
                state.layers[idx].height = Math.round(state.layers[idx].originalHeight * originalAspect);
            }
        },
        preserveLayerAspectRatio: (state, action) => {
            state.layers[getLayerIndex(state, action)].preserveLayerAspectRatio = action.payload.preserveLayerAspectRatio;
        },
        setLayerRotate: (state, action) => {
            state.layers[getLayerIndex(state, action)].rotate = action.payload.rotate;
        },
        setLayerColor: (state, action) => {
            state.layers[getLayerIndex(state, action)].color = action.payload.color;
        },
        setLayerBrightness: (state, action) => {
            state.layers[getLayerIndex(state, action)].brightness = action.payload.brightness;
        },
        setLayerContrast: (state, action) => {
            state.layers[getLayerIndex(state, action)].contrast = action.payload.contrast;
        },
        setLayerInvert: (state, action) => {
            state.layers[getLayerIndex(state, action)].invert = action.payload.invert;
        },
        setLayerPixelate: (state, action) => {
            state.layers[getLayerIndex(state, action)].pixelate = action.payload.pixelate;
        },
        removeLayer: (state, action) => {
            const idx = getLayerIndex(state, action);

            // other layers not using this data?
            if (R.compose(
                R.find(R.propEq('id', action.payload.layer.src)),
                R.addIndex(R.reject)((item, index) => idx === index)
            )(state.layers || [])) {
                if (window._imageData) {
                    console.log("trashing " + state.layers[idx].src);
                    delete window._imageData[state.layers[idx].src];
                }
            }

            if (window._maskData) {
                delete window._maskData[state.layers[idx].id];
            }

            state.layers.splice(
                idx,
                1
            );

            if (state.layers.length > idx) {
                state.layers[idx].active = true;
            } else {
                if (state.layers.length) {
                    state.layers[idx - 1].active = true;
                }
            }
        },
        duplicateLayer: (state, action) => {
            const idx = getLayerIndex(state, action);

            const newLayer = R.mergeRight(
                state.layers[idx],
                {
                    id: getNextLayerId(state),
                    active: true
                }
            );

            window._maskData[newLayer.id] = R.clone(window._maskData[state.layers[idx].id]);

            state.layers = R.prepend(
                newLayer,
                R.map(R.assoc('active', false), state.layers)
            );
        },
        changeBackground: (state, action) => {
            state.background = action.payload.background;
        },
    },
    extraReducers: {
        [loadLayerSrc.pending]: (state, action) => {
        },
        [loadLayerSrc.rejected]: (state, action) => {
            alert("Can not load " + action.meta.arg.layer.src);
        },
        [loadLayerSrc.fulfilled]: (state, action) => {
            const idx = getLayerIndex(state, action);
            state.layers[idx].originalHeight = action.payload.height;
            state.layers[idx].originalWidth = action.payload.width;

            state.layers[idx].height = action.payload.height;
            state.layers[idx].width = action.payload.width;

            if (!window._imageData) {
                window._imageData = {};
            }
            if (!window._maskData) {
                window._maskData = {};
            }

            window._imageData[state.layers[idx].src] = action.payload.data;
            window._maskData[state.layers[idx].id] = [];
            for (let i = 0; i < action.payload.data.length; i++) {
                window._maskData[state.layers[idx].id].push(false);
            }

            state.layers[idx].loaded = true;
        },

    }
})

export const {
    repaint,
    setLayers,
    setAttributeGrid,
    addLayer,
    setActive,
    changeLayerOrdering,
    mergeLayerDown,
    showHideLayer,
    expandLayer,
    setLayerSrc,
    setLayerX,
    setLayerY,
    setLayerHeight,
    resetLayerHeight,
    setLayerWidth,
    resetLayerWidth,
    setLayerRotate,
    preserveLayerAspectRatio,
    setLayerColor,
    setLayerBrightness,
    setLayerContrast,
    setLayerInvert,
    setLayerPixelate,
    removeLayer,
    duplicateLayer,
    changeBackground
} = layersSlice.actions;
export default layersSlice.reducer;