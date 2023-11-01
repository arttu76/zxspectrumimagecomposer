import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { setLayerX, setLayerY } from "../store/layersSlice";
import { repaint } from '../store/repaintSlice';
import { setZoom } from '../store/toolsSlice';
import { AttributeBrushType, BrushShape, Color, DragState, Layer, MaskBrushType, Nullable, PixelBrushType, PixelationType, Rgb, SpectrumPixelCoordinate, ToolType, Undefinable } from "../types";
import { spectrumColor } from '../utils/colors';
import { getGrowableGridData, setGrowableGridData } from '../utils/growableGridManager';
import { isMaskSet, setMask } from '../utils/maskManager';
import { addAttributeGridUi, addMaskUiToLayer, addMouseCursor, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { applyRange2DExclusive, booleanOrNull, clamp8Bit, getLayerXYFromScreenCoordinates, getWindow, safeOne, safeZero } from "../utils/utils";

const win = getWindow();

export const Screen = () => {

    const screenRef = useRef<HTMLDivElement>(null);

    const [showMiniMap, setShowMiniMap] = useState(true);

    const currentZoom = useAppSelector((state) => state.tools.zoom);
    const currentCrisp = useAppSelector((state) => state.tools.crisp);
    const currentTool = useAppSelector((state) => state.tools.tool);
    const currentMaskBrushType = useAppSelector((state) => state.tools.maskBrushType);
    const currentPixelBrushType = useAppSelector((state) => state.tools.pixelBrushType);
    const currentAttributeBrushType = useAppSelector((state) => state.tools.attributeBrushType);

    const currentBrushShape = useAppSelector((state) => state.tools.brushShape);
    const currentBrushSize = useAppSelector((state) => state.tools.brushSize);
    const hideSourceImage = useAppSelector((state) => state.tools.hideSourceImage);
    const hideManualPixels = useAppSelector((state) => state.tools.hideManualPixels);
    const hideManualAttributes = useAppSelector((state) => state.tools.hideManualAttributes);
    const currentManualAttribute = useAppSelector((state) => state.tools.manualAttribute) || {
        ink: 7,
        paper: 0,
        bright: false
    };

    useAppSelector((state) => state.repaint.repaint); // just trigger component redraw

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

        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
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

    const drawCursor = mouseOnScreen && currentTool !== ToolType.nudge;

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

        const start = Date.now();

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 255, (y, x) => {

            let manualPixel: Nullable<boolean> = null;
            let manualAttribute: Nullable<Color> = null;

            let adjustedPixel: Nullable<boolean> = null;
            let adjustedAttribute: Nullable<Color> = null;

            let topmostAdjustedPixel: Nullable<Rgb> = null;

            let renderedPixel: Nullable<Rgb> = null;

            // loop layers from top to bottom
            for (const layer of layers.filter(layer => layer.shown)) {

                if (manualAttribute === null) {
                    manualAttribute = !hideManualAttributes
                        ? getGrowableGridData<Color>(win.manualAttributes?.[layer.id], Math.floor(x / 8), Math.floor(y / 8))
                        : null;
                }

                if (manualPixel === null) {
                    manualPixel = !hideManualPixels
                        ? getGrowableGridData<boolean>(win.manualPixels?.[layer.id], x, y)
                        : null;
                }

                // we already know what to render, no need for source/adjusted image
                if (manualPixel) {
                    continue;
                }

                if (layer.pixelate === PixelationType.none) {
                    // source/adjusted image
                    if (
                        topmostAdjustedPixel === null
                        && !hideSourceImage
                        && win.adjustedPixels[layer.id]
                        && win.adjustedPixels[layer.id]?.[y]
                        && (currentTool !== ToolType.mask || !isMaskSet(layer, x, y, true))
                    ) {
                        topmostAdjustedPixel = win.adjustedPixels[layer.id]?.[y][x] || null;
                    }
                } else {
                    if (
                        !hideSourceImage
                        && (currentTool === ToolType.mask || !isMaskSet(layer, x, y, true))
                    ) continue;
                    // dithered image
                    adjustedPixel = booleanOrNull(win.pixels?.[layer.id]?.[y][x]);
                    adjustedAttribute = (
                        win.attributes
                        && win.attributes?.[layer.id]
                        && win.attributes?.[layer.id]?.[Math.floor(y / 8)]
                    )
                        ? win.attributes?.[layer.id]?.[Math.floor(y / 8)][Math.floor(x / 8)]
                        : null;
                }

            }

            if (
                manualPixel === null
                && manualAttribute === null
                && adjustedAttribute === null
                && adjustedPixel === null
            ) {
                renderedPixel = replaceEmptyWithBackground(topmostAdjustedPixel, x, y, bg);
            } else {
                let pixel = manualPixel;
                if (manualPixel === null) {
                    pixel = adjustedPixel;
                }

                let attribute = manualAttribute || adjustedAttribute || {
                    ink: 0,
                    paper: 7,
                    bright: false
                };

                const normalOrBrightColors = attribute.bright
                    ? spectrumColor.bright
                    : spectrumColor.normal;

                renderedPixel = pixel
                    ? normalOrBrightColors[attribute.ink]
                    : normalOrBrightColors[attribute.paper]
            }

            const offset = (y * 255 + x) * 4;
            if (miniMapCtx && miniMapImageData) {
                miniMapImageData.data[offset] = renderedPixel[0];
                miniMapImageData.data[offset + 1] = renderedPixel[1];
                miniMapImageData.data[offset + 2] = renderedPixel[2];
                miniMapImageData.data[offset + 3] = 255;
            }

            renderedPixel = addMaskUiToLayer(renderedPixel, activeLayer, currentTool, x, y);
            renderedPixel = addAttributeGridUi(attributeGridOpacity, renderedPixel, x, y);

            if (drawCursor) {
                renderedPixel = addMouseCursor(renderedPixel, currentTool, currentBrushShape, currentBrushSize, x, y, mouseX, mouseY);
            }

            imageData.data[offset] = renderedPixel[0];
            imageData.data[offset + 1] = renderedPixel[1];
            imageData.data[offset + 2] = renderedPixel[2];
            imageData.data[offset + 3] = 255;
        });

        const end = Date.now() - start;
        document.querySelector('#renderTime')!.innerHTML = end.toString();

        miniMapCtx && miniMapCtx.putImageData(miniMapImageData, 0, 0);
        screenCtx.putImageData(imageData, 0, 0);
    };

    const handleMouse = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, mouseDown: Undefinable<boolean> = undefined) => {
        if (!activeLayer) {
            return;
        }

        let requestRepaint = drawCursor;

        const layer = activeLayer as unknown as Layer;

        if (currentTool === ToolType.nudge) {
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
                        dispatch(setLayerX({ layer, x: Math.round(layer.x + diffX / currentZoom) }));
                    }
                    if (Math.abs(diffY) > 0) {
                        dispatch(setLayerY({ layer, y: Math.round(layer.y + diffY / currentZoom) }));
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

        const mouseX = clamp8Bit((event.clientX - event.currentTarget.getBoundingClientRect().left) / currentZoom);
        const mouseY = clamp8Bit((event.clientY - event.currentTarget.getBoundingClientRect().top) / currentZoom);

        if (mouseDown === true || mouseDown === false) {
            setMouseDownState(mouseDown);
        }

        // use layer cordinates if drawing mask, otherwise use screen coordinates
        if (mouseDown || (!mouseDown && mouseDownState)) {
            const xScaler = currentTool === ToolType.mask
                ? layer.width! / safeOne(layer.originalWidth)
                : 1;
            const yScaler = currentTool === ToolType.mask
                ? layer.height! / safeOne(layer.originalHeight)
                : 1;

            const targetWidth = currentTool === ToolType.mask
                ? safeZero(layer.originalWidth)
                : 255;

            const targetHeight = currentTool === ToolType.mask
                ? safeZero(layer.originalHeight)
                : 192;

            const halfBrushSize = Math.floor(currentBrushSize / 2);

            if (
                currentTool === ToolType.mask
                || currentTool === ToolType.pixels
            ) {
                applyRange2DExclusive(
                    currentBrushSize * yScaler,
                    currentBrushSize * xScaler,
                    (y, x) => {
                        const { layerX: cursorX, layerY: cursorY } = currentTool === ToolType.mask
                            ? getLayerXYFromScreenCoordinates(
                                layer,
                                mouseX + x - halfBrushSize,
                                mouseY + y - halfBrushSize
                            )
                            : {
                                layerX: mouseX + x - halfBrushSize,
                                layerY: mouseY + y - halfBrushSize
                            };
                        if (
                            cursorX >= 0 && cursorX < targetWidth
                            && cursorY >= 0 && cursorY < targetHeight
                        ) {
                            const xDiff = x - halfBrushSize * xScaler;
                            const yDiff = y - halfBrushSize * yScaler;

                            const isInside = currentBrushShape === BrushShape.block
                                ? Math.abs(xDiff) < halfBrushSize * xScaler && Math.abs(yDiff) < halfBrushSize * yScaler
                                : Math.sqrt(xDiff * xDiff + yDiff * yDiff) < halfBrushSize;

                            if (isInside) {
                                if (currentTool === ToolType.mask) {
                                    setMask(layer, cursorX, cursorY, currentMaskBrushType === MaskBrushType.brush, true);
                                }

                                if (currentTool === ToolType.pixels) {
                                    if (!win.manualPixels) {
                                        win.manualPixels = {};
                                    }
                                    if (currentPixelBrushType === PixelBrushType.eraser) {
                                        win.manualPixels[layer.id] = setGrowableGridData(win.manualPixels?.[layer.id], Math.round(cursorX), Math.round(cursorY), null);
                                    }
                                    if (currentPixelBrushType === PixelBrushType.ink) {
                                        win.manualPixels[layer.id] = setGrowableGridData(win.manualPixels?.[layer.id], Math.round(cursorX), Math.round(cursorY), true);
                                    }
                                    if (currentPixelBrushType === PixelBrushType.paper) {
                                        win.manualPixels[layer.id] = setGrowableGridData(win.manualPixels?.[layer.id], Math.round(cursorX), Math.round(cursorY), false);
                                    }
                                }


                            }
                        }
                    }
                );
            }

            if (currentTool === ToolType.attributes) {
                const cursorX = Math.floor(mouseX / 8);
                const cursorY = Math.floor(mouseY / 8);

                if (!win.manualAttributes) {
                    win.manualAttributes = {};
                }
                if (currentAttributeBrushType === AttributeBrushType.eraser) {
                    win.manualAttributes[layer.id] = setGrowableGridData(win.manualAttributes[layer.id], cursorX, cursorY, null);
                }
                if (currentAttributeBrushType === AttributeBrushType.all) {
                    win.manualAttributes[layer.id] = setGrowableGridData(win.manualAttributes[layer.id], cursorX, cursorY, currentManualAttribute);
                }

                const existingAttribute = getGrowableGridData<Color>(win.manualAttributes[layer.id], cursorX, cursorY) || {
                    ink: 0,
                    paper: 7,
                    bright: false
                };
                if (currentAttributeBrushType === AttributeBrushType.ink) {
                    win.manualAttributes[layer.id] = setGrowableGridData(win.manualAttributes[layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        ink: currentManualAttribute.ink
                    });
                }
                if (currentAttributeBrushType === AttributeBrushType.paper) {
                    win.manualAttributes[layer.id] = setGrowableGridData(win.manualAttributes[layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        paper: currentManualAttribute.paper
                    });
                }
                if (currentAttributeBrushType === AttributeBrushType.bright) {
                    win.manualAttributes[layer.id] = setGrowableGridData(win.manualAttributes[layer.id], cursorX, cursorY, {
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

    return (
        <div className="Screen"
            ref={screenRef}>
            <div className="ScreenCanvasContainer"
                style={{
                    width: 255 * currentZoom,
                    height: 192 * currentZoom
                }}>
                <canvas
                    style={{
                        cursor: currentTool === "nudge" ? "move" : "crosshair",
                        transformOrigin: "top left",
                        transform: "scale(" + currentZoom + ")",
                        imageRendering: currentCrisp ? "pixelated" : "inherit"
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
                style={{ display: currentZoom > 1 ? 'block' : 'none' }}
                className={`miniMap${showMiniMap ? ' show' : ' hide'}`}
                onClick={() => setShowMiniMap(!showMiniMap)}
                width={255}
                height={192}
                ref={miniMapCanvasRef}
            ></canvas>
        </div>
    );
};
