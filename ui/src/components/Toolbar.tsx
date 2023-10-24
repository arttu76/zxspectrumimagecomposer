import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import * as R from "ramda";

import {
    setAttributeGridOpacity,
    setBrushShape,
    setBrushSize,
    setCrispScaling,
    setTool,
    setZoom
} from "../store/toolsSlice";
import { BrushShape, GrowableGrid, Layer, ToolType } from "../types";
import { getEmptyGrowableGrid, getGrowableGridData } from '../utils/growableGridManager';
import { getWindow, rangeExclusive } from '../utils/utils';
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

    const withActiveLayerAndMaskData = (applyFunc: (activeLayerId: Layer, mask: GrowableGrid<boolean>) => void): void => {
        const activeLayer = R.find(layer => layer.active, layers);
        if (!activeLayer) {
            return;
        }

        const win = getWindow();
        if (!win._maskData[activeLayer.id]) {
            win._maskData[activeLayer.id] = getEmptyGrowableGrid<boolean>();
        }

        applyFunc(
            activeLayer,
            win._maskData[activeLayer.id]
        );
    }

    const invertActiveLayerMaskData = () => {
        withActiveLayerAndMaskData((layer, mask) => {
            getWindow()._maskData[layer.id] = getEmptyGrowableGrid(
                rangeExclusive(layer.height || 0).map(y => rangeExclusive(layer.width || 0).map(x => {
                    const existingValue = getGrowableGridData(mask, x, y);
                    return existingValue === null
                        ? null
                        : !existingValue
                }))
            );
        });
    }

    const clearActiveLayerMaskData = () => {
        withActiveLayerAndMaskData(layer => getWindow()._maskData[layer.id] = getEmptyGrowableGrid<boolean>());
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
                    tooltip="Click to change tool shape"
                    onClick={() => dispatch(setBrushShape(brushShape === BrushShape.block ? BrushShape.circle : BrushShape.block))} />

                {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                    key={newBrushSize}
                    dimmed={brushSize !== newBrushSize}
                    tooltip={`Use ${newBrushSize}x${newBrushSize} brush`}
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
                tooltip={`Show picture using ${zoomLevel}x${zoomLevel} pixels`}
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
