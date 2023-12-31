import '../styles/Toolbar.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import { ChangeEvent, useEffect, useState } from 'react';
import { repaint } from '../store/housekeepingSlice';
import { setLayerRequireAdjustedPixelsRefresh } from '../store/layersSlice';
import {
    changeAttributeOpacity,
    increaseLoadOffset,
    resetLoadOffset,
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
    setHighlight,
    setInvertExportedImage,
    setManualAttribute,
    setMaskBrushType,
    setPixelBrushType,
    setPulseOffsetsForData,
    setTool,
    setZoom,
    showHelp
} from "../store/toolsSlice";
import { AttributeBrushType, BrushShape, Color, HighlightType, Keys, MaskBrushType, Nullable, PixelBrushType, SpectrumPixelCoordinate, ToolType } from "../types";
import { isMaskSet, mutateMask } from '../utils/maskManager';
import { getInvertedAttributes, getInvertedBitmap, getSpectrumMemoryPixelOffsetAndBit, getTapeSoundAudioBufferSourceNode } from '../utils/spectrumHardware';
import { applyRange2DExclusive, getWindow, rangeExclusive, showAlert } from '../utils/utils';
import { ColorPicker } from './ColorPicker';
import { Button, Input } from './CustomElements';
import { Group } from './Group';

import store from "../store/store";
import { loadEverything, saveEverything } from '../utils/exportImport';
import { getGrowableGrid, getGrowableGridData, setGrowableGridData } from '../utils/growableGridManager';
import { Help } from './Help';
import { ToolbarErrors } from './ToolbarErrors';

