import {
    PayloadAction,
    createSlice,
} from "@reduxjs/toolkit";
import { BrushShape, BrushType, ToolType, ToolsSliceState } from "../types";

const initialState: ToolsSliceState = {
    tool: ToolType.nudge,
    brushType: BrushType.brush,
    brushSize: 10,
    brushShape: BrushShape.block,
    zoom: 1,
    crisp: true,
    attributeGridOpacity: 0
}

const toolsSlice = createSlice({
    name: 'tools',
    initialState,
    reducers: {
        setTool: (state, action: PayloadAction<ToolType>) => {
            state.tool = action.payload;
        },
        setBrushType: (state, action: PayloadAction<BrushType>) => {
            state.brushType = action.payload;
        },
        setBrushSize: (state, action: PayloadAction<number>) => {
            state.brushSize = action.payload;
        },
        setBrushShape: (state, action: PayloadAction<BrushShape>) => {
            state.brushShape = action.payload;
        },
        setZoom: (state, action: PayloadAction<number>) => {
            state.zoom = action.payload || 1;
        },
        setCrispScaling: (state, action: PayloadAction<boolean>) => {
            state.crisp = action.payload;
        },
        setAttributeGridOpacity: (state, action: PayloadAction<number>) => {
            state.attributeGridOpacity = action.payload;
        }
    }
})

export const {
    setTool,
    setBrushType,
    setBrushSize,
    setBrushShape,
    setZoom,
    setCrispScaling,
    setAttributeGridOpacity
} = toolsSlice.actions;

export default toolsSlice.reducer;
