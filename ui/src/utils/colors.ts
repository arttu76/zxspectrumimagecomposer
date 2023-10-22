import { Color, Hsl, ImageFilterKernel, Layer, Nullable, PartialRgbImage, Percentage, Rgb, RgbImage } from "../types";
import { applyRange2DExclusive, bias, clamp8Bit, map2D, rangeExclusive } from "./utils";

export const spectrumColor: Readonly<{ normal: Rgb[], bright: Rgb[] }> = {
    normal: [
        [0, 0, 0],
        [27, 0, 216],
        [214, 0, 4],
        [214, 0, 217],
        [30, 223, 8],
        [42, 219, 217],
        [216, 221, 10],
        [217, 217, 217]
    ],
    bright: [
        [0, 0, 0],
        [31, 0, 254],
        [248, 0, 9],
        [242, 0, 245],
        [36, 255, 4],
        [49, 255, 255],
        [252, 255, 9],
        [255, 255, 255]
    ]
};

export const getSpectrumRgb = (color: Color, ink: boolean): Rgb => {
    const colors = color.bright
        ? spectrumColor.bright
        : spectrumColor.normal;
    return colors[ink ? color.ink : color.paper];
}

export const fromRgbToHsl = (rgb: Rgb): Hsl => {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const maxValue = Math.max(r, g, b);
    const minValue = Math.min(r, g, b);
    const add = maxValue + minValue;
    const diff = maxValue - minValue;

    if (maxValue === 0) {
        return [0, 0, 0];
    }

    const l = add / 2;

    let s = diff
        ? diff / (l > 0.5 ? (2 - add) : add)
        : 0;

    let h = maxValue === r
        ? (g - b) / (diff || 1) + (g < b ? 6 : 0)
        : maxValue === g
            ? 2 + (b - r) / diff
            : 4 + (r - g) / diff; // maxValue === b

    h = (h % 360 + 360) % 360;


    return [h * 60, s, l];
}

export const fromHslToRgb = (hsl: Hsl): Rgb => {

    const chroma = (1 - Math.abs(2 * hsl[2] - 1)) * hsl[1];
    const intermediate = chroma * (1 - Math.abs((hsl[0] / 60) % 2 - 1));
    const min = hsl[2] - chroma / 2;

    const to8BitRange = (value: number): number => Math.round((value + min) * 255);

    const hue = hsl[0] % 360;

    if (hue >= 0 && hue < 60) {
        return [chroma, intermediate, 0].map(to8BitRange) as Rgb;
    }
    if (hue >= 60 && hue < 120) {
        return [intermediate, chroma, 0].map(to8BitRange) as Rgb;
    }
    if (120 <= hue && hue < 180) {
        return [0, chroma, intermediate].map(to8BitRange) as Rgb;
    }
    if (180 <= hue && hue < 240) {
        return [0, intermediate, chroma].map(to8BitRange) as Rgb;
    }
    if (240 <= hue && hue < 300) {
        return [intermediate, 0, chroma].map(to8BitRange) as Rgb;
    }
    // if (300 <= hue && hue < 360) {
    return [chroma, 0, intermediate].map(to8BitRange) as Rgb;

}

export const getIntensity = (rgb: Rgb): Percentage => {
    return (rgb[0] + rgb[1] + rgb[2]) / 3 / 255;
}

export const getInkIntensity = (color: Color): Percentage => {
    return getIntensity(getSpectrumRgb(color, true));
}

export const getPaperIntensity = (color: Color): Percentage => {
    return getIntensity(getSpectrumRgb(color, false));
}

export const getIntensityDifference = (rgb: Rgb, color: Color, ink: boolean): Percentage => {
    return Math.abs(getIntensity(rgb) - getIntensity(getSpectrumRgb(color, ink)));
}

export const getInverted = (layer: Layer, rgb: Rgb): Rgb => {
    return layer.invert
        ? [
            255 - rgb[0],
            255 - rgb[1],
            255 - rgb[2]
        ]
        : [...rgb];
}

