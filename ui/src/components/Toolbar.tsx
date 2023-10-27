import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import * as R from "ramda";

import { useEffect } from 'react';
import { setLayerRequireAdjustedPixelsRefresh } from '../store/layersSlice';
import { repaint } from '../store/repaintSlice';
import {
    setAttributeGridOpacity,
    setBrushShape,
    setBrushSize,
    setBrushType,
    setCrispScaling,
    setTool,
    setZoom
} from "../store/toolsSlice";
import { BrushShape, BrushType, ToolType } from "../types";
import { mutateMask } from '../utils/maskManager';
import { Button, Input } from './CustomElements';

export const Toolbar = () => {

    const tool = useAppSelector((state) => state.tools.tool);
    const brushType = useAppSelector((state) => state.tools.brushType);
    const brushSize = useAppSelector((state) => state.tools.brushSize);
    const brushShape = useAppSelector((state) => state.tools.brushShape);
    const zoom = useAppSelector((state) => state.tools.zoom);
    const attributeGridOpacity = useAppSelector((state) => state.tools.attributeGridOpacity);
    const crisp = useAppSelector((state) => state.tools.crisp);

    const layers = useAppSelector((state) => state.layers.layers);

    const dispatch = useAppDispatch();

    const applyActiveLayer = (applyFunc: (oldValue: boolean) => boolean): void => {
        const activeLayer = R.find(layer => layer.active, layers);
        if (!activeLayer) {
            return;
        }

        mutateMask(activeLayer, applyFunc);

        dispatch(setLayerRequireAdjustedPixelsRefresh({ layer: activeLayer, required: true }));
        dispatch(repaint());
    }

    const invertActiveLayerMaskData = () => applyActiveLayer(oldValue => !oldValue);
    const clearActiveLayerMaskData = () => applyActiveLayer(_ => false);

    const reset = () => {
        localStorage.clear();
        window.location.reload();
    }

    const toggleBrushType = () => {
        dispatch(setBrushType(brushType === BrushType.brush ? BrushType.eraser : BrushType.brush));
    }

    const keysToBrushSize = [
        [1, 1],
        [2, 3],
        [3, 10],
        [4, 25],
        [5, 50]
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'q') {
            dispatch(setTool(ToolType.nudge));
        }
        if (event.key === 'w') {
            dispatch(setTool(ToolType.mask));
        }
        if (event.key === 'e') {
            dispatch(setTool(ToolType.attributes));
        }
        if (event.key === 'r') {
            dispatch(setTool(ToolType.attributes));
        }

        if (event.key === ' ') {
            toggleBrushType();
        }

        const brushSizeByKey = keysToBrushSize.find(ktbs => '' + ktbs[0] === event.key);
        if (brushSizeByKey) {
            dispatch(setBrushSize(brushSizeByKey[1]));
        }
    };
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [brushType]);

    return (
        <div className="Toolbar">
            <Button
                dimmed={tool !== ToolType.nudge}
                onClick={() => dispatch(setTool(ToolType.nudge))}
                icon="open_with"
                tooltip="Nudge"
                hotkey='Q'
            />
            <Button
                dimmed={tool !== ToolType.mask}
                onClick={() => dispatch(setTool(ToolType.mask))}
                icon="photo_size_select_large"
                tooltip="Mask"
                hotkey='W'
            />
            <Button
                dimmed={tool !== ToolType.attributes}
                onClick={() => dispatch(setTool(ToolType.attributes))}
                icon="gradient"
                tooltip="Pixels"
                hotkey='E'
            />
            <Button
                dimmed={tool !== ToolType.attributes}
                onClick={() => dispatch(setTool(ToolType.attributes))}
                icon="palette"
                tooltip="Attributes"
                hotkey='R'
            />

            &nbsp;

            {tool === 'nudge' ? '' : <span>
                <Button
                    icon={brushType === BrushType.eraser ? "ink_eraser" : "brush"}
                    tooltip={brushType === BrushType.eraser ? "Click on canvas to erase (space)" : "Click on cavas to draw (space)"}
                    onClick={toggleBrushType} />


                <Button
                    icon={brushShape === BrushShape.block ? "square" : "brightness_1"}
                    tooltip="Click to change tool shape"
                    onClick={() => dispatch(setBrushShape(brushShape === BrushShape.block ? BrushShape.circle : BrushShape.block))} />

                {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                    key={newBrushSize}
                    dimmed={brushSize !== newBrushSize}
                    tooltip={`Use ${newBrushSize}x${newBrushSize} brush` + (keysToBrushSize[newBrushSize] ? ` (${newBrushSize})` : '')}
                    onClick={() => dispatch(setBrushSize(newBrushSize))} >{newBrushSize}</Button>)}

                &nbsp;

                <Button onClick={() => invertActiveLayerMaskData()}
                    tooltip="Invert mask"
                    icon="invert_colors"
                />
                <Button onClick={() => clearActiveLayerMaskData()}
                    tooltip="Clear mask"
                    icon="delete"
                />

                &nbsp;
            </span>}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((zoomLevel) => <Button
                key={zoomLevel}
                dimmed={zoom !== zoomLevel}
                tooltip={`Show picture using ${zoomLevel} x${zoomLevel} pixels`}
                onClick={() => dispatch(setZoom(zoomLevel))} >{zoomLevel}</Button>
            )}

            <Button
                icon={crisp ? 'blur_off' : 'blur_on'}
                tooltip={crisp ? 'Crisp scaling' : 'Blurry scaling'}
                onClick={() => dispatch(setCrispScaling(!crisp))} />

            <Input
                tooltip="Attribute grid visibility"
                style={{ width: "50px" }}
                type="range"
                min={0}
                max={100}
                value={Math.round(attributeGridOpacity * 200)}
                onChange={(e) => dispatch(setAttributeGridOpacity(parseFloat(e.target.value) / 200))}
            />

            <Button
                icon='warning'
                tooltip={"Reset everything, lose all your work"}
                className="reset"
                onClick={reset} />

        </div>
    );
};
