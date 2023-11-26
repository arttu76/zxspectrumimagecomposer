import { AnyAction, Dispatch, MiddlewareAPI } from '@reduxjs/toolkit';
import * as R from "ramda";
import { Color, Keys, Layer, Nullable, PartialRgbImage, PixelationSource, Rgb, ToolType } from "../types";
import { edgeEnhance, gaussianBlur, getColorAdjusted, getInverted, sharpen } from "../utils/colors";
import { computeAttributeBlockColor, isDitheredPixelSet } from "../utils/dithering";
import { initializeLayerContext } from "../utils/layerContextManager";
import { isMaskSet } from "../utils/maskManager";
import { applyRange2DExclusive, getInitialized2DArray, getSourceRgb, getWindow, rangeExclusive } from "../utils/utils";
import { repaint } from "./housekeepingSlice";
import {
    addLayerPattern,
    duplicateLayer,
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
    setLayerRequirePatternCacheRefresh,
    setLayerRequireSpectrumPixelsRefresh,
    setLayerRotate,
    setLayerSaturation,
    setLayerShadows,
    setLayerSrcImage,
    setLayerWidth,
    setLayerX,
    setLayerY,
    showHideLayer,
    updateLayerPattern
} from "./layersSlice";
import store from "./store";
import { setTool } from './toolsSlice';

const updateAdjustedPixelsIfRequired = () => {

    const win = getWindow();
    if (!win[Keys.adjustedPixels]) {
        win[Keys.adjustedPixels] = {};
    }

    store.getState().layers.layers
        .filter((layer: Layer) => layer.requireAdjustedPixelsRefresh)
        .forEach((layer: Layer) => {

            const height = layer.height || 0;
            const width = layer.width || 0;

            // initialize original pixels if source image has changed (=different dimensions)
            if (
                !win[Keys.adjustedPixels][layer.id]
                || win[Keys.adjustedPixels][layer.id].length !== height
                || (
                    win[Keys.adjustedPixels][layer.id][0].length > 0
                    && win[Keys.adjustedPixels][layer.id][0].length !== width
                )
            ) {
                win[Keys.adjustedPixels][layer.id] = getInitialized2DArray<Nullable<Rgb>>(192, 256, null);
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

            win[Keys.adjustedPixels][layer.id] = adjustedPixels;
            store.dispatch(setLayerRequireAdjustedPixelsRefresh({ layer, required: false }))
        });
}

const updatePatternCacheIfRequired = () => {

    const win = getWindow();
    if (!win[Keys.patternCache]) {
        win[Keys.patternCache] = {};
    }
    const state = store.getState();

    state.layers.layers
        .filter((layer: Layer) => layer.requirePatternCacheRefresh)
        .forEach((layer: Layer) => {

            if (!win[Keys.patternCache][layer.id]) {
                win[Keys.patternCache][layer.id] = [];
            }

            win[Keys.patternCache][layer.id] = rangeExclusive(256).map(brightness => R.reduce(
                (acc, pattern) => (acc !== layer.patterns[layer.patterns.length - 1].pattern)
                    ? acc // already chose something other than the last pattern
                    : brightness < pattern.limit ? pattern.pattern : acc,
                layer.patterns.length ? layer.patterns[layer.patterns.length - 1].pattern : [],
                R.init(layer.patterns)
            ));

            store.dispatch(setLayerRequirePatternCacheRefresh({ layer, required: false }))
        });

    store.dispatch(repaint());
}

const updateSpectrumPixelsAndAttributesIfRequired = () => {

    const win = getWindow();
    updateAdjustedPixelsIfRequired(); // make sure source adjusted pixels are up to date

    if (!win[Keys.adjustedSpectrumAttributes]) {
        win[Keys.adjustedSpectrumAttributes] = {};
    }
    if (!win[Keys.adjustedSpectrumPixels]) {
        win[Keys.adjustedSpectrumPixels] = {};
    }

    const state = store.getState();

    state.layers.layers
        .filter((layer: Layer) => layer.requireSpectrumPixelsRefresh)
        .forEach((layer: Layer) => {

            if (!win[Keys.adjustedSpectrumAttributes][layer.id]) {
                win[Keys.adjustedSpectrumAttributes][layer.id] = getInitialized2DArray<Nullable<Color>>(24, 32, null);
            }

            if (!win[Keys.adjustedSpectrumPixels][layer.id]) {
                win[Keys.adjustedSpectrumPixels][layer.id] = getInitialized2DArray<Nullable<boolean>>(192, 256, null);
            }

            const ditheringContext = initializeLayerContext(
                layer,
                state.tools.tool
            );

            applyRange2DExclusive(192, 256, (y, x) => {
                const attrX = Math.floor(x / 8);
                const attrY = Math.floor(y / 8);

                if (x % 8 === 0 && y % 8 === 0) {
                    let allPixelsInCharEmpty = rangeExclusive(8).every(
                        yOffset => rangeExclusive(8).every(
                            xOffset => (
                                // pixel is considered empty if it is masked
                                // (it's never considered masked if we are using mask tool) ...
                                (
                                    isMaskSet(layer, x + xOffset, y + yOffset, true)
                                    && state.tools.tool !== ToolType.mask
                                )
                                // ... or if it has no pixels
                                || win[Keys.adjustedPixels][layer.id][y + yOffset][x + xOffset] === null
                            )
                        )
                    );

                    if (allPixelsInCharEmpty) {
                        win[Keys.adjustedSpectrumAttributes][layer.id][attrY][attrX] = null;
                    } else {
                        win[Keys.adjustedSpectrumAttributes][layer.id][attrY][attrX] = layer.pixelateSource === PixelationSource.targetColor
                            ? layer.pixelateTargetColor
                            : computeAttributeBlockColor(layer, x, y);
                    }
                }

                const attribute = win[Keys.adjustedSpectrumAttributes][layer.id][attrY][attrX];

                win[Keys.adjustedSpectrumPixels][layer.id][y][x] = (
                    attribute // if there is no attribute, no use checking if pixel is to be dithered or not
                        ? isDitheredPixelSet(ditheringContext, x, y)
                        : null
                );

            });

            store.dispatch(setLayerRequireSpectrumPixelsRefresh({ layer, required: false }))
        });

    store.dispatch(repaint());
}

const repaintScreenMiddleware = (storeApi: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {

    const originalActionResult = next(action);

    // do source pixels have to be updated?
    if ([
        showHideLayer.type,
        setLayerSrcImage.type,
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

    if ([
        duplicateLayer.type,
        addLayerPattern.type,
        updateLayerPattern.type,
        removeLayerPattern.type
    ].includes(action.type)) {
        storeApi.dispatch(setLayerRequirePatternCacheRefresh({
            layer: action.payload.layer,
            required: true
        }));
    }

    // do spectrum pixels have to be updated?
    if ([
        setTool.type,
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
        setLayerRequirePatternCacheRefresh.type,
        setLayerRequireAdjustedPixelsRefresh.type,
        setLayerRequireSpectrumPixelsRefresh.type
    ].includes(action.type)) {
        updateAdjustedPixelsIfRequired();
        updatePatternCacheIfRequired();
        updateSpectrumPixelsAndAttributesIfRequired();
    }

    return originalActionResult;
};

export default repaintScreenMiddleware;
