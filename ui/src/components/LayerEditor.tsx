import '../styles/LayerEditor.scss';

import { useAppDispatch } from "../store/store";

import { LayerPropertyEditor } from "./LayerPropertyEditor";
import { PatternEditor } from "./PatternEditor";

import { Layer, PixelationSource, PixelationType, Undefinable } from "../types";

import React from 'react';
import {
    addLayerPattern,
    duplicateLayer,
    expandLayer,
    loadLayerSrc,
    preserveLayerAspectRatio,
    removeLayer,
    setActive,
    setLayerBlue,
    setLayerBlur,
    setLayerBrightness,
    setLayerBrightnessThreshold,
    setLayerContrast,
    setLayerEdgeEnhance,
    setLayerFlipX,
    setLayerFlipY,
    setLayerGreen,
    setLayerHeight,
    setLayerHighlights,
    setLayerHue,
    setLayerInvert,
    setLayerMidtones,
    setLayerPixelate,
    setLayerPixelateAutoColors,
    setLayerPixelateSource,
    setLayerPixelateTargetColor,
    setLayerRed,
    setLayerRotate,
    setLayerSaturation,
    setLayerShadows,
    setLayerSrc,
    setLayerWidth,
    setLayerX,
    setLayerY,
    showHideLayer
} from "../store/layersSlice";
import { ColorPicker } from './ColorPicker';
import { Button, Input } from './CustomElements';
import { Icon } from './Icon';
import { LayerProperyGroup } from './LayerPropertyGroup';

