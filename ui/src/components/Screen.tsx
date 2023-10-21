import '../styles/Screen.scss';

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import React from 'react';
import { repaint, setLayerX, setLayerY } from "../store/layersSlice";
import { setZoom } from '../store/toolsSlice';
import { DragState, Layer, Nullable, PixelationType, Rgb, ToolType, Undefinable } from "../types";
import { spectrumColor } from '../utils/colors';
import { isDitheredPixelSet } from '../utils/dithering';
import { setGrowableGridData } from '../utils/growableGridManager';
import { getDitheringContextAttributeBlockColor, initializeLayerContext } from '../utils/layerContextManager';
import { addAttributeGridUi, addMaskUiToLayer, replaceEmptyWithBackground } from '../utils/uiPixelOperations';
import { getLayerXYFromScreenCoordinates, getWindow, rangeExclusive, safeZero } from "../utils/utils";

const win = getWindow();

export const Screen = () => {

    const screenRef = useRef<HTMLDivElement>(null);

    const [showMiniMap, setShowMiniMap] = useState(true);

    const currentZoom = useAppSelector((state) => state.tools.zoom);
    const currentCrisp = useAppSelector((state) => state.tools.crisp);
    const currentTool = useAppSelector((state) => state.tools.tool);
    const currentBrushShape = useAppSelector((state) => state.tools.brushShape);
    const currentBrushSize = useAppSelector((state) => state.tools.brushSize);

    // force updates when something is drawn by mouse handler
    useAppSelector((state) => state.layers.repaint);

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

        const ditheringContexts = layers
            .map(layer => initializeLayerContext(layer, currentTool))
            .reverse();

        console.clear();

        rangeExclusive(192, y => rangeExclusive(255, x => {
            let renderedPixel: Nullable<Rgb> = null;

            if (true || y > 13 * 8 + 1 && y < 13 * 8 + 3 && x > 10 * 8 && x < 11 * 8 - 3) {

                ditheringContexts.forEach((ditheringContext) => {
                    const attribute = getDitheringContextAttributeBlockColor(ditheringContext, x, y);
                    if (
                        ditheringContext.layer.pixelate !== PixelationType.none
                        && attribute
                    ) {
                        const colors = attribute.bright
                            ? spectrumColor.bright
                            : spectrumColor.normal;
                        renderedPixel = isDitheredPixelSet(ditheringContext, x, y)
                            ? colors[attribute.ink]
                            : colors[attribute.paper]

                    } else {
                        renderedPixel = ditheringContext.adjustedPixels[y][x];
                    }
                });
            } else {
                renderedPixel = [255, 0, 0]
            }

            renderedPixel = replaceEmptyWithBackground(renderedPixel, x, y, bg);
            renderedPixel = addMaskUiToLayer(renderedPixel, activeLayer, currentTool, x, y);

            const offset = (y * 255 + x) * 4;
            if (miniMapCtx && miniMapImageData) {
                miniMapImageData.data[offset] = renderedPixel[0];
                miniMapImageData.data[offset + 1] = renderedPixel[1];
                miniMapImageData.data[offset + 2] = renderedPixel[2];
                miniMapImageData.data[offset + 3] = 255;
            }

            renderedPixel = addAttributeGridUi(attributeGridOpacity, renderedPixel, x, y);

            imageData.data[offset] = renderedPixel[0];
            imageData.data[offset + 1] = renderedPixel[1];
            imageData.data[offset + 2] = renderedPixel[2];
            imageData.data[offset + 3] = 255;
        }));

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
    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => handleMouse(event, false);

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
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouse}
                ></canvas>
            </div>
            {currentZoom > 1 && <canvas
                className={`miniMap${showMiniMap ? ' show' : ' hide'}`}
                onClick={() => setShowMiniMap(!showMiniMap)}
                width={255}
                height={192}
                ref={miniMapCanvasRef}
            ></canvas>}
        </div>
    );
};
