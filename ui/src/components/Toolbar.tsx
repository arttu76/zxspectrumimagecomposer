import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import * as R from "ramda";

import { useEffect } from 'react';
import { setLayerRequireAdjustedPixelsRefresh } from '../store/layersSlice';
import { repaint } from '../store/repaintSlice';
import {
    setAttributeBrushType,
    setAttributeGridOpacity,
    setBrushShape,
    setBrushSize,
    setCrispScaling,
    setHideManualAttributes,
    setHideManualPixels,
    setHideSourceImage,
    setManualAttribute,
    setMaskBrushType,
    setPixelBrushType,
    setTool,
    setZoom
} from "../store/toolsSlice";
import { AttributeBrushType, BrushShape, MaskBrushType, PixelBrushType, ToolType } from "../types";
import { mutateMask } from '../utils/maskManager';
import { ColorPicker } from './ColorPicker';
import { Button, Input } from './CustomElements';
import { Group } from './Group';

export const Toolbar = () => {

    const tool = useAppSelector((state) => state.tools.tool);
    const maskBrushType = useAppSelector((state) => state.tools.maskBrushType);
    const pixelBrushType = useAppSelector((state) => state.tools.pixelBrushType);
    const attributeBrushType = useAppSelector((state) => state.tools.attributeBrushType);
    const brushSize = useAppSelector((state) => state.tools.brushSize);
    const brushShape = useAppSelector((state) => state.tools.brushShape);
    const manualAttribute = useAppSelector((state) => state.tools.manualAttribute);
    const zoom = useAppSelector((state) => state.tools.zoom);
    const crisp = useAppSelector((state) => state.tools.crisp);
    const hideSourceImage = useAppSelector((state) => state.tools.hideSourceImage);
    const hideManualPixels = useAppSelector((state) => state.tools.hideManualPixels);
    const hideManualAttributes = useAppSelector((state) => state.tools.hideManualAttributes);
    const attributeGridOpacity = useAppSelector((state) => state.tools.attributeGridOpacity);

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
            dispatch(setTool(ToolType.pixels));
        }
        if (event.key === 'r') {
            dispatch(setTool(ToolType.attributes));
        }
        if (event.key === 't') {
            dispatch(setTool(ToolType.attributes));
        }

        if (tool === ToolType.mask) {
            if (event.key === 'a') dispatch(setMaskBrushType(MaskBrushType.eraser));
            if (event.key === 's') dispatch(setMaskBrushType(MaskBrushType.brush));
        }

        if (tool === ToolType.pixels) {
            if (event.key === 'a') dispatch(setPixelBrushType(PixelBrushType.eraser));
            if (event.key === 's') dispatch(setPixelBrushType(PixelBrushType.ink));
            if (event.key === 'd') dispatch(setPixelBrushType(PixelBrushType.paper));
        }

        if (tool === ToolType.attributes) {
            if (event.key === 'a') dispatch(setAttributeBrushType(AttributeBrushType.eraser));
            if (event.key === 's') dispatch(setAttributeBrushType(AttributeBrushType.all));
            if (event.key === 'd') dispatch(setAttributeBrushType(AttributeBrushType.ink));
            if (event.key === 'f') dispatch(setAttributeBrushType(AttributeBrushType.paper));
            if (event.key === 'g') dispatch(setAttributeBrushType(AttributeBrushType.bright));
        }

        const brushSizeByKey = keysToBrushSize.find(ktbs => '' + ktbs[0] === event.key);
        if (brushSizeByKey) {
            dispatch(setBrushSize(brushSizeByKey[1]));
        }

        if (event.key === 'v') {
            dispatch(setAttributeGridOpacity(attributeGridOpacity > 0.1 ? 0 : attributeGridOpacity + 0.05));
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [tool, maskBrushType, pixelBrushType, attributeBrushType, attributeGridOpacity]);

    return (
        <div className="Toolbar">
            <Group title="Tools" disableClose={true}>
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
                    dimmed={tool !== ToolType.pixels}
                    onClick={() => dispatch(setTool(ToolType.pixels))}
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
                <Button
                    dimmed={tool !== ToolType.export}
                    onClick={() => dispatch(setTool(ToolType.export))}
                    icon="ios_share"
                    tooltip="Export"
                    hotkey='T'
                />
            </Group>

            {tool === ToolType.mask && <>
                <Group title="Mask brush" disableClose={true}>
                    <Button
                        dimmed={maskBrushType !== MaskBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Mask eraser tool (a)"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.eraser))} />
                    <Button
                        dimmed={maskBrushType !== MaskBrushType.brush}
                        icon="brush"
                        tooltip="Mask draw tool (s)"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.brush))} />
                </Group>
            </>}
            {tool === ToolType.pixels && <>
                <Group title="Pixel brush" disableClose={true}>
                    <Button
                        dimmed={pixelBrushType !== PixelBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Erase ink & paper (a)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.eraser))} />
                    <Button
                        dimmed={pixelBrushType !== PixelBrushType.ink}
                        icon="border_color"
                        tooltip="Set pixels as ink (s)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.ink))} />
                    <Button
                        dimmed={pixelBrushType !== PixelBrushType.paper}
                        icon="check_box_outline_blank"
                        tooltip="Set pixels as paper (d)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.paper))} />
                </Group>
            </>}
            {tool === ToolType.attributes && <>
                <Group title="Attribute brush" disableClose={true}>
                    <Button
                        dimmed={attributeBrushType !== AttributeBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Erase attribute (a)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.eraser))} />
                    <Button
                        dimmed={attributeBrushType !== AttributeBrushType.all}
                        icon="filter_3"
                        tooltip="Set ink, paper and brightness (s)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.all))} />
                    <Button
                        dimmed={attributeBrushType !== AttributeBrushType.ink}
                        icon="border_color"
                        tooltip="Set ink color only (d)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.ink))} />
                    <Button
                        dimmed={attributeBrushType !== AttributeBrushType.paper}
                        icon="check_box_outline_blank"
                        tooltip="Set paper color only (f)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.paper))} />
                    <Button
                        dimmed={attributeBrushType !== AttributeBrushType.bright}
                        icon="light_mode"
                        tooltip="Set brightness only (g)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.bright))} />
                </Group>
                <Group className="ManualAttributeGroup" title="Attribute color" disableClose={true}>
                    <ColorPicker title=''
                        color={manualAttribute}
                        allowInvert={true}
                        chooseColor={(color) => dispatch(setManualAttribute(color))} />
                </Group>
            </>}
            {(tool === ToolType.mask || tool === ToolType.pixels) && <>
                <Group title="Brush size" disableClose={true}>
                    <Button
                        icon={brushShape === BrushShape.block ? "square" : "brightness_1"}
                        tooltip="Click to change tool shape"
                        onClick={() => dispatch(setBrushShape(brushShape === BrushShape.block ? BrushShape.circle : BrushShape.block))} />

                    {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                        key={newBrushSize}
                        dimmed={brushSize !== newBrushSize}
                        tooltip={`Use ${newBrushSize}x${newBrushSize} brush` + (keysToBrushSize[newBrushSize] ? ` (${newBrushSize})` : '')}
                        onClick={() => dispatch(setBrushSize(newBrushSize))} >{newBrushSize}</Button>)}
                </Group>
            </>}

            {tool === ToolType.mask && <>
                <Group title="Mask" disableClose={true}>

                    <Button onClick={() => invertActiveLayerMaskData()}
                        tooltip="Invert mask"
                        icon="invert_colors"
                    />
                    <Button onClick={() => clearActiveLayerMaskData()}
                        tooltip="Clear mask"
                        icon="delete"
                    />
                </Group>
            </>}

            <Group title="Zoom" disableClose={true}>
                {[1, 2, 3, 4, 5, 10, 20].map((zoomLevel) => <Button
                    key={zoomLevel}
                    dimmed={zoom !== zoomLevel}
                    tooltip={`Show picture using ${zoomLevel} x${zoomLevel} pixels`}
                    onClick={() => dispatch(setZoom(zoomLevel))} >{zoomLevel}</Button>
                )}
            </Group>

            <Group title="Visibility" disableClose={true}>
                <Button
                    dimmed={hideSourceImage}
                    icon="image"
                    tooltip={hideSourceImage ? 'Source image is hidden' : 'Source image is displayed'}
                    onClick={() => dispatch(setHideSourceImage(!hideSourceImage))} />
                <Button
                    dimmed={hideManualPixels}
                    icon="gradient"
                    tooltip={hideManualPixels ? 'Manually drawn pixels are hidden' : 'Manually drawn pixels are displayed'}
                    onClick={() => dispatch(setHideManualPixels(!hideManualPixels))} />
                <Button
                    dimmed={hideManualAttributes}
                    icon="palette"
                    tooltip={hideManualAttributes ? 'Manually drawn attributes are hidden' : 'Manually drawn attributes are displayed'}
                    onClick={() => dispatch(setHideManualAttributes(!hideManualAttributes))} />
            </Group>

            <Group title="Display" disableClose={true}>
                <Input
                    tooltip="Attribute grid visibility (v)"
                    style={{ width: "50px" }}
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(attributeGridOpacity * 200)}
                    onChange={(e) => dispatch(setAttributeGridOpacity(parseFloat(e.target.value) / 200))}
                />
                &nbsp;
                <Button
                    icon={crisp ? 'blur_off' : 'blur_on'}
                    tooltip={crisp ? 'Crisp scaling' : 'Blurry scaling'}
                    onClick={() => dispatch(setCrispScaling(!crisp))} />
            </Group>

            <Button
                icon='warning'
                tooltip={"Reset everything, lose all your work"}
                className="reset"
                onClick={reset} />

        </div>
    );
};
