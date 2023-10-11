import '../styles/Screen.scss';

import { useState } from "react";
import { useAppDispatch, useAppSelector } from '../store/store';

import * as R from "ramda";

import { repaint, setLayerX, setLayerY } from "../store/layersSlice";
import { DragState, Layer, PixelationType, ToolType, Undefinable } from "../types";
import { getWindow, safeOne, safeZero } from "../utils";
import { getGridData, setGridData } from '../utils/growableGridManager';

const win = getWindow();

export const Screen = () => {

    const currentZoom = useAppSelector((state) => state.tools.zoom);
    const currentCrisp = useAppSelector((state) => state.tools.crisp);
    const currentTool = useAppSelector((state) => state.tools.tool);
    const currentBrushShape = useAppSelector((state) => state.tools.brushShape);
    const currentBrushSize = useAppSelector((state) => state.tools.brushSize);

    // force updates when something is drawn by mouse handler
    useAppSelector((state) => state.layers.repaint);

    const bg = useAppSelector((state) => state.layers.background);
    const attributeGridOpacity = useAppSelector((state) => state.tools.attributeGridOpacity);
    const layers = useAppSelector((state) => state.layers.layers);
    const activeLayer = layers.find(layer => layer.active) || null;

    const dispatch = useAppDispatch();

    const getLayerXYFromScreenCoordinates = (layer: Layer, x: number, y: number) => {
        const layerOffsetX = Math.floor((x - layer.x) * (safeZero(layer.originalWidth) / safeOne(layer.width)));
        const layerOffsetY = Math.floor((y - layer.y) * (safeZero(layer.originalHeight) / safeOne(layer.height)));

        let layerX = layerOffsetX - safeZero(layer.originalWidth) / 2;
        let layerY = layerOffsetY - safeZero(layer.originalHeight) / 2;

        if (layer.rotate) {
            const radians = layer.rotate * -0.0174533;
            let rotatedX = layerX * Math.cos(radians) - layerY * Math.sin(radians);
            let rotatedY = layerX * Math.sin(radians) + layerY * Math.cos(radians);
            layerX = rotatedX;
            layerY = rotatedY;
        }

        return {
            layerX: Math.floor(safeZero(layer.originalWidth) / 2 + layerX),
            layerY: Math.floor(safeZero(layer.originalWidth) / 2 + layerY)
        }
    }

    const canvasRef = (canvas: HTMLCanvasElement) => {
        if (canvas === null) {
            return;
        }

        const ctx = canvas.getContext("2d")!;
        const imageData = ctx.createImageData(255, 192);

        let layerPatternCache = [];
        for (let idx = 0; idx < layers.length; idx++) {
            layerPatternCache[idx] = R.map(
                brightness => R.reduce(
                    (acc, pattern) => (acc !== layers[idx].patterns[layers[idx].patterns.length - 1].pattern)
                        ? acc // already chose something other than the last pattern
                        : brightness < pattern.limit ? pattern.pattern : acc,
                    layers[idx].patterns.length ? layers[idx].patterns[layers[idx].patterns.length - 1].pattern : [],
                    R.init(layers[idx].patterns)
                ),
                R.range(0, 256)
            );
        }

        let ditheringErrorBuffer: number[][] = Array.from({ length: 192 + 2 }, () => Array(256 + 2).fill(0));

        for (let y = 0; y < 192; y++) {
            for (let x = 0; x < 255; x++) {

                let rgb = null;

                for (let idx = 0; idx < layers.length; idx++) {
                    const layer = layers[idx];

                    if (!win._imageData || (typeof win._imageData[layer.src]) !== 'object') {
                        continue;
                    }


                    const { layerX, layerY } = getLayerXYFromScreenCoordinates(layer, x, y);

                    if (
                        rgb === null
                        && layer.loaded
                        && layer.shown
                        && layerX >= 0
                        && layerX < safeZero(layer.originalWidth)
                        && layerY >= 0
                        && layerY < safeZero(layer.originalHeight)
                        && (
                            currentTool === ToolType.mask
                            || !getGridData(win._maskData[layer.id], layerX, layerY)
                        )
                    ) {
                        const layerOffset = (layerX + layerY * safeZero(layer.originalWidth)) * 3;
                        rgb = [
                            win._imageData[layer.src][layerOffset],
                            win._imageData[layer.src][layerOffset + 1],
                            win._imageData[layer.src][layerOffset + 2]
                        ];

                        // invert
                        if (layer.invert) {
                            rgb = [
                                255 - rgb[0],
                                255 - rgb[1],
                                255 - rgb[2]
                            ];
                        }

                        // color
                        const grayscale = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
                        const color = layer.saturation / 100;
                        const icolor = 1 - color;
                        rgb = [
                            rgb[0] * color + grayscale * icolor,
                            rgb[1] * color + grayscale * icolor,
                            rgb[2] * color + grayscale * icolor
                        ];

                        rgb[0] = Math.min(255, Math.max(0, Math.round(rgb[0] * layer.red / 100)));
                        rgb[1] = Math.min(255, Math.max(0, Math.round(rgb[1] * layer.green / 100)));
                        rgb[2] = Math.min(255, Math.max(0, Math.round(rgb[2] * layer.blue / 100)));

                        // brightness
                        rgb[0] = rgb[0] + layer.brightness;
                        rgb[1] = rgb[1] + layer.brightness;
                        rgb[2] = rgb[2] + layer.brightness;

                        // contrast
                        const contrastFactor = (259 * (layer.contrast + 255)) / (255 * (259 - layer.contrast));
                        const calculateContrast = (value: number) => Math.min(255, Math.max(0,
                            contrastFactor * (value - 128) + 128
                        ));
                        rgb = [
                            calculateContrast(rgb[0]),
                            calculateContrast(rgb[1]),
                            calculateContrast(rgb[2])
                        ];

                        const intensity = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114);
                        if (layer.pixelate === PixelationType.simple) {
                            const value = intensity > 128 ? 255 : 0;
                            rgb = [value, value, value];
                        }
                        if (layer.pixelate === PixelationType.noise) {
                            const deterministic = Math.sin(x + y * 255) * 10000;
                            const value = (deterministic - Math.floor(deterministic)) * 255 > intensity ? 0 : 255;
                            rgb = [value, value, value];
                        }
                        if (layer.pixelate === PixelationType.floydsteinberg) {
                            // error buffer has one pixel margin so we don't need to check for x>0 or y<192 etc
                            const errorBufferX = x + 1;
                            const errorBufferY = y + 1;
                            const value = ((ditheringErrorBuffer[errorBufferY][errorBufferX] || 0) + intensity) > 128 ? 255 : 0;
                            const error = intensity - value;
                            ditheringErrorBuffer[errorBufferY][errorBufferX + 1] = error * 7 / 16;
                            ditheringErrorBuffer[errorBufferY + 1][errorBufferX - 1] = error * 3 / 16;
                            ditheringErrorBuffer[errorBufferY + 1][errorBufferX] = error * 5 / 16;
                            ditheringErrorBuffer[errorBufferY + 1][errorBufferX + 1] = error * 1 / 16;
                            rgb = [value, value, value];
                        }
                        if (layer.pixelate === PixelationType.pattern) {
                            const correctPattern = layerPatternCache[idx][Math.round(intensity)];
                            if (correctPattern.length === 0) {
                                const value = intensity > 128 ? 255 : 0;
                                rgb = [value, value, value];
                            } else {
                                const patternRow = correctPattern[y % correctPattern.length];
                                const pixel = patternRow[x % patternRow.length] ? 255 : 0;
                                rgb = [pixel, pixel, pixel];
                            }
                        }

                        if (
                            currentTool === ToolType.mask
                            && getGridData(win._maskData[layer.id], x, y)
                        ) {
                            rgb = [
                                Math.round(255 * 0.8 + rgb[0] * 0.2),
                                Math.round(0 * 0.8 + rgb[0] * 0.2),
                                Math.round(0 * 0.8 + rgb[0] * 0.2),
                            ];
                        }
                    }
                }

                if (rgb === null && bg > -1) {
                    rgb = [
                        [0, 0, 0],
                        [0, 0, 196],
                        [196, 0, 0],
                        [196, 0, 196],
                        [0, 196, 0],
                        [0, 196, 196],
                        [196, 196, 0],
                        [196, 196, 196]
                    ][bg];
                }
                if (rgb === null) {
                    const base = 128
                        + Math.floor(((x / 8) + Math.floor((y / 8) % 2)) % 2) * 64
                        + (x + y % 2) % 2 * 34;
                    rgb = [base, base, base];
                }

                if (attributeGridOpacity > 0) {
                    const evenX = (x % 16 < 8);
                    const evenY = (y % 16 < 8);
                    const target = ((evenX && !evenY) || (!evenX && evenY)) ? 255 : 0;
                    rgb[0] = Math.round(rgb[0] * (1 - attributeGridOpacity) + target * attributeGridOpacity);
                    rgb[1] = Math.round(rgb[1] * (1 - attributeGridOpacity) + target * attributeGridOpacity);
                    rgb[2] = Math.round(rgb[2] * (1 - attributeGridOpacity) + target * attributeGridOpacity);
                }

                const offset = (y * 255 + x) * 4;
                imageData.data[offset] = rgb[0];
                imageData.data[offset + 1] = rgb[1];
                imageData.data[offset + 2] = rgb[2];
                imageData.data[offset + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
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
                            setGridData(
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
        <div className="Screen">
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
        </div>
    );
};