export const Toolbar = () => {

    const tools = useAppSelector((state) => state.tools);

    const layers = useAppSelector((state) => state.layers.layers);
    const activeLayer = layers.find(layer => layer.active);

    const win = getWindow();

    const dispatch = useAppDispatch();

    const applyActiveLayer = (applyFunc: (oldValue: boolean) => boolean): void => {
        if (!activeLayer) {
            return;
        }

        mutateMask(activeLayer, applyFunc);
        dispatch(setLayerRequireAdjustedPixelsRefresh({ layer: activeLayer, required: true }));
        dispatch(repaint());
    }

    const invertActiveLayerMaskData = () => applyActiveLayer(oldValue => !oldValue);
    const clearActiveLayerMaskData = () => applyActiveLayer(_ => false);

    const setActiveLayerPixels = (pixel: Nullable<boolean>) => {
        if (!activeLayer) {
            return;
        }

        if (!confirm("Are you sure you want to set ALL manual pixels on this layer?")) {
            return;
        }

        if (pixel === null) {
            win[Keys.manualPixels][activeLayer.id] = getGrowableGrid<boolean>();
        } else {
            let fullGrid = getGrowableGrid<boolean>();
            applyRange2DExclusive(192, 256, (y, x) => {
                fullGrid = setGrowableGridData(fullGrid, x, y, pixel);
            });
            win[Keys.manualPixels][activeLayer.id] = fullGrid;
        }
        dispatch(repaint());
    }

    const setActiveLayerAttributes = (color: Nullable<Color>) => {
        if (!activeLayer) {
            return;
        }

        if (!confirm("Are you sure you want to set ALL manual attributes on this layer?")) {
            return;
        }

        if (color === null) {
            win[Keys.manualAttributes][activeLayer.id] = getGrowableGrid<Color>();
        } else {
            let fullGrid = getGrowableGrid<Color>();
            applyRange2DExclusive(192, 256, (y, x) => {
                fullGrid = setGrowableGridData(fullGrid, x, y, color);
            });
            win[Keys.manualAttributes][activeLayer.id] = fullGrid;
        }
        dispatch(repaint());
    }

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
        if (confirm("Are you sure you want to reset? You will loose all your unsaved work!")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    const brushSizesByHotkey = [
        null,
        1, // pressing 1 (index of the array) makes brush size 1
        3,
        10,
        25,
        50 // pressing 5 makes brush size 50
    ];

    const getExportedBitmapAndAttributes = (downloadBitmap: boolean, downloadAttributes: boolean): { bitmap: Uint8Array, attributes: Uint8Array } => {
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

        showAlert('Code copied to clipboard', exportedCode);
    }

    const [playerInitializing, setPlayerInitializing] = useState<boolean>(false);
    const [player, setPlayer] = useState<Nullable<AudioBufferSourceNode>>(null);

    const [loadIntervalId, setLoadIntervalId] = useState<number | null>(null);

    const resetLoading = () => {
        if (loadIntervalId) {
            window.clearInterval(loadIntervalId);
        }
        setLoadIntervalId(null);
        dispatch(resetLoadOffset());
    }

    const play = () => {
        if (playerInitializing) {
            return;
        }

        // stop
        if (player) {
            player.stop();
            setPlayer(null);
            if (loadIntervalId) {
                resetLoading();
            }
            return;
        }

        // play (trigger the useEffect below)
        setPlayerInitializing(true);
    }

    const freeze = (freezePixels: boolean, freezeAttributes: boolean) => {
        if (!activeLayer) {
            alert("Select a layer first.")
            return;
        }

        const freezeWhatText = (freezePixels && freezeAttributes)
            ? 'both pixels and attributes'
            : freezePixels
                ? 'pixels only, no attributes'
                : 'attributes only, no pixels';

        if (!confirm([
            "Are you sure you want to copy dithered source image (" + freezeWhatText + ") to manual pixels and attributes thus freezing them?",
            "",
            "The following will NOT be copied:",
            " - Masked parts of the source image",
            " - Existing manually made tweaks will not be overwritten",
            "",
            "Copying the image to manual \"sub layers\" will \"freeze\" the image as brightness/contrast/etc adjustment will not affect the "
            + "copied parts of the image. One effective workflow to optimally dither an image requiring different dithering settings "
            + "for different areas of the image is to:",
            "1. Mask all of the image",
            "2. Unmask the part of it you're going to work on next",
            "2. Adjust image controls so that unmasked part is optimally dithered",
            "3. Freeze the unmasked part",
            "4. Repeat steps 2-3 until done"
        ].join("\n"))) {
            return;
        }

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 256, (y, x) => {

            if (isMaskSet(activeLayer, x, y, true)) {
                return;
            }

            if (freezePixels) {
                const pixel = win[Keys.adjustedSpectrumPixels][activeLayer.id][y][x];
                if (
                    pixel !== null
                    && getGrowableGridData(win[Keys.manualPixels][activeLayer.id], x, y) === null
                ) {
                    win[Keys.manualPixels][activeLayer.id] = setGrowableGridData(win[Keys.manualPixels][activeLayer.id], x, y, !!pixel);
                }
            }

            if (freezeAttributes) {
                const attrY = Math.floor(y / 8);
                const attrX = Math.floor(x / 8);
                const attribute = win[Keys.adjustedSpectrumAttributes][activeLayer.id][attrY][attrX];
                if (
                    attribute !== null
                    && getGrowableGridData(win[Keys.manualAttributes][activeLayer.id], attrX, attrY) === null
                ) {
                    win[Keys.manualAttributes][activeLayer.id] = setGrowableGridData(win[Keys.manualAttributes][activeLayer.id], attrX, attrY, attribute);
                }
            }

        });

        dispatch(repaint());
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
                    setPlayer(tapeSound.audio);
                    dispatch(setPulseOffsetsForData(tapeSound.pulseOffsetsForData));

                    alert(
                        'Connect your ZX Spectrum to your computer\'s audio output - set the volume to relatively high level.'
                        + '\n\n'
                        + 'On the Spectrum, write LOAD""SCREEN$ and press ENTER. Then click OK on this computer to start playback.'
                    );

                    tapeSound.audio.start();
                    setPlayerInitializing(false);
                    tapeSound.audio.onended = () => {
                        setPlayer(null);
                        setPlayerInitializing(false);
                        resetLoading();
                    }
                    const loadInterval = win.setInterval(() => {
                        dispatch(increaseLoadOffset(Date.now()));
                    }, 100);
                    setLoadIntervalId(loadInterval);

                }, 1);
        }
    }, [playerInitializing])

    useEffect(() => {
        return () => {
            if (loadIntervalId !== null) {
                window.clearInterval(loadIntervalId);
            }
        };
    }, [loadIntervalId]);

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
                &nbsp;
                <Button
                    dimmed={tools.tool !== ToolType.pixels}
                    onClick={() => dispatch(setTool(ToolType.pixels))}
                    icon="gradient"
                    tooltip="Manual pixels"
                    hotkey='E'
                />
                <Button
                    dimmed={tools.tool !== ToolType.attributes}
                    onClick={() => dispatch(setTool(ToolType.attributes))}
                    icon="palette"
                    tooltip="Manual attributes"
                    hotkey='R'
                />
                &nbsp;
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
                        hotkey="A"
                        tooltip="Mask eraser tool"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.eraser))} />
                    <Button
                        dimmed={tools.maskBrushType !== MaskBrushType.brush}
                        icon="brush"
                        hotkey="S"
                        tooltip="Mask draw tool"
                        onClick={() => dispatch(setMaskBrushType(MaskBrushType.brush))} />
                </Group>
            </>}
            {tools.tool === ToolType.pixels && <>
                <Group title="Pixel brush" disableClose={true}>
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.eraser}
                        icon="ink_eraser"
                        hotkey="A"
                        tooltip="Erase manually set ink, paper & brightness"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.eraser))} />
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.ink}
                        icon="border_color"
                        hotkey="S"
                        tooltip="Set pixels as ink"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.ink))} />
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.paper}
                        icon="check_box_outline_blank"
                        hotkey="D"
                        tooltip="Set pixels as paper"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.paper))} />
                    <Button
                        dimmed={tools.pixelBrushType !== PixelBrushType.toggler}
                        icon="autorenew"
                        hotkey="F"
                        tooltip="Use 1x1 brush that toggles pixel between ink and paper"
                        onClick={() => dispatch(setPixelBrushType(PixelBrushType.toggler))} />
                </Group>
                <Group title="Reset" disableClose={true}>
                    <Button onClick={() => setActiveLayerPixels(true)}
                        tooltip="Set all manual pixels as ink"
                        icon="border_color"
                    />
                    <Button onClick={() => setActiveLayerPixels(false)}
                        tooltip="Set all manual pixels as paper"
                        icon="check_box_outline_blank"
                    />
                    <Button onClick={() => setActiveLayerPixels(null)}
                        tooltip="Clear all manual pixels"
                        icon="delete"
                    />
                </Group>
            </>}
            {tools.tool === ToolType.attributes && <>
                <Group title="Attribute brush" disableClose={true}>
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.eraser}
                        icon="ink_eraser"
                        hotkey="A"
                        tooltip="Erase manually set attributes"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.eraser))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.all}
                        icon="filter_3"
                        hotkey="S"
                        tooltip="Set ink, paper and brightness"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.all))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.ink}
                        icon="border_color"
                        hotkey="D"
                        tooltip="Set ink color only"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.ink))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.paper}
                        icon="check_box_outline_blank"
                        hotkey="F"
                        tooltip="Set paper color only"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.paper))} />
                    <Button
                        dimmed={tools.attributeBrushType !== AttributeBrushType.bright}
                        icon="light_mode"
                        hotkey="G"
                        tooltip="Set brightness only"
                        onClick={() => dispatch(setAttributeBrushType(AttributeBrushType.bright))} />
                </Group>
                <Group className="ManualAttributeGroup" title="Attribute color" disableClose={true}>
                    <ColorPicker title=''
                        color={tools.manualAttribute}
                        allowInvert={true}
                        chooseColor={(color) => dispatch(setManualAttribute(color))} />
                </Group>
                <Group title="Reset" disableClose={true}>
                    <Button onClick={() => setActiveLayerAttributes(tools.manualAttribute)}
                        tooltip="Set all manual attributes to selected color"
                        icon="filter_3"
                    />
                    <Button onClick={() => setActiveLayerAttributes(null)}
                        tooltip="Clear all manual attributes"
                        icon="delete"
                    />
                </Group>
            </>}

            {(
                tools.tool === ToolType.mask
                || (tools.tool === ToolType.pixels && tools.pixelBrushType !== PixelBrushType.toggler)
            ) && <Group title="Brush shape and size" disableClose={true}>
                    <Button
                        dimmed={tools.brushShape !== BrushShape.block}
                        icon={"square"}
                        tooltip="Draw with a square brush"
                        onClick={() => dispatch(setBrushShape(BrushShape.block))} />
                    <Button
                        dimmed={tools.brushShape !== BrushShape.circle}
                        icon={"brightness_1"}
                        tooltip="Draw with a circular brush"
                        onClick={() => dispatch(setBrushShape(BrushShape.circle))} />
                    <Button
                        dimmed={tools.brushShape !== BrushShape.attributeSquare}
                        icon={"palette"}
                        tooltip="Draw with a 8x8 pixel block aligned to attribute grid"
                        onClick={() => dispatch(setBrushShape(BrushShape.attributeSquare))} />

                    &nbsp;

                    {tools.brushShape !== BrushShape.attributeSquare
                        && !(tools.tool === ToolType.pixels && tools.pixelBrushType === PixelBrushType.toggler)
                        && <>
                            {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(newBrushSize => <Button
                                key={newBrushSize}
                                hotkey={brushSizesByHotkey.includes(newBrushSize) ? '' + brushSizesByHotkey.indexOf(newBrushSize) : undefined}
                                dimmed={tools.brushSize !== newBrushSize}
                                tooltip={`Use ${newBrushSize}x${newBrushSize} brush`}
                                onClick={() => dispatch(setBrushSize(newBrushSize))}>{newBrushSize}</Button>)}
                        </>}
                </Group>}

            {tools.tool === ToolType.mask && <>
                <Group title="Reset" disableClose={true}>

                    <Button onClick={() => invertActiveLayerMaskData()}
                        tooltip="Invert mask"
                        icon="invert_colors"
                    />
                    <Button onClick={() => clearActiveLayerMaskData()}
                        tooltip="Clear mask"
                        icon="delete"
                    />
                </Group>
            </>
            }

            {activeLayer && <>
                <Group title="Freeze image" disableClose={true}>
                    <Button
                        icon="image"
                        tooltip="Copy dithered source image pixels and attributes to manual pixels and attributes"
                        onClick={() => freeze(true, true)}
                    />
                    <Button
                        icon="gradient"
                        tooltip="Copy dithered source image, pixels only"
                        onClick={() => freeze(true, false)}
                    />
                    <Button
                        icon="palette"
                        tooltip="Copy dithered source image, attributes only"
                        onClick={() => freeze(false, true)}
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

            </>
            }

            <Group title="Zoom" disableClose={true} className="ZoomButtonContainer">
                {[1, 2, 3, 4, 5, 10, 20].map((zoomLevel) => <Button
                    key={zoomLevel}
                    dimmed={tools.zoom !== zoomLevel}
                    tooltip={`Show picture using ${zoomLevel}x${zoomLevel} pixels`}
                    onClick={() => dispatch(setZoom(zoomLevel))} >{zoomLevel}</Button>
                )}
            </Group>

            {tools.tool !== ToolType.export && <>
                <Group title="Visibility" disableClose={true}>
                    <Button
                        dimmed={tools.hideSourceImage}
                        icon="image"
                        hotkey='B'
                        tooltip={tools.hideSourceImage ? 'Source image is hidden' : 'Source image is displayed'}
                        onClick={() => dispatch(setHideSourceImage(!tools.hideSourceImage))} />
                    <Button
                        dimmed={tools.hideManualPixels}
                        icon="gradient"
                        hotkey='N'
                        tooltip={tools.hideManualPixels ? 'Manually drawn pixels are hidden' : 'Manually drawn pixels are displayed'}
                        onClick={() => dispatch(setHideManualPixels(!tools.hideManualPixels))} />
                    <Button
                        dimmed={tools.hideManualAttributes}
                        icon="palette"
                        hotkey='M'
                        tooltip={tools.hideManualAttributes ? 'Manually drawn attributes are hidden' : 'Manually drawn attributes are displayed'}
                        onClick={() => dispatch(setHideManualAttributes(!tools.hideManualAttributes))} />
                    &nbsp;
                    <Button
                        dimmed={!tools.hideAllAttributes}
                        icon="invert_colors_off"
                        hotkey="X"
                        tooltip={tools.hideAllAttributes ? 'All attributes are ink:0 paper:7 bright:0' : 'Using attributes'}
                        onClick={() => dispatch(setHideAllAttributes(!tools.hideAllAttributes))} />
                    &nbsp;
                    <Input
                        alt={tools.attributeGridOpacity.toString()}
                        hotkey="V"
                        hotkeyFunc={() => dispatch(changeAttributeOpacity())}
                        tooltip="Attribute grid visibility"
                        style={{ width: "50px", position: 'relative', top: '-2px', color: 'white' }}
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
                    {tools.tool === ToolType.pixels && <>
                        &nbsp;
                        <Button
                            icon="image"
                            dimmed={tools.highlight !== HighlightType.inkAndPaperPixels}
                            tooltip="Highlight all manually set pixels (ink or paper)"
                            onClick={() => dispatch(setHighlight(HighlightType.inkAndPaperPixels))} />
                        <Button
                            icon="gradient"
                            dimmed={tools.highlight !== HighlightType.inkPixels}
                            tooltip="Highlight all manually set ink pixels"
                            onClick={() => dispatch(setHighlight(HighlightType.inkPixels))} />
                        <Button
                            icon="palette"
                            dimmed={tools.highlight !== HighlightType.paperPixels}
                            tooltip="Highlight all manually set paper pixels"
                            onClick={() => dispatch(setHighlight(HighlightType.paperPixels))} />
                    </>}
                    {tools.tool === ToolType.attributes && <>
                        &nbsp;
                        <Button
                            icon="palette"
                            dimmed={tools.highlight !== HighlightType.allAttributes}
                            tooltip="Highlight all manually set attributes"
                            onClick={() => dispatch(setHighlight(HighlightType.allAttributes))} />
                        <Button
                            icon="light_mode"
                            dimmed={tools.highlight !== HighlightType.brightAttributes}
                            tooltip="Highlight all manually set bright attributes"
                            onClick={() => dispatch(setHighlight(HighlightType.brightAttributes))} />
                    </>}
                </Group>
            </>}

            <Group title="Project & Help" disableClose={true}>
                <Button
                    icon='output_circle'
                    tooltip="Save your work for later use"
                    onClick={save}
                />
                <Button
                    icon='input_circle'
                    tooltip="Load previously saved work"
                    onClick={() => document.getElementById('fileInput')!.click()}
                />
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={load}
                    accept=".zxc"
                />
                &nbsp;
                <Button
                    icon='help'
                    tooltip="Help"
                    className={"CustomElements help" + (layers.length === 0 ? " glow" : "")}
                    onClick={() => dispatch(showHelp(!tools.showHelp))} />
                &nbsp;
                <Button
                    icon='warning'
                    tooltip="Reset everything, lose all your work!"
                    className="reset"
                    onClick={reset} />
            </Group>

            <ToolbarErrors />
            <Help />

        </div >
    );
};
