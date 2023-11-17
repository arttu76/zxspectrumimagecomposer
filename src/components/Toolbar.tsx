import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import { ChangeEvent, useEffect, useState } from 'react';
import { setLayerPixelate, setLayerRequireAdjustedPixelsRefresh } from '../store/layersSlice';
import { repaint } from '../store/repaintSlice';
import {
    setAttributeBrushType,
    setAttributeGridOpacity,
    setBrushShape,
    setBrushSize,
    setCrispScaling,
    setExportCharHeight,
    setExportCharWidth,
    setExportCharX,
    setExportCharY,
    setExportFullScreen,
    setHideAllAttributes,
    setHideManualAttributes,
    setHideManualPixels,
    setHideSourceImage,
    setInvertExportedImage,
    setManualAttribute,
    setMaskBrushType,
    setPixelBrushType,
    setTool,
    setZoom
} from "../store/toolsSlice";
import { AttributeBrushType, BrushShape, Keys, MaskBrushType, Nullable, PixelBrushType, PixelationType, ToolType } from "../types";
import { mutateMask } from '../utils/maskManager';
import { getInvertedAttributes, getInvertedBitmap, getSpectrumMemoryPixelOffsetAndBit, getTapeSoundAudioBufferSourceNode } from '../utils/spectrumHardware';
import { applyRange2DExclusive, getWindow, rangeExclusive } from '../utils/utils';
import { ColorPicker } from './ColorPicker';
import { Button, Input } from './CustomElements';
import { Group } from './Group';

import store from "../store/store";
import { loadEverything, saveEverything } from '../utils/exportImport';

