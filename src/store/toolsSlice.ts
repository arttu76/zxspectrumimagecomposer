import {
    PayloadAction,
    createSlice,
} from "@reduxjs/toolkit";
import { AttributeBrushType, BrushShape, Color, MaskBrushType, PixelBrushType, ToolType, ToolsSliceState } from "../types";

const initialState: ToolsSliceState = {
    tool: ToolType.nudge,
    maskBrushType: MaskBrushType.brush,
    pixelBrushType: PixelBrushType.ink,
    attributeBrushType: AttributeBrushType.all,
    brushSize: 10,
    brushShape: BrushShape.block,
    zoom: Math.min(Math.floor(window.innerWidth / 256), Math.floor(window.innerHeight / 192)),
    invertExportedImage: false,
    exportFullScreen: true,
    exportCharX: 0,
    exportCharY: 0,
    exportCharWidth: 32,
    exportCharHeight: 24,
    crisp: true,
    manualAttribute: {
        ink: 7,
        paper: 0,
        bright: false
    },
    hideSourceImage: false,
    hideManualPixels: false,
    hideManualAttributes: false,
    hideAllAttributes: false,
    attributeGridOpacity: 0,
    showHelp: false,
    loadStartedAt: null,
    loadCurrentAt: null,
    pulseOffsetsForData: []
}

const toolsSlice = createSlice({
    name: 'tools',
    initialState,
    reducers: {
        setTool: (state, action: PayloadAction<ToolType>) => {
            state.tool = action.payload;
        },
        setMaskBrushType: (state, action: PayloadAction<MaskBrushType>) => {
            state.maskBrushType = action.payload;
        },
        setPixelBrushType: (state, action: PayloadAction<PixelBrushType>) => {
            state.pixelBrushType = action.payload;
        },
        setAttributeBrushType: (state, action: PayloadAction<AttributeBrushType>) => {
            state.attributeBrushType = action.payload;
        },
        setBrushSize: (state, action: PayloadAction<number>) => {
            state.brushSize = action.payload;
        },
        setBrushShape: (state, action: PayloadAction<BrushShape>) => {
            state.brushShape = action.payload;
        },
        setManualAttribute: (state, action: PayloadAction<Color>) => {
            state.manualAttribute = action.payload;
        },
        setZoom: (state, action: PayloadAction<number>) => {
            state.zoom = action.payload || 1;
        },
        setCrispScaling: (state, action: PayloadAction<boolean>) => {
            state.crisp = action.payload;
        },
        setHideSourceImage: (state, action: PayloadAction<boolean>) => {
            state.hideSourceImage = action.payload;
        },
        setHideManualPixels: (state, action: PayloadAction<boolean>) => {
            state.hideManualPixels = action.payload;
        },
        setHideManualAttributes: (state, action: PayloadAction<boolean>) => {
            state.hideManualAttributes = action.payload;
        },
        setHideAllAttributes: (state, action: PayloadAction<boolean>) => {
            state.hideAllAttributes = action.payload;
        },
        setAttributeGridOpacity: (state, action: PayloadAction<number>) => {
            state.attributeGridOpacity = action.payload;
        },
        setInvertExportedImage: (state, action: PayloadAction<boolean>) => {
            state.invertExportedImage = action.payload;
        },
        setExportFullScreen: (state, action: PayloadAction<boolean>) => {
            state.exportFullScreen = action.payload;
        },
        setExportCharX: (state, action: PayloadAction<number>) => {
            state.exportCharX = action.payload;
            if (state.exportCharX + state.exportCharWidth > 32) {
                state.exportCharWidth = 32 - state.exportCharX;
            }
        },
        setExportCharY: (state, action: PayloadAction<number>) => {
            state.exportCharY = action.payload;
            if (state.exportCharY + state.exportCharHeight > 24) {
                state.exportCharHeight = 24 - state.exportCharY;
            }
        },
        setExportCharWidth: (state, action: PayloadAction<number>) => {
            state.exportCharWidth = action.payload;
        },
        setExportCharHeight: (state, action: PayloadAction<number>) => {
            state.exportCharHeight = action.payload;
        },
        showHelp: (state, action: PayloadAction<boolean>) => {
            state.showHelp = action.payload;
        },
        setPulseOffsetsForData: (state, action: PayloadAction<number[]>) => {
            state.pulseOffsetsForData = action.payload;
        },
        increaseLoadOffset: (state, action: PayloadAction<number>) => {
            if (state.loadStartedAt === null) {
                state.loadStartedAt = action.payload;
            }
            state.loadCurrentAt = action.payload;
        },
        resetLoadOffset: (state) => {
            state.loadStartedAt = null;
            state.loadCurrentAt = null;
        }
    }
})

export const {
    setTool,
    setMaskBrushType,
    setPixelBrushType,
    setAttributeBrushType,
    setBrushSize,
    setBrushShape,
    setManualAttribute,
    setZoom,
    setCrispScaling,
    setHideSourceImage,
    setHideManualPixels,
    setHideManualAttributes,
    setAttributeGridOpacity,
    setHideAllAttributes,
    setInvertExportedImage,
    setExportFullScreen,
    setExportCharX,
    setExportCharY,
    setExportCharWidth,
    setExportCharHeight,
    showHelp,
    setPulseOffsetsForData,
    increaseLoadOffset,
    resetLoadOffset,

} = toolsSlice.actions;

export default toolsSlice.reducer;
