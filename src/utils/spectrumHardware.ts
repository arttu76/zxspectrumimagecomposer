import { Color, Rgb, SpectrumMemoryFragment, SpectrumPixelCoordinate } from "../types";
import { getSpectrumRgb } from "./colors";
import { getBackgroundValue } from "./uiPixelOperations";
import { applyRange2DExclusive } from "./utils";

export const getDefaultColor = (): Color => ({
    ink: 0,
    paper: 7,
    bright: false
});

export const getSpectrumMemoryAttributeByte = (color: Color): number => {
    return color.ink + (color.paper << 3) + (color.bright ? 64 : 0);
}

export const getColorFromAttributeByte = (value: number): Color => {
    return {
        ink: value & 0b111,
        paper: (value >> 3) & 0b111,
        bright: !!(value & 0b1000000)
    }
}

export const getInvertedBitmap = (
    mem: SpectrumMemoryFragment,
    invert: boolean
): SpectrumMemoryFragment => invert
        ? mem.map(value => value ^ 255)
        : mem;

export const getInvertedAttributes = (
    mem: SpectrumMemoryFragment,
    invert: boolean
): SpectrumMemoryFragment => invert
        ? mem.map(value => {
            const { ink, paper, bright } = getColorFromAttributeByte(value);
            return getSpectrumMemoryAttributeByte({ ink: paper, paper: ink, bright });
        })
        : mem;

export const setSpectrumMemoryAttribute = (mem: SpectrumMemoryFragment, x: SpectrumPixelCoordinate, y: SpectrumPixelCoordinate, color: Color) => {
    mem[Math.floor(x / 8) + Math.floor(y / 8) * 32] = getSpectrumMemoryAttributeByte(color);
}

export const getSpectrumMemoryAttribute = (mem: SpectrumMemoryFragment, x: SpectrumPixelCoordinate, y: SpectrumPixelCoordinate): Color => {
    return getColorFromAttributeByte(mem[Math.floor(x / 8) + Math.floor(y / 8) * 32]);
}

export const getSpectrumMemoryPixelOffsetAndBit = (x: number, y: number): [number, number] => {
    const xBytePos = x >> 3;
    const third = Math.floor(y / 64);
    const thirdOffset = third * 32 * 8 * 8;
    const yMod = y % 8;
    const previousLines = 32 * 8 * yMod;
    const fromTop = Math.floor(y % 64 / 8) * 32

    return [
        thirdOffset + previousLines + fromTop + xBytePos,
        7 - (x & 0b111)
    ];
}

export const setSpectrumMemoryPixel = (mem: SpectrumMemoryFragment, x: SpectrumPixelCoordinate, y: SpectrumPixelCoordinate, value: boolean) => {
    const offsetAndBit = getSpectrumMemoryPixelOffsetAndBit(x, y);
    mem[offsetAndBit[0]] = value
        ? mem[offsetAndBit[0]] | (1 << offsetAndBit[1])
        : mem[offsetAndBit[0]] & ~(1 << offsetAndBit[1]);
}

