import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { setLayerX, setLayerY } from "../store/layersSlice";
import { repaint } from '../store/repaintSlice';
import { setZoom } from '../store/toolsSlice';
import { BrushShape, BrushType, Color, DragState, Layer, Nullable, PixelationType, Rgb, SpectrumPixelCoordinate, ToolType, Undefinable } from "../types";
import { spectrumColor } from '../utils/colors';
import { isMaskSet, setMask } from '../utils/maskManager';
import { addAttributeGridUi, addMaskUiToLayer, addMouseCursor, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { applyRange2DExclusive, booleanOrNull, getLayerXYFromScreenCoordinates, getWindow, safeOne, safeZero } from "../utils/utils";

const win = getWindow();

export const Screen = () => {

    const screenRef = useRef<HTMLDivElement>(null);

    const [showMiniMap, setShowMiniMap] = useState(true);

    const currentZoom = useAppSelector((state) => state.tools.zoom);
    const currentCrisp = useAppSelector((state) => state.tools.crisp);
    const currentTool = useAppSelector((state) => state.tools.tool);
    const currentBrushType = useAppSelector((state) => state.tools.brushType);
    const currentBrushShape = useAppSelector((state) => state.tools.brushShape);
    const currentBrushSize = useAppSelector((state) => state.tools.brushSize);

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

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 255, (y, x) => {

            let pixel: Nullable<boolean> = null;
            let attribute: Nullable<Color> = null;

            let topmostAdjustedPixel: Nullable<Rgb> = null;

            let renderedPixel: Nullable<Rgb> = null;

            for (const layer of layers) {

                if (
                    layer.shown === false
                    || (
                        currentTool !== ToolType.mask
                        && isMaskSet(layer, x, y, true)
                    )
                ) continue;

                if (layer.pixelate === PixelationType.none) {
                    if (
                        topmostAdjustedPixel === null
                        && win.adjustedPixels[layer.id]
                        && win.adjustedPixels[layer.id]?.[y]
                    ) {
                        topmostAdjustedPixel = win.adjustedPixels[layer.id]?.[y][x] || null;
                    }
                } else {
                    pixel = booleanOrNull(win.pixels?.[layer.id]?.[y][x]);
                    if (pixel === null) continue;
                    attribute = (
                        win.attributes
                        && win.attributes?.[layer.id]
                        && win.attributes?.[layer.id]?.[Math.floor(y / 8)]
                    )
                        ? win.attributes?.[layer.id]?.[Math.floor(y / 8)][Math.floor(x / 8)]
                        : null;
                }
            }

            if (pixel === null || attribute === null) {
                renderedPixel = replaceEmptyWithBackground(topmostAdjustedPixel, x, y, bg);
            } else {
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
        }

        const mouseX = (event.clientX - event.currentTarget.getBoundingClientRect().left) / currentZoom;
        const mouseY = (event.clientY - event.currentTarget.getBoundingClientRect().top) / currentZoom;

        if (currentTool === ToolType.mask) {
            if (mouseDown === true || mouseDown === false) {
                setMouseDownState(mouseDown);
            }
            if (mouseDown || (!mouseDown && mouseDownState)) {
                const xScaler = layer.width! / safeOne(layer.originalWidth);
                const yScaler = layer.height! / safeOne(layer.originalHeight);

                const halfBrushSize = Math.floor(currentBrushSize / 2);

                applyRange2DExclusive(
                    currentBrushSize * yScaler,
                    currentBrushSize * xScaler,
                    (y, x) => {
                        const { layerX, layerY } = getLayerXYFromScreenCoordinates(
                            layer,
                            mouseX + x - halfBrushSize,
                            mouseY + y - halfBrushSize
                        );
                        if (
                            layerX >= 0 && layerX < safeZero(layer.originalWidth)
                            && layerY >= 0 && layerY < safeZero(layer.originalHeight)
                        ) {
                            const xDiff = x - halfBrushSize * xScaler;
                            const yDiff = y - halfBrushSize * yScaler;

                            const isInside = currentBrushShape === BrushShape.block
                                ? Math.abs(xDiff) < halfBrushSize * xScaler && Math.abs(yDiff) < halfBrushSize * yScaler
                                : Math.sqrt(xDiff * xDiff + yDiff * yDiff) < halfBrushSize;

                            if (isInside) {
                                setMask(layer, layerX, layerY, currentBrushType === BrushType.brush, true);
                            }
                        }
                    }
                );

                requestRepaint = true;
            }
        }

        const { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, mouseX, mouseY);
        setMouseX(_ => layerX);
        setMouseY(_ => layerY);

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
                        cursor: currentTool === "nudge" ? "move" : "default",
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