export const getColorAdjusted = (layer: Layer, rgb: Rgb): Rgb => {

    let newColor: Rgb = [
        clamp8Bit(rgb[0] * layer.red / 100),
        clamp8Bit(rgb[1] * layer.green / 100),
        clamp8Bit(rgb[2] * layer.blue / 100)
    ];

    if (
        layer.hue !== 0
        || layer.saturation !== 0
        || layer.brightness !== 0
        || layer.contrast !== 0
    ) {
        const hsl = fromRgbToHsl(newColor);

        // hue
        hsl[0] += layer.hue || 0;

        // saturation
        if (layer.saturation > 0) {
            hsl[1] += (layer.saturation / 100);
        }
        // desaturation
        if (layer.saturation < 0) {
            hsl[1] = bias(0, hsl[1], -layer.saturation / 100);
        }

        // brightness/lightness
        if (layer.brightness !== 0) {
            hsl[2] += (layer.brightness / 100);
        }

        // add contrast
        if (layer.contrast > 0) {
            hsl[2] = 0.5 + (hsl[2] - 0.5) * (1 + layer.contrast / 100);
        }

        if (layer.shadows && hsl[2] < 1 / 3) {
            const adjustmentPointDistance = 1 / 3 / 2 - Math.abs(hsl[2] - 1 / 3 / 2);
            hsl[2] += adjustmentPointDistance * layer.shadows / 50;
        }
        if (layer.midtones && hsl[2] >= 1 / 3 && hsl[2] <= 2 / 3) {
            const adjustmentPointDistance = 1 / 3 / 2 - Math.abs(hsl[2] - 1 / 3 - 1 / 3 / 2);
            hsl[2] += adjustmentPointDistance * layer.midtones / 50;
        }
        if (layer.highlights && hsl[2] > 2 / 3) {
            const adjustmentPointDistance = 1 / 3 / 2 - Math.abs(hsl[2] - 2 / 3 - 1 / 3 / 2);
            hsl[2] += adjustmentPointDistance * layer.highlights / 50;
        }

        newColor = fromHslToRgb(hsl);

    }

    return [
        clamp8Bit(newColor[0] * layer.red / 100),
        clamp8Bit(newColor[1] * layer.green / 100),
        clamp8Bit(newColor[2] * layer.blue / 100)
    ]
}

const applyKernel = (image: PartialRgbImage, kernel: ImageFilterKernel): PartialRgbImage => {
    const applyKernelAt = (x: number, y: number): Nullable<Rgb> => {
        if (image[y][x] === null) {
            return null;
        }

        let r = 0, g = 0, b = 0;
        const kernelSize = kernel.length;
        const mu = Math.floor(kernelSize / 2);
        applyRange2DExclusive(kernelSize, kernelSize, (ky, kx) => {
            const pixel = image[y + ky - mu]?.[x + kx - mu] || [0, 0, 0];
            r += pixel[0] * kernel[ky][kx];
            g += pixel[1] * kernel[ky][kx];
            b += pixel[2] * kernel[ky][kx];
        });
        return [r, g, b].map(clamp8Bit) as Rgb;
    }

    return map2D(image, (_, x, y) => applyKernelAt(x, y)) as RgbImage;
}

export const gaussianBlur = (image: PartialRgbImage, amount: Percentage): PartialRgbImage => {

    const getKernel = (size: number, sigma: number): ImageFilterKernel => {
        const mu = Math.floor(size / 2);
        let sum = 0;
        const unnormalizedKernel = rangeExclusive(size).map(y => rangeExclusive(size).map(x => {
            const value = (1 / (2 * Math.PI * sigma * sigma))
                * Math.exp(-((x - mu) ** 2 + (y - mu) ** 2) / (2 * sigma * sigma));
            sum += value;
            return value;
        }));

        return map2D(unnormalizedKernel, value => value / sum);
    }

    return applyKernel(image, getKernel(Math.ceil(amount * 20), amount * 100));
}

export const sharpen = (image: PartialRgbImage, amount: Percentage): PartialRgbImage => {

    const maximumSharpnessImage = applyKernel(
        image,
        [
            [-1, -1, -1],
            [-1, 9, -1],
            [-1, -1, -1]
        ]
    );

    return map2D(
        image,
        (pixel, x, y) => pixel === null || maximumSharpnessImage[y][x] === null
            ? null
            : pixel.map(
                (sourceImagePixelColor, rgbIdx) => bias(maximumSharpnessImage[y][x]![rgbIdx], sourceImagePixelColor, amount * 3)
            ) as Rgb
    );

}