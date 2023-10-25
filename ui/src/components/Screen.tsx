import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { setLayerX, setLayerY } from "../store/layersSlice";
import { repaint } from '../store/repaintSlice';
import { setZoom } from '../store/toolsSlice';
import { Color, DragState, Layer, Nullable, PixelationType, Rgb, ToolType, Undefinable } from "../types";
import { spectrumColor } from '../utils/colors';
import { setGrowableGridData } from '../utils/growableGridManager';
import { addAttributeGridUi, addMaskUiToLayer, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { applyRange2DExclusive, booleanOrNull, getLayerXYFromScreenCoordinates, getWindow, safeZero } from "../utils/utils";

const win = getWindow();

export const Screen = () => {

    const screenRef = useRef<HTMLDivElement>(null);

    const [showMiniMap, setShowMiniMap] = useState(true);

    const currentZoom = useAppSelector((state) => state.tools.zoom);
    const currentCrisp = useAppSelector((state) => state.tools.crisp);
    const currentTool = useAppSelector((state) => state.tools.tool);
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

        applyRange2DExclusive(192, 255, (y, x) => {

            let pixel: Nullable<boolean> = null;
            let attribute: Nullable<Color> = null;

            let topmostAdjustedPixel: Nullable<Rgb> = null;

            let renderedPixel: Nullable<Rgb> = null;

            for (const layer of layers) {
                if (layer.shown === false) continue;
                if (layer.pixelate !== PixelationType.none) {

                    pixel = booleanOrNull(win.pixels?.[layer.id]?.[y][x]);
                    if (pixel === null) continue;
                    attribute = (
                        win.attributes
                        && win.attributes?.[layer.id]
                        && win.attributes?.[layer.id]?.[Math.floor(y / 8)]
                    )
                        ? win.attributes?.[layer.id]?.[Math.floor(y / 8)][Math.floor(x / 8)]
                        : null;
                } else {
                    if (
                        topmostAdjustedPixel === null
                        && win.adjustedPixels[layer.id]
                        && win.adjustedPixels[layer.id]?.[y]
                    ) {
                        topmostAdjustedPixel = win.adjustedPixels[layer.id]?.[y][x] || null;
                    }
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

            imageData.data[offset] = renderedPixel[0];
            imageData.data[offset + 1] = renderedPixel[1];
            imageData.data[offset + 2] = renderedPixel[2];
            imageData.data[offset + 3] = 255;
        });

        miniMapCtx && miniMapCtx.putImageData(miniMapImageData, 0, 0);
        screenCtx.putImageData(imageData, 0, 0);
    };

    const [mouseDownState, setMouseDownState] = useState(false);

    const [dragState, setDragState] = useState<DragState>({
        dragging: false,
        dragPreviousX: undefined,
        dragPreviousY: undefined
    })

    const handleMouse = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, mouseDown: Undefinable<boolean> = undefined) => {
        if (!activeLayer) {
            return;
        }

        const layer = activeLayer as unknown as Layer;

        if (currentTool === ToolType.mask) {
            if (mouseDown === true || mouseDown === false) {
                setMouseDownState(mouseDown);
            }
            if (mouseDown || (!mouseDown && mouseDownState)) {
                const middleX = (event.clientX - event.currentTarget.getBoundingClientRect().left) / currentZoom;
                const middleY = (event.clientY - event.currentTarget.getBoundingClientRect().top) / currentZoom;
                const halfBrushSize = currentBrushSize / 2;

                for (let brushY = middleY - halfBrushSize; brushY < middleY + halfBrushSize; brushY += 0.1) {
                    for (let brushX = middleX - halfBrushSize; brushX < middleX + halfBrushSize; brushX += 0.1) {
                        const { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, brushX, brushY);
                        if (
                            layerX >= 0
                            && layerX < safeZero(layer.originalWidth)
                            && layerY >= 0
                            && layerY < safeZero(layer.originalHeight)
                            && (
                                currentBrushShape === "block"
                                || Math.sqrt( // circle brush
                                    Math.pow(middleX - brushX, 2)
                                    + Math.pow(middleY - brushY, 2)
                                ) < halfBrushSize
                            )
                        ) {
                            setGrowableGridData(
                                win._maskData[layer.id],
                                layerX,
                                layerY,
                                !(event.button !== 0 || event.altKey)
                                    ? true
                                    : undefined
                            );
                        }
                    }
                }
                dispatch(repaint());
            }
        }

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
                    onMouseLeave={handleMouseNotDown}
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
