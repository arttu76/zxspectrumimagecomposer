import {
    createSlice,
} from "@reduxjs/toolkit";

const toolsSlice = createSlice({
    name: 'tools',
    initialState: {
        zoom: 1,
        crisp: true,
        tool: 'nudge',
        brushSize: 10,
        brushShape: 'block'
    },
    reducers: {
        setZoom: (state, action) => {
            state.zoom = action.payload.zoom;
        },
        setCrispScaling: (state, action) => {
            state.crisp = action.payload.crisp;
        },
        setTool: (state, action) => {
            state.tool = action.payload.tool;
        },
        setBrushSize: (state, action) => {
            state.brushSize = action.payload.brushSize;
        },
        setBrushShape: (state, action) => {
            state.brushShape = action.payload.brushShape;
        },
    }
})

export const {
    setZoom,
    setCrispScaling,
    setTool,
    setBrushSize,
    setBrushShape
} = toolsSlice.actions;
export default toolsSlice.reducer;