export const Toolbar = () => {

    const tools = useAppSelector((state) => state.tools);

    const layers = useAppSelector((state) => state.layers.layers);

    const dispatch = useAppDispatch();

    const applyActiveLayer = (applyFunc: (oldValue: boolean) => boolean): void => {
        const activeLayer = layers.find(layer => layer.active);
        if (!activeLayer) {
            return;
        }

        mutateMask(activeLayer, applyFunc);
        dispatch(setLayerRequireAdjustedPixelsRefresh({ layer: activeLayer, required: true }));
        dispatch(repaint());
    }

    const invertActiveLayerMaskData = () => applyActiveLayer(oldValue => !oldValue);
    const clearActiveLayerMaskData = () => applyActiveLayer(_ => false);

    const save = async () => {
        const everything = saveEverything(store.getState());
        const blob = new Blob([everything], { type: "text/plain" });
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = 'project.zxc';
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    }

    const load = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => loadEverything(e.target?.result as string);
            reader.readAsText(file);
        }
    }

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

        if (
            (
                event.target instanceof HTMLInputElement
                || event.target instanceof HTMLTextAreaElement
                || event.target instanceof HTMLSelectElement
            ) && event.target.type !== 'range'
        ) {
            return;
        }

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

        if (tools.tool === ToolType.mask) {
            if (event.key === 'a') dispatch(setMaskBrushType(MaskBrushType.eraser));
            if (event.key === 's') dispatch(setMaskBrushType(MaskBrushType.brush));
        }

        if (tools.tool === ToolType.pixels) {
            if (event.key === 'a') dispatch(setPixelBrushType(PixelBrushType.eraser));
            if (event.key === 's') dispatch(setPixelBrushType(PixelBrushType.ink));
            if (event.key === 'd') dispatch(setPixelBrushType(PixelBrushType.paper));
        }

        if (tools.tool === ToolType.attributes) {
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

        if (event.key === 'x') {
            dispatch(setHideAllAttributes(!tools.hideAllAttributes));
        }

        if (event.key === 'c') {
            const activeLayer = layers.find(layer => layer.active);
            if (activeLayer) {
                dispatch(setLayerPixelate({
                    layer: activeLayer,
                    pixelate: (activeLayer.pixelate === PixelationType.none)
                        ? activeLayer.pixelateToggle
                        : PixelationType.none
                }));
            }
        }

        if (event.key === 'v') {
            dispatch(setAttributeGridOpacity(
                tools.attributeGridOpacity > 0.1
                    ? 0
                    : tools.attributeGridOpacity + 0.05
            ));
        }
    };

    const getExportedBitmapAndAttributes = (downloadBitmap: boolean, downloadAttributes: boolean): { bitmap: Uint8Array, attributes: Uint8Array } => {
        const win = getWindow();

        const fullBitmap = getInvertedBitmap(win[Keys.spectrumMemoryBitmap], tools.invertExportedImage);
        const fullAttributes = getInvertedAttributes(win[Keys.spectrumMemoryAttribute], tools.invertExportedImage);

        if (tools.exportFullScreen) {
            return {
                bitmap: downloadBitmap ? fullBitmap : new Uint8Array(),
                attributes: downloadAttributes ? fullAttributes : new Uint8Array()
            }
        }

        const bitmap: number[] = [];
        if (downloadBitmap) {
            applyRange2DExclusive(tools.exportCharHeight * 8, tools.exportCharWidth, (offsetCharY, offsetCharX) => {
                bitmap.push(fullBitmap[getSpectrumMemoryPixelOffsetAndBit((offsetCharX + tools.exportCharX) * 8, offsetCharY + tools.exportCharY * 8)[0]]);
            });
        }

        const attributes: number[] = [];
        if (downloadAttributes) {
            applyRange2DExclusive(tools.exportCharHeight, tools.exportCharWidth, (offsetCharY, offsetCharX) => {
                attributes.push(fullAttributes[offsetCharX + tools.exportCharX + (offsetCharY + tools.exportCharY) * 32]);
            });
        }

        return {
            bitmap: new Uint8Array(bitmap),
            attributes: new Uint8Array(attributes)
        }

    }

    const download = (filename: string, downloadBitmap: boolean, downloadAttributes: boolean) => {
        const { bitmap, attributes } = getExportedBitmapAndAttributes(downloadBitmap, downloadAttributes);
        const data = new Uint8Array([...bitmap, ...attributes]);

        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    const copyCode = async () => {
        const { bitmap, attributes } = getExportedBitmapAndAttributes(true, true);

        const defb = "        DEFB    ";
        const linePrefix = (name?: string) => name ? name + ":" + defb.substring(name.length + 1) : defb;
        const toHex = (value: number) => '$' + value.toString(16).toUpperCase().padStart(2, '0');
        const convert = (name: string, data: Uint8Array) => data.reduce(
            (acc, val, idx) => acc
                + ((idx === 0) ? linePrefix(name) : (idx % 8 === 0) ? linePrefix() : ", ")
                + toHex(val)
                + ((idx % 8 === 7) ? "\n" : ""),
            ""
        );

        const exportedCode = convert("bitmap", bitmap)
            + "\n\n"
            + convert("attrs", attributes);

        await navigator.clipboard.writeText(exportedCode);

        alert('Code copied to clipboard\n\n' + exportedCode);
    }

    const [playerInitializing, setPlayerInitializing] = useState<boolean>(false);
    const [player, setPlayer] = useState<Nullable<AudioBufferSourceNode>>(null);

    const play = () => {
        if (playerInitializing) {
            return;
        }

        // stop
        if (player) {
            player.stop();
            setPlayer(null);
            return;
        }

        // play (trigger the useEffect below)
        setPlayerInitializing(true);
    }

    useEffect(() => {
        if (playerInitializing) {
            setTimeout(
                () => {
                    const win = getWindow();
                    const tapeSound = getTapeSoundAudioBufferSourceNode(
                        getInvertedBitmap(win[Keys.spectrumMemoryBitmap], tools.invertExportedImage),
                        getInvertedAttributes(win[Keys.spectrumMemoryAttribute], tools.invertExportedImage)
                    );
                    setPlayer(tapeSound);

                    alert(
                        'Connect your ZX Spectrum to your computer\'s audio output - set the volume to relatively high level.'
                        + '\n\n'
                        + 'On the Spectrum, write LOAD""SCREEN$ and press ENTER. Then click OK on this computer to start playback.'
                        + '\n\n'
                        + 'Surely you know how all this works.'
                    );

                    tapeSound.start();
                    setPlayerInitializing(false);
                    tapeSound.onended = () => {
                        setPlayer(null);
                        setPlayerInitializing(false);
                    }
                }, 1);
        }
    }, [playerInitializing])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        tools.tool,
        tools.maskBrushType,
        tools.pixelBrushType,
        tools.attributeBrushType,
        tools.hideAllAttributes,
        tools.attributeGridOpacity,
        layers
    ]);

    return (
        <div className="Toolbar">
            <Group title="Tools" disableClose={true}>
                <Button
                    dimmed={tools.tool !== ToolType.nudge}
                    onClick={() => dispatch(setTool(ToolType.nudge))}
                    icon="open_with"
                    tooltip="Nudge"
                    hotkey='Q'
                />
                <Button
                    dimmed={tools.tool !== ToolType.mask}
                    onClick={() => dispatch(setTool(ToolType.mask))}
                    icon="photo_size_select_large"
                    tooltip="Mask"
                    hotkey='W'
                />
                <Button
                    dimmed={tools.tool !== ToolType.pixels}
                    onClick={() => dispatch(setTool(ToolType.pixels))}
                    icon="gradient"
                    tooltip="Pixels"
                    hotkey='E'
                />
                <Button
                    dimmed={tools.tool !== ToolType.attributes}
                    onClick={() => dispatch(setTool(ToolType.attributes))}
                    icon="palette"
                    tooltip="Attributes"
                    hotkey='R'
                />
                <Button
                    dimmed={tools.tool !== ToolType.export}
                    onClick={() => dispatch(setTool(ToolType.export))}
                    icon="ios_share"
                    tooltip="Export"
                    hotkey='T'
                />
            </Group>

            {tools.tool === ToolType.mask && <>
                <Group title="Mask brush" disableClose={true}>
                    <Button
                        dimmed={tools.maskBrushType !== MaskBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Mask eraser tool (a)"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.eraser))} />
                    <Button
                        dimmed={tools.maskBrushType !== MaskBrushType.brush}
                        icon="brush"
                        tooltip="Mask draw tool (s)"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.brush))} />
                </Group>
            </>}
            {tools.tool === ToolType.pixels && <>
                <Group title="Pixel brush" disableClose={true}>
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Erase manually set ink, paper & brightness (a)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.eraser))} />
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.ink}
                        icon="border_color"
                        tooltip="Set pixels as ink (s)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.ink))} />
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.paper}
                        icon="check_box_outline_blank"
                        tooltip="Set pixels as paper (d)"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.paper))} />
                </Group>
            </>}
            {tools.tool === ToolType.attributes && <>
                <Group title="Attribute brush" disableClose={true}>
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.eraser}
                        icon="ink_eraser"
                        tooltip="Erase manually set attributes (a)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.eraser))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.all}
                        icon="filter_3"
                        tooltip="Set ink, paper and brightness (s)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.all))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.ink}
                        icon="border_color"
                        tooltip="Set ink color only (d)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.ink))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.paper}
                        icon="check_box_outline_blank"
                        tooltip="Set paper color only (f)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.paper))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.bright}
                        icon="light_mode"
                        tooltip="Set brightness only (g)"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.bright))} />
                </Group>
                <Group className="ManualAttributeGroup" title="Attribute color" disableClose={true}>
                    <ColorPicker title=''
                        color={tools.manualAttribute}
                        allowInvert={true}
                        chooseColor={(color) => dispatch(setManualAttribute(color))} />
                </Group>
            </>}
            {(tools.tool === ToolType.mask || tools.tool === ToolType.pixels) && <>
                <Group title="Brush size" disableClose={true}>
                    <Button
                        icon={tools.brushShape === BrushShape.block ? "square" : "brightness_1"}
                        tooltip="Click to change tool shape"
                        onClick={() => dispatch(setBrushShape(tools.brushShape === BrushShape.block ? BrushShape.circle : BrushShape.block))} />

                    {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                        key={newBrushSize}
                        dimmed={tools.brushSize !== newBrushSize}
                        tooltip={`Use ${newBrushSize}x${newBrushSize} brush` + (keysToBrushSize[newBrushSize] ? ` (${newBrushSize})` : '')}
                        onClick={() => dispatch(setBrushSize(newBrushSize))} >{newBrushSize}</Button>)}
                </Group>
            </>}

            {tools.tool === ToolType.mask && <>
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

            {tools.tool === ToolType.export && <>
                <Group title="Export settings" disableClose={true}>
                    <span style={{ position: 'relative', top: '-4px' }}>
                        &nbsp;Invert:&nbsp;
                        <Input
                            tooltip="Invert paper & ink in exported code/image"
                            type="checkbox"
                            checked={tools.invertExportedImage}
                            onClick={() => dispatch(setInvertExportedImage(!tools.invertExportedImage))}
                        />
                        &nbsp;Full screen:&nbsp;
                        <Input
                            tooltip={tools.exportFullScreen ? "Export full screen memory dump (Spectrum memory layout)" : "Export part of screen (linear memory layout)"}
                            type="checkbox"
                            checked={tools.exportFullScreen}
                            onClick={() => dispatch(setExportFullScreen(!tools.exportFullScreen))}
                        />
                        {!tools.exportFullScreen && <>
                            &nbsp;X:<select
                                value={tools.exportCharX}
                                onChange={(e) => dispatch(setExportCharX(parseInt(e.currentTarget.value, 10)))}>
                                {rangeExclusive(32).map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                            &nbsp;Y:<select
                                value={tools.exportCharY}
                                onChange={(e) => dispatch(setExportCharY(parseInt(e.currentTarget.value, 10)))}>
                                {rangeExclusive(24).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            &nbsp;Width:<select
                                value={tools.exportCharWidth}
                                onChange={(e) => dispatch(setExportCharWidth(parseInt(e.currentTarget.value, 10)))}>
                                {rangeExclusive(33 - tools.exportCharX).map(width => width && <option key={width} value={width}>{width}</option>)}
                            </select>
                            &nbsp;Height:<select
                                value={tools.exportCharHeight}
                                onChange={(e) => dispatch(setExportCharHeight(parseInt(e.currentTarget.value, 10)))}>
                                {rangeExclusive(25 - tools.exportCharY).map(height => height && <option key={height} value={height}>{height}</option>)}
                            </select>
                        </>}
                    </span>
                </Group>
                <Group title="Download" disableClose={true}>
                    <Button
                        icon="image"
                        tooltip="Download bitmap and attributes as combined binary file"
                        onClick={() => download("image.bin", true, true)} />

                    <Button
                        icon="gradient"
                        tooltip="Download bitmap only as binary file"
                        onClick={() => download("bitmap.bin", true, false)} />
                    <Button
                        icon="palette"
                        tooltip="Download attributes only as binary file"
                        onClick={() => download("attributes.bin", false, true)} />
                </Group>
                <Group title="Code" disableClose={true}>
                    <Button
                        icon="code"
                        tooltip="Copy image data as code"
                        onClick={copyCode} />
                </Group>
                {tools.exportFullScreen && <Group title="Play" disableClose={true}>
                    <Button
                        icon={playerInitializing ? "hourglass_top" : player ? "stop_circle" : "play_circle"}
                        tooltip={playerInitializing ? "Preparing audio, please wait..." : player ? "Stop playback" : "Play as ZX Spectrum tape audio"}
                        onClick={play} />
                </Group>}

            </>}

            <Group title="Zoom" disableClose={true}>
                {[1, 2, 3, 4, 5, 10, 20].map((zoomLevel) => <Button
                    key={zoomLevel}
                    dimmed={tools.zoom !== zoomLevel}
                    tooltip={`Show picture using ${zoomLevel}x${zoomLevel} pixels`}
                    onClick={() => dispatch(setZoom(zoomLevel))} >{zoomLevel}</Button>
                )}
            </Group>

            {
                tools.tool !== ToolType.export && <>
                    <Group title="Visibility" disableClose={true}>
                        <Button
                            dimmed={tools.hideSourceImage}
                            icon="image"
                            tooltip={tools.hideSourceImage ? 'Source image is hidden' : 'Source image is displayed'}
                            onClick={() => dispatch(setHideSourceImage(!tools.hideSourceImage))} />
                        <Button
                            dimmed={tools.hideManualPixels}
                            icon="gradient"
                            tooltip={tools.hideManualPixels ? 'Manually drawn pixels are hidden' : 'Manually drawn pixels are displayed'}
                            onClick={() => dispatch(setHideManualPixels(!tools.hideManualPixels))} />
                        <Button
                            dimmed={tools.hideManualAttributes}
                            icon="palette"
                            tooltip={tools.hideManualAttributes ? 'Manually drawn attributes are hidden' : 'Manually drawn attributes are displayed'}
                            onClick={() => dispatch(setHideManualAttributes(!tools.hideManualAttributes))} />
                        &nbsp;
                        <Button
                            dimmed={!tools.hideAllAttributes}
                            icon="invert_colors_off"
                            tooltip={tools.hideAllAttributes ? 'All attributes are ink:0 paper:7 bright:0 (x)' : 'Using attributes (x)'}
                            onClick={() => dispatch(setHideAllAttributes(!tools.hideAllAttributes))} />
                    </Group>
                    <Group title="Display" disableClose={true}>
                        <Input
                            tooltip="Attribute grid visibility (v)"
                            style={{ width: "50px" }}
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(tools.attributeGridOpacity * 200)}
                            onChange={(e) => dispatch(setAttributeGridOpacity(parseFloat(e.target.value) / 200))}
                        />
                        &nbsp;
                        <Button
                            icon={tools.crisp ? 'blur_off' : 'blur_on'}
                            tooltip={tools.crisp ? 'Crisp scaling' : 'Blurry scaling'}
                            onClick={() => dispatch(setCrispScaling(!tools.crisp))} />
                    </Group>
                </>
            }

            <Group title="Save, Load & Reset" disableClose={true}>
                <Button
                    icon='output_circle'
                    tooltip={"Save your work for later use"}
                    onClick={save}
                />
                <Button
                    icon='input_circle'
                    tooltip={"Load previously saved work"}
                    onClick={() => document.getElementById('fileInput')!.click()}
                />
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={load}
                    accept=".zxc"
                />
                <Button
                    icon='warning'
                    tooltip={"Reset everything, lose all your work"}
                    className="reset"
                    onClick={reset} />
            </Group>

        </div>
    );
};
