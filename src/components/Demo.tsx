import { useEffect, useState } from 'react';
import '../styles/Toolbar.scss';


import { SpectrumPixelCoordinate } from "../types";
import { getSpectrumRgb } from '../utils/colors';
import { getSpectrumMemoryAttribute, getSpectrumMemoryPixelOffsetAndBit } from '../utils/spectrumHardware';
import { applyRange2DExclusive } from '../utils/utils';

export const Demo = () => {

    const pixelSize = 192 * 256 / 8;

    const [error, setError] = useState("");

    useEffect(() => {
        const bitmap = [
            ...(new Array(pixelSize).fill(0)),
            ...(new Array(32 * 24).fill(8 + 16 + 32))
        ];
        (window as any)!.mem = bitmap;
    }, []);


    const [code, setCode] = useState("");
    const runCode = (newCode: string) => {
        try {
            const bitmap = [
                ...(new Array(pixelSize).fill(0)),
                ...(new Array(32 * 24).fill(8 + 16 + 32))
            ];
            (window as any)!.mem = bitmap;

            eval(newCode);
            setError("");
        } catch (err) {
            console.log(err);
            setError('' + err);
        }
        console.log(newCode);
        setCode(newCode);
    }

    const canvasRef = (canvas: HTMLCanvasElement) => {
        if (canvas === null || !(window as any)!.mem) {
            return;
        }

        console.log("render");

        const screenCtx = canvas.getContext("2d")!;
        const imageData = screenCtx.createImageData(255, 192);

        applyRange2DExclusive<SpectrumPixelCoordinate>(192, 256, (y, x) => {
            const pixelLocation = getSpectrumMemoryPixelOffsetAndBit(x, y);
            const bitmapPixel = !!((window as any)!.mem[pixelLocation[0]] >> (pixelLocation[1]) & 1);
            const attr = getSpectrumMemoryAttribute((window as any)!.mem.slice(pixelSize) as unknown as Uint8Array, x, y);
            const rgb = getSpectrumRgb(attr, bitmapPixel);

            const offset = (y * 255 + x) * 4;
            imageData.data[offset] = rgb[0];
            imageData.data[offset + 1] = rgb[1];
            imageData.data[offset + 2] = rgb[2];
            imageData.data[offset + 3] = 255;
        });

        screenCtx.putImageData(imageData, 0, 0);
    }

    return <>
        <div className="ScreenCanvasContainer"
            style={{
                width: 255,
                height: 192,
                border: '10px solid white'
            }}>
            <canvas
                width={255}
                height={192}
                ref={canvasRef}
            ></canvas>
        </div>
        <textarea rows={10} cols={50} value={code} onChange={(e) => runCode(e.target.value)}></textarea>
        <br />
        {error}
    </>
};
