import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { setLayerX, setLayerY } from "../store/layersSlice";
import { repaint } from '../store/repaintSlice';
import { setZoom } from '../store/toolsSlice';
import { AttributeBrushType, Color, DragState, Keys, Layer, MaskBrushType, Nullable, PixelBrushType, PixelationType, Rgb, SpectrumPixelCoordinate, ToolType, Undefinable } from "../types";
import { getSpectrumRgb, spectrumColor } from '../utils/colors';
import { getGrowableGridData, setGrowableGridData } from '../utils/growableGridManager';
import { isMaskSet, setMask } from '../utils/maskManager';
import { getSpectrumMemoryAttribute, getSpectrumMemoryAttributeByte, getSpectrumMemoryPixelOffsetAndBit, setSpectrumMemoryAttribute, setSpectrumMemoryPixel } from '../utils/spectrumHardware';
import { addAttributeGridUi, addMaskUiToLayer, addMouseCursor, getCoordinatesCoveredByCursor, getCoordinatesCoveredByCursorInSourceImageCoordinates, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { applyRange2DExclusive, booleanOrNull, clamp8Bit, getWindow } from "../utils/utils";

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

    const hideAllAttributes = useAppSelector((state) => state.tools.hideAllAttributes);
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

        const coordinatesCoveredByCursor = getCoordinatesCoveredByCursor(
            currentTool,
            currentBrushShape,
            currentBrushSize,
            mouseX,
            mouseY
        );

        win[Keys.spectrumMemoryAttribute] = new Uint8Array(192 / 8 * 256 / 8)
            .fill(getSpectrumMemoryAttributeByte({ ink: 7, paper: bg === -1 ? 7 : bg, bright: false }));
        win[Keys.spectrumMemoryBitmap] = new Uint8Array(192 * 256 / 8).fill(0);

        const shownLayers = layers.filter(layer => layer.shown);

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 255, (y, x) => {

            let manualPixel: Nullable<boolean> = null;
            let manualAttribute: Nullable<Color> = null;

            let adjustedPixel: Nullable<boolean> = null;
            let adjustedAttribute: Nullable<Color> = null;

            let topmostAdjustedPixel: Nullable<Rgb> = null;

            let renderedPixel: Nullable<Rgb> = null;

            // loop visible layers from top to bottom
            for (const layer of shownLayers) {

                if (manualAttribute === null) {
                    manualAttribute = !hideManualAttributes
                        ? getGrowableGridData<Color>(win[Keys.manualAttributes]?.[layer.id], Math.floor(x / 8), Math.floor(y / 8))
                        : null;
                }

                if (manualPixel === null) {
                    manualPixel = !hideManualPixels
                        ? getGrowableGridData<boolean>(win[Keys.manualPixels]?.[layer.id], x, y)
                        : null;
                }

                // we already know what to render, no need for source/adjusted image
                if (manualPixel) {
                    continue;
                }

                // code below deals with source/adjusted/dithered image, ignore it if user so wishes
                if (hideSourceImage) {
                    continue;
                }

                if (layer.pixelate === PixelationType.none) {
                    // source/adjusted image
                    if (
                        topmostAdjustedPixel === null
                        && win[Keys.adjustedPixels][layer.id]
                        && win[Keys.adjustedPixels][layer.id]?.[y]
                        && (currentTool === ToolType.mask || !isMaskSet(layer, x, y, true))
                    ) {
                        topmostAdjustedPixel = win[Keys.adjustedPixels][layer.id]?.[y][x] || null;
                    }
                } else {
                    if (isMaskSet(layer, x, y, true) && currentTool !== ToolType.mask) continue;
                    // dithered image
                    adjustedPixel = booleanOrNull(win[Keys.pixels]?.[layer.id]?.[y][x]);
                    adjustedAttribute = (
                        win[Keys.attributes]
                        && win[Keys.attributes]?.[layer.id]
                        && win[Keys.attributes]?.[layer.id]?.[Math.floor(y / 8)]
                    )
                        ? win[Keys.attributes]?.[layer.id]?.[Math.floor(y / 8)][Math.floor(x / 8)]
                        : null;
                }

                if (hideAllAttributes) {
                    manualAttribute = { ink: 0, paper: 7, bright: false };
                    adjustedAttribute = { ink: 0, paper: 7, bright: false };
                }

            }

            if (
                manualPixel === null
                && manualAttribute === null
                && adjustedAttribute === null
                && adjustedPixel === null
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
                let pixel = manualPixel || adjustedPixel;

                let attribute = manualAttribute || adjustedAttribute || {
                    ink: 0,
                    paper: bg === -1 ? 7 : bg,
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
                renderedPixel = addMouseCursor(renderedPixel, x, y, coordinatesCoveredByCursor);
            }

            imageData.data[offset] = renderedPixel[0];
            imageData.data[offset + 1] = renderedPixel[1];
            imageData.data[offset + 2] = renderedPixel[2];
            imageData.data[offset + 3] = 255;
        });

        if (currentTool === ToolType.export) {
            applyRange2DExclusive<SpectrumPixelCoordinate>(192, 255, (y, x) => {
                const pixelLocation = getSpectrumMemoryPixelOffsetAndBit(x, y);
                const bitmapPixel = !!(win[Keys.spectrumMemoryBitmap][pixelLocation[0]] >> (pixelLocation[1]) & 1);
                const attr = getSpectrumMemoryAttribute(win[Keys.spectrumMemoryAttribute], x, y);
                const rgb = getSpectrumRgb(attr, bitmapPixel);

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
        if (!activeLayer || currentTool === ToolType.export) {
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

        // use layer cordinates if drawing mask (as mask is same size as source image), otherwise use screen coordinates
        if (mouseDown || (!mouseDown && mouseDownState)) {

            if (currentTool === ToolType.mask || currentTool === ToolType.pixels) {

                const coordinatesCoveredByCursor = getCoordinatesCoveredByCursor(
                    currentTool,
                    currentBrushShape,
                    currentBrushSize,
                    mouseX,
                    mouseY
                );

                if (currentTool === ToolType.mask) {
                    getCoordinatesCoveredByCursorInSourceImageCoordinates(coordinatesCoveredByCursor, activeLayer).forEach(xy => {
                        setMask(layer, xy.x, xy.y, currentMaskBrushType === MaskBrushType.brush, false);
                    });
                }

                if (currentTool === ToolType.pixels) {
                    coordinatesCoveredByCursor.forEach(xy => {
                        if (!win[Keys.manualPixels]) {
                            win[Keys.manualPixels] = {};
                        }
                        if (currentPixelBrushType === PixelBrushType.eraser) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, null);
                        }
                        if (currentPixelBrushType === PixelBrushType.ink) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, true);
                        }
                        if (currentPixelBrushType === PixelBrushType.paper) {
                            win[Keys.manualPixels][layer.id] = setGrowableGridData(win[Keys.manualPixels]?.[layer.id], xy.x, xy.y, false);
                        }
                    });
                }
            }

            if (currentTool === ToolType.attributes) {
                const cursorX = Math.floor(mouseX / 8);
                const cursorY = Math.floor(mouseY / 8);

                if (!win[Keys.manualAttributes]) {
                    win[Keys.manualAttributes] = {};
                }
                if (currentAttributeBrushType === AttributeBrushType.eraser) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, null);
                }
                if (currentAttributeBrushType === AttributeBrushType.all) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, currentManualAttribute);
                }

                const existingAttribute = getGrowableGridData<Color>(win[Keys.manualAttributes][layer.id], cursorX, cursorY) || {
                    ink: 0,
                    paper: 7,
                    bright: false
                };
                if (currentAttributeBrushType === AttributeBrushType.ink) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        ink: currentManualAttribute.ink
                    });
                }
                if (currentAttributeBrushType === AttributeBrushType.paper) {
                    win[Keys.manualAttributes][layer.id] = setGrowableGridData(win[Keys.manualAttributes][layer.id], cursorX, cursorY, {
                        ...existingAttribute,
                        paper: currentManualAttribute.paper
                    });
                }
                if (currentAttributeBrushType === AttributeBrushType.bright) {
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
                        cursor: currentTool === ToolType.nudge ? "move" : currentTool === ToolType.export ? "not-allowed" : "none",
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