export const getTapeSoundAudioBufferSourceNode = (pixels: SpectrumMemoryFragment, attributes: SpectrumMemoryFragment): {
    audio: AudioBufferSourceNode,
    pulseOffsetsForData: number[]
} => {

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    let pulseValue = -0.95;

    const getSampleCountForTStates = (tStates: number): number => Math.round(tStates * (1 / 3546000) * audioContext.sampleRate);

    const getPulseSamples = (numberOfSamples: number): Float32Array => {
        pulseValue = -pulseValue;
        return new Float32Array(getSampleCountForTStates(numberOfSamples)).fill(pulseValue);
    }

    const generatePulses = (pulseCount: number, pulseLengthInTStates: number): Float32Array => {
        const sampleCountForOnePulse = getSampleCountForTStates(pulseLengthInTStates);
        const result = new Float32Array(sampleCountForOnePulse * pulseCount);
        for (let i = 0; i < pulseCount; i++) {
            result.set(getPulseSamples(pulseLengthInTStates), i * sampleCountForOnePulse);
        }
        return result;
    }

    const generatePilotSignalForHeaderBlock = () => generatePulses(8063, 2168);
    const generatePilotSignalForDataBlock = () => generatePulses(3223, 2168);
    const generateSyncPulses = () => [...generatePulses(1, 667), ...generatePulses(1, 735)];
    const generateZeroBitPulses = () => generatePulses(2, 855);
    const generateOneBitPulses = () => generatePulses(2, 1710);

    const zeroBitPulseLength = generateZeroBitPulses().length;
    const oneBitPulseLength = generateOneBitPulses().length;

    const generateDataPulses = (dataBlock: boolean, mem: SpectrumMemoryFragment): { pulses: Float32Array, pulseOffsets: number[] } => {
        const dataWithHeader = [dataBlock ? 255 : 0, ...mem];
        const dataWithHeaderAndChecksum = [
            ...dataWithHeader,
            dataWithHeader.reduce((acc, val) => acc ^ val, 0) // each block ends with checksum which is all bytes xorred together
        ];

        const numberOfOnes = dataWithHeaderAndChecksum
            .map(byte => byte.toString(2).split('1').length - 1)
            .reduce((acc, val) => acc + val, 0);
        const numberOfZeroes = dataWithHeaderAndChecksum.length * 8 - numberOfOnes;

        const bufferSize = zeroBitPulseLength * numberOfZeroes + oneBitPulseLength * numberOfOnes;

        const result = new Float32Array(bufferSize);
        let offset = 0;
        let pulseOffsets = []; // number of pulses before each byte
        for (const value of dataWithHeaderAndChecksum) {
            pulseOffsets.push(offset); // pulseOffset[X] tells us how many pulses there has been before Xth byte
            for (let i = 7; i > -1; i--) {
                const pulse = ((value >> i) & 0b1) ? generateOneBitPulses() : generateZeroBitPulses();
                result.set(pulse, offset);
                offset += pulse.length;
            }
        }
        pulseOffsets.push(offset);

        return { pulses: result, pulseOffsets };
    }

    const initPulses = [
        ...generatePilotSignalForHeaderBlock(),
        ...generateSyncPulses(),
        ...generateDataPulses(false, new Uint8Array([
            0x03, // this is header for code
            0x45, // title E
            0x58, // title X
            0x50, // title P
            0x4F, // title O
            0x52, // title R
            0x54, // title T
            0x45, // title E
            0x44, // title D
            0x20, // title
            0x20, // title
            0x00, 0x1B, // length
            0x00, 0x40, // start address
            0x00, 0x80 // tape loader header parameter 2 is unused
        ])).pulses,
        ...new Array<number>(10000).fill(0),
        ...generatePilotSignalForDataBlock(),
        ...generateSyncPulses()
    ];

    const dataPulses = generateDataPulses(true, new Uint8Array([...pixels, ...attributes]))
    const pulses = [
        ...initPulses,
        ...dataPulses.pulses
    ]

    const buffer = audioContext.createBuffer(1, pulses.length, audioContext.sampleRate);
    buffer.copyToChannel(new Float32Array(pulses), 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.loop = false;

    return { audio: source, pulseOffsetsForData: dataPulses.pulseOffsets };
}

export const drawSpectrumMemoryToImageDatas = (
    pixels: SpectrumMemoryFragment,
    attributes: SpectrumMemoryFragment,
    exportFullScreen: boolean,
    exportCharX: number,
    exportCharY: number,
    exportCharWidth: number,
    exportCharHeight: number,
    imageDatas: ImageData[]
) => {

    applyRange2DExclusive<SpectrumPixelCoordinate>(192, 256, (y, x) => {

        let rgb: Rgb;

        if (
            !exportFullScreen
            && (
                x / 8 < exportCharX
                || y / 8 < exportCharY
                || x / 8 >= exportCharX + exportCharWidth
                || y / 8 >= exportCharY + exportCharHeight
            )
        ) {
            const bg = getBackgroundValue(x, y);
            rgb = [bg, bg, bg];
        } else {
            const pixelLocation = getSpectrumMemoryPixelOffsetAndBit(x, y);
            const bitmapPixel = !!(pixels[pixelLocation[0]] >> (pixelLocation[1]) & 1);
            const attr = getSpectrumMemoryAttribute(attributes, x, y);
            rgb = getSpectrumRgb(attr, bitmapPixel);
        }

        const offset = (y * 256 + x) * 4;
        imageDatas.forEach(i => {
            i.data[offset] = rgb[0];
            i.data[offset + 1] = rgb[1];
            i.data[offset + 2] = rgb[2];
            i.data[offset + 3] = 255;
        });

    });

}
