import { Color, Hsl, Layer, Percentage, Rgb } from "../types";
import { limit8Bit } from "./utils";

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
        limit8Bit(rgb[0] * layer.red / 100),
        limit8Bit(rgb[1] * layer.green / 100),
        limit8Bit(rgb[2] * layer.blue / 100)
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
        if (layer.saturation > 0) hsl[1] += (layer.saturation / 100);

        // brightness/lightness
        hsl[2] += (layer.brightness / 100);

        // add contrast
        if (layer.contrast > 0) {
            hsl[2] = 0.5 + (hsl[2] - 0.5) * (1 + layer.contrast / 100);
        }

        newColor = fromHslToRgb(hsl);

        // desaturation
        if (layer.saturation < 0) {
            const desaturationPercentage = -layer.saturation / 100;
            const inverseDesaturationPercentage = 1 - desaturationPercentage;
            const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
            newColor = [
                brightness * desaturationPercentage + newColor[0] * inverseDesaturationPercentage,
                brightness * desaturationPercentage + newColor[1] * inverseDesaturationPercentage,
                brightness * desaturationPercentage + newColor[2] * inverseDesaturationPercentage
            ];
        }
    }

    return [
        limit8Bit(newColor[0] * layer.red / 100),
        limit8Bit(newColor[1] * layer.green / 100),
        limit8Bit(newColor[2] * layer.blue / 100)
    ]
}
