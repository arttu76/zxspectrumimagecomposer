import '../styles/LayerEditor.scss';

import { useAppDispatch } from "../store/store";

import { LayerPropertyEditor } from "./LayerPropertyEditor";
import { PatternEditor } from "./PatternEditor";

import { Layer, PixelationType, Undefinable } from "../types";

import {
    addLayerPattern,
    duplicateLayer,
    expandLayer,
    loadLayerSrc,
    preserveLayerAspectRatio,
    removeLayer,
    setActive,
    setLayerBlue,
    setLayerBrightness,
    setLayerContrast,
    setLayerGreen,
    setLayerHeight,
    setLayerInvert,
    setLayerPixelate,
    setLayerRed,
    setLayerRotate,
    setLayerSaturation,
    setLayerSrc,
    setLayerWidth,
    setLayerX,
    setLayerY,
    showHideLayer,
} from "../store/layersSlice";
import { Button } from './CustomElements';
import { Icon } from './Icon';
import { LayerProperyGroup } from './LayerPropertyGroup';

export const LayerEditor: React.FC<{ layer: Layer }> = ({ layer }) => {
    const dispatch = useAppDispatch();

    const change = (action: any) => (layer: Layer, fieldName: string, value: number | boolean) => {
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
                        change={change(setLayerX)}
                        min={-safeZero(layer.width)}
                        max={255}
                    />
                    <LayerPropertyEditor
                        title="Y"
                        layer={layer}
                        fieldName="y"
                        change={change(setLayerY)}
                        min={0}
                        max={192}
                    />
                    <LayerPropertyEditor
                        title="Width"
                        layer={layer}
                        fieldName="width"
                        change={change(setLayerWidth)}
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
                    <LayerPropertyEditor
                        title="Height"
                        layer={layer}
                        fieldName="height"
                        change={change(setLayerHeight)}
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
                    <div style={{ paddingLeft: '75px' }}>
                        Preserve aspect ratio: <input type="checkbox"
                            defaultChecked={layer.preserveLayerAspectRatio}
                            onChange={e => change(preserveLayerAspectRatio)(layer, 'preserveLayerAspectRatio', e.target.checked)}
                        /></div>
                    <LayerPropertyEditor
                        title="Rotate"
                        layer={layer}
                        fieldName="rotate"
                        change={change(setLayerRotate)}
                        reset={0}
                        min={-360}
                        max={360}
                    />
                </LayerProperyGroup>
                <LayerProperyGroup title="Hue & Saturation">
                    <div style={{ paddingLeft: '75px' }}>
                        Invert colors:&nbsp;&nbsp;
                        <input type="checkbox"
                            defaultChecked={layer.invert}
                            onChange={e => change(setLayerInvert)(layer, 'invert', e.target.checked)}
                        /></div>
                    <LayerPropertyEditor
                        title="Saturation"
                        layer={layer}
                        fieldName="saturation"
                        change={change(setLayerSaturation)}
                        reset={100}
                        min={0}
                        max={500}
                    />
                    <LayerPropertyEditor
                        title="Red"
                        layer={layer}
                        fieldName="red"
                        change={change(setLayerRed)}
                        reset={100}
                        min={0}
                        max={1000}
                    />
                    <LayerPropertyEditor
                        title="Green"
                        layer={layer}
                        fieldName="green"
                        change={change(setLayerGreen)}
                        reset={100}
                        min={0}
                        max={1000}
                    />
                    <LayerPropertyEditor
                        title="Blue"
                        layer={layer}
                        fieldName="blue"
                        change={change(setLayerBlue)}
                        reset={100}
                        min={0}
                        max={1000}
                    />
                    <LayerPropertyEditor
                        title="Brightness"
                        layer={layer}
                        fieldName="brightness"
                        change={change(setLayerBrightness)}
                        reset={0}
                        min={-255}
                        max={255}
                    />
                    <LayerPropertyEditor
                        title="Contrast"
                        layer={layer}
                        fieldName="contrast"
                        change={change(setLayerContrast)}
                        reset={0}
                        min={-255}
                        max={255}
                    />
                </LayerProperyGroup>
                <LayerProperyGroup title="Dithering">
                    <div style={{ textAlign: 'center' }}>
                        <Icon icon="gradient" /> Gradient:
                        <select value={layer.pixelate}
                            onChange={(e) => dispatch(setLayerPixelate({ layer, pixelate: e.currentTarget.value as PixelationType }))}>
                            <option value={PixelationType.none}>None</option>
                            <option value={PixelationType.simple}>Simple</option>
                            <option value={PixelationType.noise}>Noise</option>
                            <option value={PixelationType.floydsteinberg}>Floyd-Steinberg</option>
                            <option value={PixelationType.pattern}>Custom</option>
                        </select>
                    </div>
                    {layer.pixelate === 'pattern' && <div>
                        {!layer.patterns.length
                            ? <div><i>No patterns defined, using "simple" rendering method as placeholder</i></div>
                            : layer.patterns.map((pattern, idx) => <PatternEditor
                                key={idx}
                                layer={layer}
                                pattern={pattern}
                                idx={idx}
                                first={idx === 0}
                                last={idx === layer.patterns.length - 1}></PatternEditor>)
                        }
                        <button onClick={() => dispatch(addLayerPattern({ layer }))}>
                            <Icon icon="add_circle" /> Add pattern
                        </button>
                    </div>}
                </LayerProperyGroup>

            </div>}
        </div>
    );
}
