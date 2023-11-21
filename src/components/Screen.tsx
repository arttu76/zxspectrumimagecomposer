import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { repaint } from '../store/housekeepingSlice';
import { setLayerX, setLayerY } from "../store/layersSlice";
import { setZoom } from '../store/toolsSlice';
import { AttributeBrushType, Color, DragState, Keys, Layer, MaskBrushType, Nullable, PixelBrushType, PixelationType, Rgb, SpectrumPixelCoordinate, ToolType, Undefinable } from "../types";
import { getSpectrumRgb, spectrumColor } from '../utils/colors';
import { getGrowableGridData, setGrowableGridData } from '../utils/growableGridManager';
import { isMaskSet, setMask } from '../utils/maskManager';
import { getSpectrumMemoryAttribute, getSpectrumMemoryAttributeByte, getSpectrumMemoryPixelOffsetAndBit, setSpectrumMemoryAttribute, setSpectrumMemoryPixel } from '../utils/spectrumHardware';
import { addAttributeGridUi, addMaskUiToLayer, addMouseCursor, getBackgroundValue, getCoordinatesCoveredByCursor, getCoordinatesCoveredByCursorInSourceImageCoordinates, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { applyRange2DExclusive, booleanOrNull, clamp8Bit, getInitialized2DArray, getWindow } from "../utils/utils";
import { Icon } from './Icon';

const win = getWindow();

export const Screen = () => {

    const screenRef = useRef<HTMLDivElement>(null);

    const [showMiniMap, setShowMiniMap] = useState(true);

    const tools = useAppSelector((state) => state.tools);
    const currentManualAttribute = useAppSelector((state) => state.tools.manualAttribute) || {
        ink: 7,
        paper: 0,
        bright: false
    };

    useAppSelector((state) => state.housekeeping.repaint); // just trigger component redraw

    // change zoom when window is resized
    useEffect(() => {

        const resize = () => {
            if (screenRef?.current) {
                dispatch(setZoom(
                    Math.min(
                        Math.floor(screenRef.current.offsetWidth / 255),
                        Math.floor(screenRef.current.offsetHeight / 192)
                    )
                ));
            }
        }

        win.addEventListener('resize', resize);
        resize();

        return () => win.removeEventListener('resize', resize);
    }, []);

    const bg = useAppSelector((state) => state.layers.background);
    const attributeGridOpacity = useAppSelector((state) => state.tools.attributeGridOpacity);
    const layers = useAppSelector((state) => state.layers.layers);
    const activeLayer = layers.find(layer => layer.active) || null;

    const dispatch = useAppDispatch();

    const [mouseDownState, setMouseDownState] = useState(false);
    const [mouseOnScreen, setMouseOnScreen] = useState(false);
    const [mouseX, setMouseX] = useState<SpectrumPixelCoordinate>(0);
    const [mouseY, setMouseY] = useState<SpectrumPixelCoordinate>(0);

    const drawCursor = mouseOnScreen && tools.tool !== ToolType.nudge;

    const [dragState, setDragState] = useState<DragState>({
        dragging: false,
        dragPreviousX: undefined,
        dragPreviousY: undefined
    })
    const miniMapCanvasRef = React.useRef(null);

    const canvasRef = (canvas: HTMLCanvasElement) => {
        if (canvas === null) {
            return;
        }

        const screenCtx = canvas.getContext("2d")!;
        const imageData = screenCtx.createImageData(255, 192);

        const miniMapAvailable = (miniMapCanvasRef !== null && miniMapCanvasRef.current !== null);
        const miniMapCtx = miniMapAvailable
            ? (miniMapCanvasRef.current as any).getContext('2d')
            : null;
        const miniMapImageData = miniMapAvailable
            ? miniMapCtx.createImageData(255, 192)
            : null;

        const coordinatesCoveredByCursor = getCoordinatesCoveredByCursor(
            tools.tool,
            tools.brushShape,
            tools.brushSize,
            mouseX,
            mouseY
        );

        win[Keys.spectrumMemoryAttribute] = new Uint8Array(192 / 8 * 256 / 8)
            .fill(getSpectrumMemoryAttributeByte({ ink: 7, paper: bg === -1 ? 7 : bg, bright: false }));
        win[Keys.spectrumMemoryBitmap] = new Uint8Array(192 * 256 / 8).fill(0);

        const shownLayers = layers.filter(layer => layer.shown);

        const alreadySelectedAttribute = getInitialized2DArray<Nullable<Color>>(256 / 8, 192 / 8, null);

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 256, (y, x) => {

            let pixel: Nullable<boolean> = null;
            let attribute: Nullable<Color> = null;
            let topmostAdjustedPixel: Nullable<Rgb> = null;
            let renderedPixel: Nullable<Rgb> = null;

            // loop visible layers from top to bottom
            for (const layer of shownLayers) {

                let topmostAdjustedPixelFromThisLayer = false

                const pixelIsUnmasked = tools.tool === ToolType.mask || !isMaskSet(layer, x, y, true);

                if (
                    !tools.hideSourceImage
                    && pixelIsUnmasked
                    && pixel === null
                    && layer.pixelate === PixelationType.none
                    && topmostAdjustedPixel === null
                    && win[Keys.adjustedPixels][layer.id]
                    && win[Keys.adjustedPixels][layer.id]?.[y]
                ) {
                    topmostAdjustedPixel = win[Keys.adjustedPixels][layer.id]?.[y][x] || null;
                    topmostAdjustedPixelFromThisLayer = true;
                    pixel = null;
                }

                if (
                    pixelIsUnmasked
                    && (topmostAdjustedPixel === null || topmostAdjustedPixelFromThisLayer)
                    && pixel === null
                    && !tools.hideManualPixels
                ) {
                    pixel = getGrowableGridData<boolean>(win[Keys.manualPixels]?.[layer.id], x, y);
                    if (pixel !== null && topmostAdjustedPixelFromThisLayer) {
                        topmostAdjustedPixel = null;
                    }
                }

                if (
                    pixelIsUnmasked
                    && (topmostAdjustedPixel === null || topmostAdjustedPixelFromThisLayer)
                    && attribute === null
                    && !tools.hideManualAttributes
                    && !tools.hideAllAttributes
                    && !alreadySelectedAttribute[Math.floor(x / 8)][Math.floor(y / 8)]
                ) {
                    attribute = getGrowableGridData<Color>(win[Keys.manualAttributes]?.[layer.id], Math.floor(x / 8), Math.floor(y / 8));
                    alreadySelectedAttribute[Math.floor(x / 8)][Math.floor(y / 8)] = attribute;
                }

                if (
                    !tools.hideSourceImage
                    && pixelIsUnmasked
                    && (topmostAdjustedPixel === null || topmostAdjustedPixelFromThisLayer)
                    && attribute === null
                    && layer.pixelate !== PixelationType.none
                    && !tools.hideAllAttributes
                    && !alreadySelectedAttribute[Math.floor(x / 8)][Math.floor(y / 8)]
                    && win[Keys.adjustedSpectrumAttributes]
                    && win[Keys.adjustedSpectrumAttributes]?.[layer.id]
                    && win[Keys.adjustedSpectrumAttributes]?.[layer.id]?.[Math.floor(y / 8)]
                ) {
                    attribute = win[Keys.adjustedSpectrumAttributes]?.[layer.id]?.[Math.floor(y / 8)][Math.floor(x / 8)];
                    alreadySelectedAttribute[Math.floor(x / 8)][Math.floor(y / 8)] = attribute;
                }

                if (!attribute) {
                    attribute = alreadySelectedAttribute[Math.floor(x / 8)][Math.floor(y / 8)];
                }

                if (
                    !tools.hideSourceImage
                    && (topmostAdjustedPixel === null || topmostAdjustedPixelFromThisLayer)
                    && layer.pixelate !== PixelationType.none
                    && pixelIsUnmasked
                    && pixel === null
                ) {
                    pixel = booleanOrNull(win[Keys.adjustedSpectrumPixels]?.[layer.id]?.[y][x]);
                    if (pixel !== null && topmostAdjustedPixelFromThisLayer) {
                        topmostAdjustedPixel = null;
                    }
                }

            } // ...all layers

            if (
                pixel === null
            ) {
                renderedPixel = replaceEmptyWithBackground(topmostAdjustedPixel, x, y, bg);
                setSpectrumMemoryPixel(win[Keys.spectrumMemoryBitmap], x, y, false);
                if (x % 8 === 0 && y % 8 === 0) {
                    setSpectrumMemoryAttribute(win[Keys.spectrumMemoryAttribute], x, y, {
                        ink: 0,
                        paper: bg === -1 ? 7 : bg,
                        bright: false
                    });
                }
            } else {
                attribute = tools.hideAllAttributes ?
                    {
                        ink: 0,
                        paper: 7,
                        bright: false
                    }
                    : attribute || {
                        ink: 0,
                        paper: bg === -1 ? 0 : bg,
                        bright: false
                    };

                const normalOrBrightColors = attribute.bright
                    ? spectrumColor.bright
                    : spectrumColor.normal;

                renderedPixel = pixel
                    ? normalOrBrightColors[attribute.ink]
                    : normalOrBrightColors[attribute.paper]

                setSpectrumMemoryPixel(win[Keys.spectrumMemoryBitmap], x, y, !!pixel);
                if (x % 8 === 0 && y % 8 === 0) {
                    setSpectrumMemoryAttribute(win[Keys.spectrumMemoryAttribute], x, y, attribute);
                }
            }

            if (!renderedPixel) {
                const bg = getBackgroundValue(x, y);
                renderedPixel = [bg, bg, bg];
            }

            const offset = (y * 255 + x) * 4;
            if (miniMapCtx && miniMapImageData) {
                miniMapImageData.data[offset] = renderedPixel[0];
                miniMapImageData.data[offset + 1] = renderedPixel[1];
                miniMapImageData.data[offset + 2] = renderedPixel[2];
                miniMapImageData.data[offset + 3] = 255;
            }

            renderedPixel = addMaskUiToLayer(renderedPixel, activeLayer, tools.tool, x, y);
            renderedPixel = addAttributeGridUi(attributeGridOpacity, renderedPixel, x, y);

            if (drawCursor) {
                renderedPixel = addMouseCursor(renderedPixel, x, y, coordinatesCoveredByCursor);
            }

            imageData.data[offset] = renderedPixel[0];
            imageData.data[offset + 1] = renderedPixel[1];
            imageData.data[offset + 2] = renderedPixel[2];
            imageData.data[offset + 3] = 255;
        });

        if (tools.tool === ToolType.export) {
            applyRange2DExclusive<SpectrumPixelCoordinate>(192, 256, (y, x) => {

                let rgb: Rgb;

                if (
                    !tools.exportFullScreen
                    && (
                        x / 8 < tools.exportCharX
                        || y / 8 < tools.exportCharY
                        || x / 8 >= tools.exportCharX + tools.exportCharWidth
                        || y / 8 >= tools.exportCharY + tools.exportCharHeight
                    )
                ) {
                    const bg = getBackgroundValue(x, y);
                    rgb = [bg, bg, bg];
                } else {
                    const pixelLocation = getSpectrumMemoryPixelOffsetAndBit(x, y);
                    const bitmapPixel = !!(win[Keys.spectrumMemoryBitmap][pixelLocation[0]] >> (pixelLocation[1]) & 1);
                    const attr = getSpectrumMemoryAttribute(win[Keys.spectrumMemoryAttribute], x, y);
                    rgb = getSpectrumRgb(attr, bitmapPixel);
                }

                const offset = (y * 255 + x) * 4;
                if (miniMapCtx && miniMapImageData) {
                    miniMapImageData.data[offset] = rgb[0];
                    miniMapImageData.data[offset + 1] = rgb[1];
                    miniMapImageData.data[offset + 2] = rgb[2];
                    miniMapImageData.data[offset + 3] = 255;
                }

                imageData.data[offset] = rgb[0];
                imageData.data[offset + 1] = rgb[1];
                imageData.data[offset + 2] = rgb[2];
                imageData.data[offset + 3] = 255;
            });

        }

        miniMapCtx && miniMapCtx.putImageData(miniMapImageData, 0, 0);
        screenCtx.putImageData(imageData, 0, 0);
    };

    const handleMouse = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, mouseDown: Undefinable<boolean> = undefined) => {
        if (!activeLayer || tools.tool === ToolType.export) {
            return;
        }

        let requestRepaint = drawCursor;

        const layer = activeLayer as unknown as Layer;

        if (tools.tool === ToolType.nudge) {
            const nowDragging = mouseDown === undefined
                ? dragState.dragging
                : mouseDown;

            let dragPreviousX = mouseDown
                ? event.clientX
                : dragState.dragPreviousX;

            let dragPreviousY = mouseDown
                ? event.clientY
                : dragState.dragPreviousY;

            if (nowDragging) {
                if (dragPreviousX !== undefined && dragPreviousY !== undefined) {
                    const diffX = event.clientX - dragPreviousX;
                    const diffY = event.clientY - dragPreviousY;

                    if (Math.abs(diffX) > 0) {
                        dispatch(setLayerX({ layer, x: Math.round(layer.x + diffX / tools.zoom) }));
                    }
                    if (Math.abs(diffY) > 0) {
                        dispatch(setLayerY({ layer, y: Math.round(layer.y + diffY / tools.zoom) }));
                    }
                }
                dragPreviousX = event.clientX;
                dragPreviousY = event.clientY;
            }

            setDragState({
                dragging: !!nowDragging,
                dragPreviousX,
                dragPreviousY
            });

            return;
        }

        const mouseX = clamp8Bit((event.clientX - event.currentTarget.getBoundingClientRect().left) / tools.zoom);
        const mouseY = clamp8Bit((event.clientY - event.currentTarget.getBoundingClientRect().top) / tools.zoom);

        if (mouseDown === true || mouseDown === false) {
            setMouseDownState(mouseDown);
        }

        // use layer cordinates if drawing mask (as mask is same size as source image), otherwise use screen coordinates
        if (mouseDown || (!mouseDown && mouseDownState)) {

            if (
                tools.tool === ToolType.mask
                || tools.tool === ToolType.pixels
            ) {

                const coordinatesCoveredByCursor = getCoordinatesCoveredByCursor(
                    tools.tool,
                    tools.brushShape,
                    tools.brushSize,
                    mouseX,
                    mouseY
                );

                if (tools.tool === ToolType.mask) {
                    getCoordinatesCoveredByCursorInSourceImageCoordinates(
                        tools.brushShape,
                        tools.brushSize,
                        mouseX,
                        mouseY,
                        activeLayer
                    ).forEach(xy => {
                        setMask(layer, xy.x, xy.y, tools.maskBrushType === MaskBrushType.brush);
                    });
                }

                if (tools.tool === ToolType.pixels) {
                    coordinatesCoveredByCursor.forEach(xy => {
                        if (!win[Keys.manualPixels]) {
                            win[Keys.manualPixels] = {};
                        }
                        if (tools.pixelBrushType === PixelBrushType.eraser) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, null);
                        }
                        if (tools.pixelBrushType === PixelBrushType.ink) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, true);
                        }
                        if (tools.pixelBrushType === PixelBrushType.paper) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, false);
                        }
                    });
                }
            }

            if (tools.tool === ToolType.attributes) {
                const cursorX = Math.floor(mouseX / 8);
                const cursorY = Math.floor(mouseY / 8);

                if (!win[Keys.manualAttributes]) {
                    win[Keys.manualAttributes] = {};
                }
                if (tools.attributeBrushType === AttributeBrushType.eraser) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, null);
                }
                if (tools.attributeBrushType === AttributeBrushType.all) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, currentManualAttribute);
                }

                const existingAttribute = getGrowableGridData<Color>(win[Keys.manualAttributes][layer.id], cursorX, cursorY)
                    || getSpectrumMemoryAttribute(win[Keys.spectrumMemoryAttribute], cursorX, cursorY)
                    || {
                    ink: 0,
                    paper: 7,
                    bright: false
                };
                if (tools.attributeBrushType === AttributeBrushType.ink) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        ink: currentManualAttribute.ink
                    });
                }
                if (tools.attributeBrushType === AttributeBrushType.paper) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        paper: currentManualAttribute.paper
                    });
                }
                if (tools.attributeBrushType === AttributeBrushType.bright) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        bright: currentManualAttribute.bright
                    });
                }

            }

            requestRepaint = true;
        }

        setMouseX(mouseX);
        setMouseY(mouseY);

        if (requestRepaint) {
            dispatch(repaint());
        }
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => handleMouse(event, true);
    const handleMouseNotDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => handleMouse(event, false);

    if (layers.length === 0) {
        return <div className="Screen">
            <div className="addLayerToBegin">
                Add layer to start
                <div>Click "Add layer" from the top right</div>
                <div>Click Question-icon <Icon icon='help' /> on the top toolbar for help</div>
            </div>
        </div>
    }

    return (
        <div className="Screen"
            ref={screenRef}>
            <div className="ScreenCanvasContainer"
                style={{
                    width: 255 * tools.zoom,
                    height: 192 * tools.zoom
                }}>
                <canvas
                    style={{
                        cursor: tools.tool === ToolType.nudge ? "move" : tools.tool === ToolType.export ? "not-allowed" : "none",
                        transformOrigin: "top left",
                        transform: "scale(" + tools.zoom + ")",
                        imageRendering: tools.crisp ? "pixelated" : "inherit"
                    }}
                    width={255}
                    height={192}
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseNotDown}
                    onMouseEnter={() => setMouseOnScreen(true)}
                    onMouseLeave={() => setMouseOnScreen(false)}
                    onMouseMove={handleMouse}
                ></canvas>
            </div>
            <canvas
                style={{ display: tools.zoom > 1 ? 'block' : 'none' }}
                className={`miniMap${showMiniMap ? ' show' : ' hide'}`}
                onClick={() => setShowMiniMap(!showMiniMap)}
                width={255}
                height={192}
                ref={miniMapCanvasRef}
            ></canvas>
        </div>
    );
};
