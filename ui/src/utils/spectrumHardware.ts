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

    const data = (mem: Uint8Array): Float32Array => {
        const checksum = mem.reduce((acc, val) => acc ^ val, 0);
        const result = [...mem, checksum].reduce(
            (acc, val) => [
                ...acc,
                ...(((val >> 0) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 1) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 2) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 3) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 4) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 5) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 6) & 0x1) ? oneBit : zeroBit),
                ...(((val >> 7) & 0x1) ? oneBit : zeroBit)
            ],
            [] as number[]
        );
        return new Float32Array(result);
    }

    const dataBlockLength = 6144 + 768; // pixels + attrs
    const headerData = new Uint8Array(17);
    headerData[0] = 3; // this is header for code
    headerData[1] = 65; // title
    headerData[2] = 65; // title
    headerData[3] = 65; // title
    headerData[4] = 66; // title
    headerData[5] = 32; // title
    headerData[6] = 32; // title
    headerData[7] = 32; // title
    headerData[8] = 32; // title
    headerData[9] = 32; // title
    headerData[10] = 32; // title
    headerData[11] = dataBlockLength & 0xFF; // length of data block
    headerData[12] = (dataBlockLength >> 8) & 0xFF; // length of data block
    headerData[13] = 0; // screen memory start adderess is 0x4000
    headerData[14] = 0x40; // screen memory start adderess is 0x4000
    headerData[15] = 0; // static value 0x8000 for code blocks
    headerData[16] = 0x80; // static value 0x8000 for code blocks 

    const pulses = [
        ...pilotSignalForHeaderBlock,
        ...sync,
        ...data(headerData),
        ...pilotSignalForDataBlock,
        ...sync,
        ...data(new Uint8Array([...pixels, ...attributes]))
    ];

    const buffer = audioContext.createBuffer(1, pulses.length, audioContext.sampleRate);
    buffer.copyToChannel(new Float32Array(pulses), 0);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.loop = false;
    return source;
}

