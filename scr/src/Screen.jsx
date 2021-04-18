import React, {useState} from "react";
import {useDispatch, useSelector} from "react-redux";

import * as R from "ramda";
import {repaint, setLayerX, setLayerY} from "./layersSlice";

export const Screen = () => {
    const currentZoom = useSelector((state) => state.tools.zoom);
    const currentCrisp = useSelector((state) => state.tools.crisp);
    const currentTool = useSelector((state) => state.tools.tool);
    const currentBrushShape = useSelector((state) => state.tools.brushShape);
    const currentBrushSize = useSelector((state) => state.tools.brushSize);

    // force updates when something is drawn by mouse handler
    useSelector((state) => state.layers.repaint);

    const bg = useSelector((state) => state.layers.background);
    const attributeGrid = useSelector((state) => state.layers.attributeGrid);
    const layers = useSelector((state) => state.layers.layers);

    const dispatch = useDispatch();

    const getLayerXYFromScreenCoordinates = (layer, x, y) => {
        const layerOffsetX = Math.floor((x - layer.x) * (layer.originalWidth / layer.width));
        const layerOffsetY = Math.floor((y - layer.y) * (layer.originalHeight / layer.height));

        let layerX = layerOffsetX - layer.originalWidth / 2;
        let layerY = layerOffsetY - layer.originalHeight / 2;

        if (layer.rotate) {
            const radians = layer.rotate * -0.0174533;
            let rotatedX = layerX * Math.cos(radians) - layerY * Math.sin(radians);
            let rotatedY = layerX * Math.sin(radians) + layerY * Math.cos(radians);
            layerX = rotatedX;
            layerY = rotatedY;
        }

        return {
            layerX: Math.floor(layer.originalWidth / 2 + layerX),
            layerY: Math.floor(layer.originalWidth / 2 + layerY)
        }
    }

    const canvasRef = (canvas) => {
        if (canvas === null) {
            return;
        }

        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(255, 192);

        for (let y = 0; y < 192; y++) {
            for (let x = 0; x < 255; x++) {

                let rgb = null;

                for (let idx = 0; idx < layers.length; idx++) {
                    const layer = layers[idx];
                    const {layerX, layerY} = getLayerXYFromScreenCoordinates(layer, x, y);
                    /*
                                        const layerOffsetX = Math.floor((x - layer.x) * (layer.originalWidth / layer.width));
                                        const layerOffsetY = Math.floor((y - layer.y) * (layer.originalHeight / layer.height));


                                        let layerX = layerOffsetX - layer.originalWidth / 2;
                                        let layerY = layerOffsetY - layer.originalHeight / 2;

                                        if (layer.rotate) {
                                            const radians = layer.rotate * -0.0174533;
                                            let rotatedX = layerX * Math.cos(radians) - layerY * Math.sin(radians);
                                            let rotatedY = layerX * Math.sin(radians) + layerY * Math.cos(radians);
                                            layerX = rotatedX;
                                            layerY = rotatedY;
                                        }

                                        layerX = Math.floor(layer.originalWidth / 2 + layerX);
                                        layerY = Math.floor(layer.originalWidth / 2 + layerY);
                    */
                    if (
                        rgb === null
                        && layer.loaded
                        && layer.shown
                        && layerX >= 0
                        && layerX < layer.originalWidth
                        && layerY >= 0
                        && layerY < layer.originalHeight
                        && (
                            currentTool === "mask"
                            || (
                                window._maskData
                                && window._maskData[layer.id]
                                && !window._maskData[layer.id][layerX + layerY * layer.originalWidth]
                            )
                        )
                    ) {
                        const layerOffset = (layerX + layerY * layer.originalWidth) * 3;
                        rgb = [
                            window._imageData[layer.src][layerOffset],
                            window._imageData[layer.src][layerOffset + 1],
                            window._imageData[layer.src][layerOffset + 2]
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
                        const color = layer.color / 100;
                        const icolor = 1 - color;
                        rgb = [
                            rgb[0] * color + grayscale * icolor,
                            rgb[1] * color + grayscale * icolor,
                            rgb[2] * color + grayscale * icolor
                        ];

                        // brightness
                        rgb[0] = rgb[0] + layer.brightness;
                        rgb[1] = rgb[1] + layer.brightness;
                        rgb[2] = rgb[2] + layer.brightness;

                        // contrast
                        const contrastFactor = (259 * (layer.contrast + 255)) / (255 * (259 - layer.contrast));
                        const calculateContrast = value => Math.min(255, Math.max(0,
                            contrastFactor * (value - 128) + 128
                        ));
                        rgb = [
                            calculateContrast(rgb[0]),
                            calculateContrast(rgb[1]),
                            calculateContrast(rgb[2])
                        ];

                        if (layer.pixelate === 'simple') {
                            const base = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) > 128 ? 255 : 0;
                            rgb = [base, base, base];
                        }
                        if (layer.pixelate === 'noise') {
                            const base = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114);
                            const deterministic = Math.sin(x + y * 255) * 10000;
                            const pixel = (deterministic - Math.floor(deterministic)) * 255 > base ? 0 : 255;
                            rgb = [pixel, pixel, pixel];
                        }

                        if (
                            currentTool === "mask"
                            && window._maskData[layer.id][layerX + layerY * layer.originalWidth]
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

                if (attributeGrid) {
                    const evenX = (x % 16 < 8);
                    const evenY = (y % 16 < 8);
                    const target = ((evenX && !evenY) || (!evenX && evenY)) ? 255 : 0;
                    rgb[0] = Math.round(rgb[0] * 0.8 + target * 0.2);
                    rgb[1] = Math.round(rgb[1] * 0.8 + target * 0.2);
                    rgb[2] = Math.round(rgb[2] * 0.8 + target * 0.2);
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

    const getActiveLayer = () => R.find(
        R.propEq('active', true),
        layers
    ) || null;

    const [mouseDownState, setMouseDownState] = useState({
        mouseDown: false
    })

    const [dragState, setDragState] = useState({
        dragging: false,
        dragPreviousX: null,
        dragPreviousY: null
    })

    const mouseHandler = (event, mouseDown) => {
        const layer = getActiveLayer();
        if (!layer) {
            return;
        }

        if (currentTool === "mask") {
            if (mouseDown === true || mouseDown === false) {
                setMouseDownState({mouseDown: mouseDown});
            }
            if (mouseDown || (!mouseDown && mouseDownState.mouseDown)) {
                const middleX = (event.clientX - event.target.getBoundingClientRect().left) / currentZoom;
                const middleY = (event.clientY - event.target.getBoundingClientRect().top) / currentZoom;
                const halfBrushSize = currentBrushSize / 2;

                for (let brushY = middleY - halfBrushSize; brushY < middleY + halfBrushSize; brushY += 0.1) {
                    for (let brushX = middleX - halfBrushSize; brushX < middleX + halfBrushSize; brushX += 0.1) {
                        const {layerX, layerY} = getLayerXYFromScreenCoordinates(layer, brushX, brushY);
                        if (
                            layerX >= 0
                            && layerX < layer.originalWidth
                            && layerY >= 0
                            && layerY < layer.originalHeight
                            && (
                                currentBrushShape === "block"
                                || Math.sqrt( // circle brush
                                    Math.pow(middleX - brushX, 2)
                                    + Math.pow(middleY - brushY, 2)
                                ) < halfBrushSize
                            )
                        ) {
                            window._maskData[layer.id][
                            layerX + layerY * layer.originalWidth
                                ] = !(event.button !== 0 || event.altKey);
                        }
                    }
                }
                dispatch(repaint());
            }
        }

        if (currentTool === "nudge") {
            const nowDragging = mouseDown === null ? dragState.dragging : mouseDown;

            let dragPreviousX = mouseDown ? event.clientX : dragState.dragPreviousX;
            let dragPreviousY = mouseDown ? event.clientY : dragState.dragPreviousY;

            if (nowDragging) {
                if (dragPreviousX !== null && dragPreviousY !== null) {
                    const diffX = event.clientX - dragPreviousX;
                    const diffY = event.clientY - dragPreviousY;

                    if (Math.abs(diffX) > 0) {
                        dispatch(setLayerX({layer, x: Math.round(layer.x + diffX / currentZoom)}));
                    }
                    if (Math.abs(diffY) > 0) {
                        dispatch(setLayerY({layer, y: Math.round(layer.y + diffY / currentZoom)}));
                    }
                }
                dragPreviousX = event.clientX;
                dragPreviousY = event.clientY;
            }

            setDragState({
                dragging: nowDragging,
                dragPreviousX,
                dragPreviousY
            });
        }
    }

    return (
        <div>
            <div style={{position: 'relative', width: 255 * currentZoom, height: 192 * currentZoom}}>
                <canvas
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        cursor: currentTool === "nudge" ? "move" : "default",
                        transformOrigin: "top left",
                        transform: "scale(" + currentZoom + ")",
                        imageRendering: currentCrisp ? "pixelated" : "inherit"
                    }}
                    width={255}
                    height={192}
                    ref={canvasRef}
                    onMouseDown={(e) => mouseHandler(e, true)}
                    onMouseUp={(e) => mouseHandler(e, false)}
                    onMouseLeave={(e) => mouseHandler(e, false)}
                    onMouseMove={(e) => mouseHandler(e, null)}
                ></canvas>
            </div>
        </div>
    );
};
