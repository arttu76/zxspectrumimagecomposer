import { Color, SpectrumMemoryFragment, SpectrumPixelCoordinate } from "../types";

export const getSpectrumMemoryAttributeByte = (color: Color) => {
    return color.ink + (color.paper << 3) + (color.bright ? 64 : 0);
}

export const getColorFromAttributeByte = (value: number): Color => {
    return {
        ink: value & 0b111,
        paper: (value >> 3) & 0b111,
        bright: value & 0b1000000 ? true : false
    }
}

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
    const previousLines = yMod === 0 ? 0 : 32 * 8 * yMod;
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

export const getTapeSoundAudioBufferSourceNode = (pixels: SpectrumMemoryFragment, attributes: SpectrumMemoryFragment): AudioBufferSourceNode => {

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const generatePulses = (pulseCount: number, pulseLengthInTStates: number): Float32Array => {
        const numSamples = (pulseLengthInTStates * pulseCount * (1 / 3500000)) * audioContext.sampleRate;
        const buffer = new Float32Array(numSamples);
        const frequency = 1 / (2 * pulseLengthInTStates * (1 / 3500000));
        for (let i = 0; i < numSamples; i++) {
            buffer[i] = Math.sin(2 * Math.PI * frequency * i / audioContext.sampleRate) > 0 ? 1 : -1;
        }
        return buffer;
    }

    const pilotSignalForHeaderBlock = generatePulses(8063, 2168);
    const pilotSignalForDataBlock = generatePulses(3223, 2168);

    const sync = [...generatePulses(1, 667), ...generatePulses(1, 735)];

    const zeroBit = generatePulses(2, 855);
    const oneBit = generatePulses(2, 1710);

    const data = (dataBlock: boolean, mem: SpectrumMemoryFragment): Float32Array => {
        const dataOrHeaderMarker = dataBlock ? 255 : 0;
        const data = [
            dataOrHeaderMarker,
            ...mem,
            [dataOrHeaderMarker, ...mem].reduce((acc, val) => acc ^ val, 0) // each block ends with checksum which is all bytes xorred together
        ];

        const numberOfOnes = data.map(byte => byte.toString(2).split('1').length - 1).reduce((acc, val) => acc + val, 0);
        const numberOfZeroes = data.length * 8 - numberOfOnes;

        const bufferSize = zeroBit.length * numberOfZeroes + oneBit.length * numberOfOnes;

        const result = new Float32Array(bufferSize);
        let offset = 0;
        for (const value of data) {
            for (let i = 0; i < 8; i++) {
                const zeroOrOnePulse = (value >> i) & 0x1
                    ? oneBit
                    : zeroBit;

                result.set(zeroOrOnePulse, offset);
                offset += zeroOrOnePulse.length;
            }
        }

        return result;
    }

    const headerData = [
        0x03, // this is header for code
        0x53, // title
        0x68, // title
        0x72, // title
        0x65, // title
        0x64, // title
        0x2E, // title
        0x7A, // title
        0x6F, // title
        0x6E, // title
        0x65, // title
        0x00, 0x1B, // length
        0x00, 0x40, // start address
        0x00, 0x00 // tape loader header param 2 unused
    ];

    const pulses = [
        ...pilotSignalForHeaderBlock,
        ...sync,
        ...data(false, new Uint8Array(headerData)),
        ...pilotSignalForDataBlock,
        ...sync,
        ...data(true, new Uint8Array([...pixels, ...attributes]))
    ];

    const buffer = audioContext.createBuffer(1, pulses.length, audioContext.sampleRate);
    buffer.copyToChannel(new Float32Array(pulses), 0);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.loop = false;
    return source;
}