export const LayerEditor: React.FC<{ layer: Layer }> = ({ layer }) => {
    const dispatch = useAppDispatch();

    const changeLayerAttribute = (action: any) => (layer: Layer, fieldName: keyof Layer, value: number | boolean) => {
        dispatch(action({ layer, [fieldName]: value }));
    };

    const remove = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        if (window.confirm("Are you sure you want to remove this layer?")) {
            dispatch(removeLayer(layer));
        }
    };

    const clickLoad = () => {
        if (layer.loading) {
            return;
        }

        const src = prompt("Enter URL of image to load:", layer.src || '');
        if (src) {
            dispatch(setLayerSrc({ layer, src }));
            return dispatch(loadLayerSrc(layer));
        }
    }

    const safeZero = (value: Undefinable<number>) => typeof value === "undefined" ? 0 : value;
    const safeOne = (value: Undefinable<number>) => typeof value === "undefined" ? 1 : value;

    return (
        <div
            className={"LayerEditor layerItem" + (layer.active ? " layerActive" : "")}
            key={layer.id}
            style={{ opacity: layer.shown ? 1 : 0.75 }}
            onClick={() => dispatch(setActive(layer))}
        >

            <Button
                style={{ float: 'right' }}
                icon="delete"
                tooltip="Delete layer"
                onClick={(e) => remove(e)}
            />

            <Button
                style={{ float: 'right' }}
                icon="control_point_duplicate"
                tooltip="Duplicate layer"
                onClick={(e) => {
                    dispatch(duplicateLayer(layer));
                    e.stopPropagation();
                }}
            />

            <Button
                icon={layer.shown ? 'visibility' : 'visibility_off'}
                tooltip={layer.shown ? 'Layer is visible' : 'Layer is hidden'}
                onClick={() => dispatch(showHideLayer(layer))}
            />
            <Button
                icon={layer.expanded ? "Compress" : "Expand"}
                tooltip={layer.expanded ? "Minimize" : "Maximize"}
                onClick={() => dispatch(expandLayer(layer))} />
            <Button
                icon={layer.loading ? 'hourglass_top' : layer.loaded ? "sync" : "download"}
                tooltip={layer.loading ? 'Loading...' : layer.loaded ? "Reload source image" : "Load source image"}
                onClick={clickLoad}
            />

            {layer.expanded && <div>
                <LayerProperyGroup title="Size & position">
                    <LayerPropertyEditor
                        title="X"
                        layer={layer}
                        fieldName="x"
                        change={changeLayerAttribute(setLayerX)}
                        reset={0}
                        min={-safeZero(layer.width)}
                        max={255}
                    />
                    <LayerPropertyEditor
                        title="Y"
                        layer={layer}
                        fieldName="y"
                        change={changeLayerAttribute(setLayerY)}
                        reset={0}
                        min={0}
                        max={192}
                    />
                    <LayerPropertyEditor
                        title="Width"
                        layer={layer}
                        fieldName="width"
                        change={changeLayerAttribute(setLayerWidth)}
                        reset={layer.originalWidth}
                        min={1}
                        max={safeZero(layer.originalWidth) * 2}
                        extra={
                            Math.round(
                                (safeZero(layer.width) * 1000) / safeOne(layer.originalWidth)
                            ) /
                            10 +
                            "%"
                        }
                    />
                    <div style={{ textAlign: "center" }}>
                        <Button
                            tooltip={layer.preserveLayerAspectRatio ? 'Preserve original aspect ratio' : 'Do not preserve aspect ratio'}
                            icon={layer.preserveLayerAspectRatio ? 'lock' : 'lock_open_right'}
                            onClick={() => changeLayerAttribute(preserveLayerAspectRatio)(layer, 'preserveLayerAspectRatio', !layer.preserveLayerAspectRatio)}
                        ></Button>
                    </div>
                    <LayerPropertyEditor
                        title="Height"
                        layer={layer}
                        fieldName="height"
                        change={changeLayerAttribute(setLayerHeight)}
                        reset={layer.originalHeight}
                        min={1}
                        max={safeZero(layer.originalHeight) * 2}
                        extra={
                            Math.round(
                                (safeZero(layer.height) * 1000) / safeOne(layer.originalHeight)
                            ) /
                            10 +
                            "%"
                        }
                    />
                    <LayerPropertyEditor
                        title="Rotate"
                        layer={layer}
                        fieldName="rotate"
                        change={changeLayerAttribute(setLayerRotate)}
                        reset={0}
                        min={-360}
                        max={360}
                    />
                    <div style={{ paddingBottom: '10px', display: 'flex', justifyContent: 'space-evenly' }}>
                        <div>
                            Flip X:&nbsp;
                            <Input
                                tooltip="Flip horizontally"
                                type="checkbox"
                                checked={layer.flipX}
                                onClick={() => changeLayerAttribute(setLayerFlipX)(layer, 'flipX', !layer.flipX)}
                            />
                        </div>
                        <div>
                            Flip Y:&nbsp;
                            <Input
                                tooltip="Flip vertically"
                                type="checkbox"
                                checked={layer.flipY}
                                onClick={() => changeLayerAttribute(setLayerFlipY)(layer, 'flipY', !layer.flipY)}
                            />
                        </div>
                    </div>
                </LayerProperyGroup>
                <LayerProperyGroup title="Hue & Saturation">
                    <div style={{ paddingLeft: '75px' }}>
                        Invert colors:&nbsp;
                        <Input
                            tooltip="Invert source image colors"
                            type="checkbox"
                            checked={layer.invert}
                            onClick={() => changeLayerAttribute(setLayerInvert)(layer, 'invert', !layer.invert)}
                        /></div>
                    <LayerPropertyEditor
                        title="Blur"
                        layer={layer}
                        fieldName="blur"
                        change={changeLayerAttribute(setLayerBlur)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Edges"
                        layer={layer}
                        fieldName="edgeEnhance"
                        change={changeLayerAttribute(setLayerEdgeEnhance)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Hue"
                        layer={layer}
                        fieldName="hue"
                        change={changeLayerAttribute(setLayerHue)}
                        reset={0}
                        min={-360}
                        max={360}
                    />
                    <LayerPropertyEditor
                        title="Saturation"
                        layer={layer}
                        fieldName="saturation"
                        change={changeLayerAttribute(setLayerSaturation)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Brightness"
                        layer={layer}
                        fieldName="brightness"
                        change={changeLayerAttribute(setLayerBrightness)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Contrast"
                        layer={layer}
                        fieldName="contrast"
                        change={changeLayerAttribute(setLayerContrast)}
                        reset={0}
                        min={0}
                        max={500}
                    />
                    <LayerPropertyEditor
                        title="Highlights"
                        layer={layer}
                        fieldName="highlights"
                        change={changeLayerAttribute(setLayerHighlights)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Midtones"
                        layer={layer}
                        fieldName="midtones"
                        change={changeLayerAttribute(setLayerMidtones)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Shadows"
                        layer={layer}
                        fieldName="shadows"
                        change={changeLayerAttribute(setLayerShadows)}
                        reset={0}
                        min={-100}
                        max={100}
                    />
                    <LayerPropertyEditor
                        title="Red"
                        layer={layer}
                        fieldName="red"
                        change={changeLayerAttribute(setLayerRed)}
                        reset={100}
                        min={0}
                        max={200}
                    />
                    <LayerPropertyEditor
                        title="Green"
                        layer={layer}
                        fieldName="green"
                        change={changeLayerAttribute(setLayerGreen)}
                        reset={100}
                        min={0}
                        max={200}
                    />
                    <LayerPropertyEditor
                        title="Blue"
                        layer={layer}
                        fieldName="blue"
                        change={changeLayerAttribute(setLayerBlue)}
                        reset={100}
                        min={0}
                        max={200}
                    />
                </LayerProperyGroup>
                <LayerProperyGroup title="Dithering">
                    <div style={{ textAlign: 'center' }}>
                        Algorithm:<br />
                        <Button
                            tooltip='Show source image'
                            dimmed={layer.pixelate !== PixelationType.none}
                            onClick={() => dispatch(setLayerPixelate({ layer, pixelate: PixelationType.none }))}>None</Button>
                        <Button
                            tooltip='Two-tone pixelation'
                            dimmed={layer.pixelate !== PixelationType.simple}
                            onClick={() => dispatch(setLayerPixelate({ layer, pixelate: PixelationType.simple }))}>Simple</Button>
                        <Button
                            tooltip='Probability noise pixelation'
                            dimmed={layer.pixelate !== PixelationType.noise}
                            onClick={() => dispatch(setLayerPixelate({ layer, pixelate: PixelationType.noise }))}>Noise</Button>
                        <Button
                            tooltip='Floyd-Steinberg pixelation'
                            dimmed={layer.pixelate !== PixelationType.floydsteinberg}
                            onClick={() => dispatch(setLayerPixelate({ layer, pixelate: PixelationType.floydsteinberg }))}>Floyd-Steinberg</Button>
                        <Button
                            tooltip='User-defined pixelation'
                            dimmed={layer.pixelate !== PixelationType.pattern}
                            onClick={() => dispatch(setLayerPixelate({ layer, pixelate: PixelationType.pattern }))}>Pattern</Button>
                    </div>
                    {layer.pixelate !== PixelationType.none && <>
                        <div style={{ textAlign: 'center' }}>
                            Color:<br />
                            <Button
                                tooltip='Dither based on the difference between source image and optimal per-attribute-block Spectrum palette'
                                dimmed={layer.pixelateSource !== PixelationSource.autoColor}
                                onClick={() => dispatch(setLayerPixelateSource({ layer, pixelateSource: PixelationSource.autoColor }))}>Source image color(s)</Button>
                            <Button
                                tooltip='Dither based on the difference between source image and specific target color'
                                dimmed={layer.pixelateSource !== PixelationSource.targetColor}
                                onClick={() => dispatch(setLayerPixelateSource({ layer, pixelateSource: PixelationSource.targetColor }))}>Manually selected color</Button>
                        </div>
                        {layer.pixelateSource === PixelationSource.autoColor && <div style={{ textAlign: 'center' }}>
                            <ColorPicker
                                title="Allowed colors"
                                colors={layer.pixelateAutoColors}
                                chooseColors={colors => dispatch(setLayerPixelateAutoColors({ layer, colors }))} />
                        </div>}
                        {layer.pixelateSource === PixelationSource.targetColor && <div style={{ textAlign: 'center' }}>
                            <ColorPicker
                                title="Manually selected color"
                                color={layer.pixelateTargetColor}
                                chooseColor={color => dispatch(setLayerPixelateTargetColor({ layer, color }))} />
                        </div>}
                        <LayerPropertyEditor
                            title="Bright"
                            layer={layer}
                            fieldName="brightnessThreshold"
                            change={changeLayerAttribute(setLayerBrightnessThreshold)}
                            reset={50}
                            min={0}
                            max={100}
                        />
                    </>}

                    {layer.pixelate === 'pattern' && <div className="patterns">
                        {!layer.patterns.length
                            ? <div><i>No patterns defined, using "simple" rendering method as placeholder</i></div>
                            : layer.patterns.map((pattern, idx) => <React.Fragment key={pattern.id}>
                                <Button
                                    tooltip='Add a new pattern'
                                    onClick={() => dispatch(addLayerPattern({ layer, insertBefore: idx }))}>
                                    <Icon icon="add_circle" /> Add pattern
                                </Button>
                                <PatternEditor
                                    layer={layer}
                                    pattern={pattern}
                                    idx={idx}
                                    first={idx === 0}
                                    last={idx === layer.patterns.length - 1}></PatternEditor>
                            </React.Fragment>)
                        }
                        <Button
                            tooltip='Add a new pattern'
                            onClick={() => dispatch(addLayerPattern({ layer, insertBefore: layer.patterns.length }))}>
                            <Icon icon="add_circle" /> Add pattern
                        </Button>
                    </div>}
                </LayerProperyGroup>

            </div>}
        </div>
    );
}
