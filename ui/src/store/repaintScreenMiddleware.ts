import { Color, Layer, Nullable, PartialRgbImage, PixelationSource, Rgb } from "../types";
import { edgeEnhance, gaussianBlur, getColorAdjusted, getInverted, sharpen } from "../utils/colors";
import { computeAttributeBlockColor, isDitheredPixelSet } from "../utils/dithering";
import { initializeLayerContext } from "../utils/layerContextManager";
import { applyRange2DExclusive, getInitialized2DArray, getSourceRgb, getWindow } from "../utils/utils";
import {
    addLayerPattern,
    preserveLayerAspectRatio,
    removeLayerPattern,
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
    setLayerRequireAdjustedPixelsRefresh,
    setLayerRequireSpectrumPixelsRefresh,
    setLayerRotate,
    setLayerSaturation,
    setLayerShadows,
    setLayerSrcDimensions,
    setLayerWidth,
    setLayerX,
    setLayerY,
    showHideLayer,
    updateLayerPattern
} from "./layersSlice";
import { repaint } from "./repaintSlice";
import store from "./store";

const updateAdjustedPixels = () => {

    const win = getWindow();
    if (!win.adjustedPixels) {
        win.adjustedPixels = {};
    }

    store.getState().layers.layers
        .filter((layer: Layer) => layer.requireAdjustedPixelsRefresh)
        .forEach((layer: Layer) => {

            const height = layer.height || 0;
            const width = layer.width || 0;

            // initialize original pixels if source image has changed (=different dimensions)
            if (
                !win.adjustedPixels[layer.id]
                || win.adjustedPixels[layer.id].length !== height
                || (
                    win.adjustedPixels[layer.id][0].length > 0
                    && win.adjustedPixels[layer.id][0].length !== width
                )
            ) {
                win.adjustedPixels[layer.id] = getInitialized2DArray<Nullable<Rgb>>(192, 256, null);
            }

            let adjustedPixels: PartialRgbImage = getInitialized2DArray<Nullable<Rgb>>(192, 256, null);
            applyRange2DExclusive(192, 256, (y, x) => {
                const rgb = getSourceRgb(layer, x, y);
                adjustedPixels[y][x] = rgb === null
                    ? null
                    : getColorAdjusted(layer, getInverted(layer, rgb));
            });

            if (layer.blur > 0) {
                adjustedPixels = gaussianBlur(adjustedPixels, layer.blur / 100);
            }
            if (layer.blur < 0) {
                adjustedPixels = sharpen(adjustedPixels, -layer.blur / 100);
            }

            if (layer.edgeEnhance) {
                adjustedPixels = edgeEnhance(adjustedPixels, layer.edgeEnhance / 100);
            }

            getWindow().adjustedPixels[layer.id] = adjustedPixels;

            store.dispatch(setLayerRequireAdjustedPixelsRefresh({ layer, required: false }))
        });
}

const updateSpectrumPixels = () => {

    const win = getWindow();
    updateAdjustedPixels(); // make sure source adjusted pixels are up to date

    const state = store.getState();

    state.layers.layers
        .filter((layer: Layer) => layer.requireSpectrumPixelsRefresh)
        .forEach((layer: Layer) => {

            if (!win.attributes) {
                win.attributes = {};
            }
            if (!win.attributes[layer.id]) {
                win.attributes[layer.id] = getInitialized2DArray<Nullable<Color>>(24, 32, null);
            }

            if (!win.pixels) {
                win.pixels = {};
            }
            if (!win.pixels[layer.id]) {
                win.pixels[layer.id] = getInitialized2DArray<Nullable<boolean>>(192, 256, null);
            }

            const ditheringContext = initializeLayerContext(
                layer,
                state.tools.tool
            );

            applyRange2DExclusive(192, 255, (y, x) => {
                const attrX = Math.floor(x / 8);
                const attrY = Math.floor(y / 8);

                if (x % 8 === 0 && y % 8 === 0) {
                    win.attributes[layer.id][attrY][attrX] = layer.pixelateSource === PixelationSource.targetColor
                        ? layer.pixelateTargetColor
                        : computeAttributeBlockColor(layer, x, y);
                }

                const attribute = win.attributes[layer.id][attrY][attrX];

                win.pixels[layer.id][y][x] = (
                    attribute // if there is no attribute, no use checking pixels
                        ? isDitheredPixelSet(ditheringContext, x, y)
                        : null
                );

            });

            store.dispatch(setLayerRequireSpectrumPixelsRefresh({ layer, required: false }))
        });

    store.dispatch(repaint());
}

const repaintScreenMiddleware = (storeApi: any) => (next: any) => (action: any) => {

    const originalActionResult = next(action);

    // do source pixels have to be updated?
    if ([
        showHideLayer.type,
        setLayerSrcDimensions.type,
        setLayerX.type,
        setLayerY.type,
        setLayerHeight.type,
        setLayerWidth.type,
        preserveLayerAspectRatio.type,
        setLayerRotate.type,
        setLayerFlipX.type,
        setLayerFlipY.type,
        setLayerBlur.type,
        setLayerEdgeEnhance.type,
        setLayerHue.type,
        setLayerSaturation.type,
        setLayerRed.type,
        setLayerGreen.type,
        setLayerBlue.type,
        setLayerBrightness.type,
        setLayerContrast.type,
        setLayerInvert.type,
        setLayerShadows.type,
        setLayerMidtones.type,
        setLayerHighlights.type
    ].includes(action.type)) {
        storeApi.dispatch(setLayerRequireAdjustedPixelsRefresh({
            layer: action.payload.layer,
            required: true
        }));
    }

    // do spectrum pixels have to be updated?
    if ([
        setLayerPixelate.type,
        setLayerPixelateSource.type,
        setLayerPixelateAutoColors.type,
        setLayerPixelateTargetColor.type,
        setLayerBrightnessThreshold.type,
        addLayerPattern.type,
        updateLayerPattern.type,
        removeLayerPattern.type,
    ].includes(action.type)) {
        storeApi.dispatch(setLayerRequireSpectrumPixelsRefresh({
            layer: action.payload.layer,
            required: true
        }));
    }

    if (![
        repaint.type,
        setLayerRequireAdjustedPixelsRefresh.type,
        setLayerRequireSpectrumPixelsRefresh.type
    ].includes(action.type)) {
        updateAdjustedPixels();
        updateSpectrumPixels();
    }

    if (['x'
    ].includes(action.type)) {
        storeApi.dispatch(repaint());
    }

    return originalActionResult;
};

export default repaintScreenMiddleware;
