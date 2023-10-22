import { Color, Nullable, Percentage, PixelationType, Rgb } from '../types';
import { getInkIntensity, getIntensity, getIntensityDifference, getPaperIntensity, spectrumColor } from './colors';
import { DitheringErrorBuffer, LayerContext, PatternCache, getDitheringContextAttributeBlockColor } from './layerContextManager';
import { applyRange2DExclusive } from './utils';

export const getColorDistance = (a: Rgb, b: Rgb): number => {
    const rDiff = b[0] - a[0];
    const gDiff = b[1] - a[1];
    const bDiff = b[2] - a[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

export const getInkSimilarityPercentage = (source: Rgb, target: Color): Percentage => {

    const sourceIntensity = getIntensity(source);
    const inkIntensity = getInkIntensity(target);
    const paperIntensity = getPaperIntensity(target);

    if (inkIntensity > paperIntensity) {
        if (sourceIntensity > inkIntensity) {
            return 1;
        }
        if (sourceIntensity < paperIntensity) {
            return 0;
        }

        const normalizer = 1 / (inkIntensity - paperIntensity);
        const sourceInkLikeness = (sourceIntensity - paperIntensity) * normalizer;
        return sourceInkLikeness;
    }

    if (inkIntensity < paperIntensity) {
        if (sourceIntensity < inkIntensity) {
            return 0;
        }
        if (sourceIntensity > paperIntensity) {
            return 1;
        }
        const normalizer = 1 / (paperIntensity - inkIntensity);
        const sourcePaperLikeness = (sourceIntensity - inkIntensity) * normalizer;
        return 1 - sourcePaperLikeness;
    }

    return 0.5;
}

const simple = (source: Rgb, target: Color): boolean => {
    return getIntensityDifference(source, target, true) < getIntensityDifference(source, target, false);
}

const noise = (source: Rgb, x: number, y: number, target: Color): boolean => {
    const deterministicRandom = Math.sin(x + y * 255) * 10000;
    const normalizedDeterministicRandom = (deterministicRandom - Math.floor(deterministicRandom));
    return normalizedDeterministicRandom < getInkSimilarityPercentage(source, target);
}

const floydsteinberg = (source: Rgb, x: number, y: number, ditheringErrorBuffer: DitheringErrorBuffer, target: Color): boolean => {
    // error buffer has one pixel margin so we don't need to check for x>0 or y<192 etc
    const errorBufferX = x + 1;
    const errorBufferY = y + 1;
    const accumulatedError = ditheringErrorBuffer[errorBufferY][errorBufferX];
    const unditheredValue = getInkSimilarityPercentage(source, target) + accumulatedError;
    const pixelOn = unditheredValue > 0.5;
    const error = unditheredValue - (pixelOn ? 1 : 0);
    ditheringErrorBuffer[errorBufferY][errorBufferX + 1] += error * 7 / 16;
    ditheringErrorBuffer[errorBufferY + 1][errorBufferX - 1] += error * 3 / 16;
    ditheringErrorBuffer[errorBufferY + 1][errorBufferX] += error * 5 / 16;
    ditheringErrorBuffer[errorBufferY + 1][errorBufferX + 1] += error * 1 / 16;

    return pixelOn;
}

const pattern = (source: Rgb, x: number, y: number, layerPatternCache: PatternCache, target: Color): boolean => {
    const similarity = getInkSimilarityPercentage(source, target);
    const correctPattern = layerPatternCache[Math.round(similarity * 255)];
    if (!correctPattern?.length) {
        return similarity > 0.5;
    } else {
        const patternRow = correctPattern[y % correctPattern.length];
        return patternRow[x % patternRow.length];
    }
}

export const isDitheredPixelSet = (ctx: LayerContext, x: number, y: number): boolean => {

    const target = getDitheringContextAttributeBlockColor(ctx, x, y);
    if (target === null) {
        return false;
    }

    const source = ctx.adjustedPixels[y][x];
    if (source !== null) {
        if (ctx.layer.pixelate === PixelationType.simple) {
            return simple(source, target);
        }
        if (ctx.layer.pixelate === PixelationType.noise) {
            return noise(source, x, y, target);
        }

        if (ctx.layer.pixelate === PixelationType.floydsteinberg) {
            return floydsteinberg(source, x, y, ctx.ditheringErrorBuffer, target);
        }

        if (ctx.layer.pixelate === PixelationType.pattern) {
            return pattern(source, x, y, ctx.patternCache, target);
        }
    }

    // no dither
    return false;
}

export const computeAttributeBlockColor = (ctx: LayerContext, x: number, y: number): Nullable<Color> => {
    const contributingAdjustedPixels: Rgb[] = [];
    applyRange2DExclusive(8, 8, (yOffset, xOffset) => {
        const rgb = ctx.adjustedPixels[y + yOffset]?.[x + xOffset] || null;
        if (rgb !== null) {
            contributingAdjustedPixels.push(rgb);
        }
    });

    // is attribute block bright or not
    const bright = ctx.layer.brightnessThreshold === 0
        ? true // always bright
        : ctx.layer.brightnessThreshold === 100
            ? false // always dark
            : (
                (contributingAdjustedPixels || []).reduce(
                    (acc, val) => acc + val[0] + val[1] + val[2],
                    0
                ) / (contributingAdjustedPixels.length * 3)
            ) > (ctx.layer.brightnessThreshold * 2.55) // bright if treshold exceeded 

    // transform contributing pixels to spectrum colors
    const normalOrBrightColors = bright ? spectrumColor.bright : spectrumColor.normal;
    const availableColors = ctx.layer.pixelateAutoColors.map(colorIndex => normalOrBrightColors[colorIndex]);

    const frequencyMap: Map<number, number> = new Map(); // key = color index, value = popularity/appearance count
    contributingAdjustedPixels.forEach(rgb => {
        const nearestSpectrumColors = [...availableColors].sort((a, b) => getColorDistance(rgb, a) - getColorDistance(rgb, b));
        const mostPopularIndex = normalOrBrightColors.indexOf(nearestSpectrumColors[0]);
        const secondMostPopularIndex = normalOrBrightColors.indexOf(nearestSpectrumColors[1]);
        frequencyMap.set(mostPopularIndex, (frequencyMap.get(mostPopularIndex) || 0) + 8);
        frequencyMap.set(secondMostPopularIndex, (frequencyMap.get(secondMostPopularIndex) || 0) + 1);
    });

    const sortedEntries = [...frequencyMap.entries()]
        .sort((colorAndPopularityPairA, colorAndPopularityPairB) => colorAndPopularityPairB[1] - colorAndPopularityPairA[1]);

    const mostPopularColor = sortedEntries.length > 0
        ? sortedEntries[0][0]
        : null;

    const secondMostPopularColor = sortedEntries.length > 1
        ? sortedEntries[1][0]
        : mostPopularColor;

    let ink = mostPopularColor!;
    let paper = secondMostPopularColor!;

    if (ink < paper) {
        const temp = ink;
        ink = paper;
        paper = temp;
    }

    return mostPopularColor !== null
        ? {
            ink,
            paper,
            bright
        }
        : null;
}