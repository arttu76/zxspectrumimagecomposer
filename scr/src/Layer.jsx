import React from "react";
import {useDispatch} from "react-redux";

import {LayerNumberEditor} from "./LayerNumberEditor";

import {
    setLayerSrc,
    loadLayerSrc,
    setActive,
    showHideLayer,
    expandLayer,
    setLayerX,
    setLayerY,
    setLayerHeight,
    setLayerWidth,
    resetLayerHeight,
    resetLayerWidth,
    setLayerRotate,
    preserveLayerAspectRatio,
    setLayerColor,
    setLayerBrightness,
    setLayerContrast,
    setLayerInvert,
    setLayerPixelate,
    removeLayer,
    duplicateLayer,
} from "./layersSlice";

export const Layer = (props) => {
    const dispatch = useDispatch();
    const layer = props.layer;

    const change = (action) => (layer, fieldName, value) => {
        dispatch(action({layer, [fieldName]: value}));
    };
    const reset = (action) => (layer) => {
        dispatch(action({layer}));
    };

    const remove = (event) => {
        event.stopPropagation();
        if (window.confirm("Are you sure you want to remove this layer?")) {
            dispatch(removeLayer({layer}));
        }
    };

    return (
        <div
            className={"layerItem" + (layer.active ? " layerActive" : "")}
            key={layer.id}
            style={{opacity: layer.shown ? 1 : 0.75}}
            onClick={(e) => dispatch(setActive({layer}))}
        >

            <button
                style={{float: 'right'}}
                onClick={remove}
            >X
            </button>

            <button
                style={{float: 'right'}}
                onClick={(e) => {
                    dispatch(duplicateLayer({layer}));
                    e.stopPropagation();
                }}
            >+
            </button>

            <button
                type="text"
                onClick={() => dispatch(showHideLayer({layer}))}
            >{layer.shown ? "Shown" : "Hidden"}</button>
            <input
                type="text"
                value={layer.src}
                onChange={(e) =>
                    dispatch(
                        setLayerSrc({layer, src: e.target.value})
                    )
                }
            />{" "}
            <button
                type="text"
                onClick={() => dispatch(loadLayerSrc({layer}))}
            >
                {layer.loaded ? "Reload" : "Initialize"}
            </button>
            {layer.loaded ? layer.width + "x" + layer.height : ""}

            <button
                type="text"
                onClick={() => dispatch(expandLayer({layer}))}
            >{layer.expanded ? "Minimize" : "Maximize"}</button>

            {!layer.expanded ? '' : <div>
                <LayerNumberEditor
                    title="X"
                    layer={layer}
                    fieldName="x"
                    change={change(setLayerX)}
                    min={-layer.width}
                    max={255}
                />
                <LayerNumberEditor
                    title="Y"
                    layer={layer}
                    fieldName="y"
                    change={change(setLayerY)}
                    min={0}
                    max={192}
                />
                <LayerNumberEditor
                    title="Width"
                    layer={layer}
                    fieldName="width"
                    change={change(setLayerWidth)}
                    reset={reset(resetLayerWidth)}
                    min={1}
                    max={layer.originalWidth * 2}
                    extra={
                        Math.round(
                            (layer.width * 1000) / layer.originalWidth
                        ) /
                        10 +
                        "%"
                    }
                />
                <LayerNumberEditor
                    title="Height"
                    layer={layer}
                    fieldName="height"
                    change={change(setLayerHeight)}
                    reset={reset(resetLayerHeight)}
                    min={1}
                    max={layer.originalHeight * 2}
                    extra={
                        Math.round(
                            (layer.height * 1000) / layer.originalHeight
                        ) /
                        10 +
                        "%"
                    }
                />
                <div style={{paddingLeft: '75px'}}>
                    Preserve aspect ratio: <input type="checkbox"
                                                  defaultChecked={layer.preserveLayerAspectRatio}
                                                  onChange={e => change(preserveLayerAspectRatio)(layer, 'preserveLayerAspectRatio', e.target.checked)}
                /></div>
                <LayerNumberEditor
                    title="Rotate"
                    layer={layer}
                    fieldName="rotate"
                    change={change(setLayerRotate)}
                    resetTo={0}
                    min={-360}
                    max={360}
                />
                <div style={{paddingLeft: '75px'}}>
                    Invert layer contents:&nbsp;&nbsp;
                    <input type="checkbox"
                           defaultChecked={layer.setLayerInvert}
                           onChange={e => change(setLayerInvert)(layer, 'invert', e.target.checked)}
                    /></div>
                <LayerNumberEditor
                    title="Color"
                    layer={layer}
                    fieldName="color"
                    change={change(setLayerColor)}
                    resetTo={100}
                    min={0}
                    max={500}
                />
                <LayerNumberEditor
                    title="Brightness"
                    layer={layer}
                    fieldName="brightness"
                    change={change(setLayerBrightness)}
                    resetTo={0}
                    min={-255}
                    max={255}
                />
                <LayerNumberEditor
                    title="Contrast"
                    layer={layer}
                    fieldName="contrast"
                    change={change(setLayerContrast)}
                    resetTo={0}
                    min={-255}
                    max={255}
                />
                <div style={{textAlign:'center'}}>
                    Pixelate:
                    {['none', 'simple', 'noise', 'pattern'].map(pixelate => <button
                        key={pixelate}
                        style={{opacity: layer.pixelate === pixelate ? 1 : .5}}
                        onClick={e => dispatch(setLayerPixelate({layer, pixelate}))}
                        >{pixelate}</button>
                    )}
                </div>

            </div>}
        </div>
    );
}
;
