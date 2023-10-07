import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import * as R from "ramda";

import { repaint } from "../store/layersSlice";
import {
    setAttributeGridOpacity,
    setBrushShape,
    setBrushSize,
    setCrispScaling,
    setTool,
    setZoom
} from "../store/toolsSlice";
import { BrushShape, ToolType } from "../types";
import { getWindow, safeZero } from '../utils';
import { Button, Input } from './CustomElements';

export const Toolbar = () => {

    const tool = useAppSelector((state) => state.tools.tool);
    const brushSize = useAppSelector((state) => state.tools.brushSize);
    const brushShape = useAppSelector((state) => state.tools.brushShape);
    const zoom = useAppSelector((state) => state.tools.zoom);
    const attributeGridOpacity = useAppSelector((state) => state.tools.attributeGridOpacity);
    const crisp = useAppSelector((state) => state.tools.crisp);

    const layers = useAppSelector((state) => state.layers.layers);

    const dispatch = useAppDispatch();

    const updateMaskData = (updateFunc: (previousValue: boolean) => boolean) => {
        const activeLayer = R.find(
            layer => layer.active,
            layers
        );

        const win = getWindow();

        if (
            activeLayer
            && win._maskData
            && win._maskData[activeLayer.id]
        ) {
            for (let y = 0; y < safeZero(activeLayer.originalHeight); y++) {
                for (let x = 0; x < safeZero(activeLayer.originalWidth); x++) {
                    win._maskData[activeLayer.id][x + y * safeZero(activeLayer.originalWidth)] =
                        updateFunc(
                            win._maskData[activeLayer.id][x + y * safeZero(activeLayer.originalWidth)]
                        );
                }
            }
            dispatch(repaint());
        }
    }

    const invertActiveLayerMaskData = () => {
        updateMaskData((previousValue) => !previousValue);
    }

    const clearActiveLayerMaskData = () => {
        updateMaskData(() => false);
    }

    const reset = () => {
        localStorage.clear();
        window.location.reload();
    }

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
                    icon={brushShape === BrushShape.block ? "brightness_1" : "square"}
                    tooltip="Click to change tool"
                    onClick={() => dispatch(setBrushShape(brushShape === BrushShape.block ? BrushShape.circle : BrushShape.block))} />

                {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                    key={newBrushSize}
                    dimmed={brushSize !== newBrushSize}
                    content={`${newBrushSize}`}
                    tooltip={`Use ${newBrushSize}x${newBrushSize} brush`}
                    onClick={() => dispatch(setBrushSize(newBrushSize))} />)}

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
                content={`${zoomLevel}`}
                tooltip={`Show picture using ${zoomLevel}x${zoomLevel} pixels`}
                onClick={() => dispatch(setZoom(zoomLevel))} />
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
                tooltip="Reset everything"
                className="reset"
                onClick={reset} />

        </div>
    );
};
