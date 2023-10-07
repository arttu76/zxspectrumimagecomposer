import '../styles/PatternEditor.scss'

import React from "react";

import { useAppDispatch } from "../store/store";

import * as R from "ramda";

import {
    updateLayerPattern,
    removeLayerPattern
} from "../store/layersSlice";

import { Layer, PixelationPattern } from "../types";

export const PatternEditor: React.FC<{
    layer: Layer,
    idx: number,
    pattern: PixelationPattern,
    first: boolean,
    last: boolean
}> = ({ layer, idx, pattern, first, last }) => {

    const dispatch = useAppDispatch();

    const removePattern = () => {
        dispatch(removeLayerPattern({
            layer,
            idx
        }));
    }

    const adjustWidth = (change: number) => {
        if (change === -1 && pattern.pattern[0].length === 1) {
            return;
        }

        let patternClone = R.clone(pattern);
        patternClone.pattern.forEach(row => {
            if (change === 1) row.push(false);
            if (change === -1) row.splice(row.length - 1, 1);
        });

        dispatch(updateLayerPattern({
            layer,
            pattern: patternClone,
            idx
        }));
    }

    const adjustHeight = (change: number) => {
        if (change === -1 && pattern.pattern.length === 1) {
            return;
        }
        let patternClone = R.clone(pattern);
        if (change === 1) {
            patternClone.pattern.push(R.clone(pattern.pattern[pattern.pattern.length - 1]));
        }
        if (change === -1) {
            patternClone.pattern.splice(patternClone.pattern.length - 1, 1);
        }
        dispatch(updateLayerPattern({
            layer,
            pattern: patternClone,
            idx
        }));
    }

    const togglePatternPixel = (x: number, y: number) => {
        let patternClone = R.clone(pattern);
        patternClone.pattern[y][x] = !pattern.pattern[y][x];
        dispatch(updateLayerPattern({
            layer,
            pattern: patternClone,
            idx
        }));
    }

    const swapPattern = (a: number, b: number) => {
        const patternClone = R.clone(layer.patterns[a]);

        dispatch(updateLayerPattern({
            layer,
            pattern: R.clone(layer.patterns[b]),
            idx: a
        }));
        dispatch(updateLayerPattern({
            layer,
            pattern: patternClone,
            idx: b
        }));
    }

    const setLimit = (limit: number | string) => {
        dispatch(updateLayerPattern({
            layer,
            pattern: R.assoc(
                'limit',
                Math.round(parseInt('' + limit, 10)) || 0,
                pattern
            ),
            idx
        }));
    }

    return (
        <div className="PatternEditor" style={{ margin: '2px 0 0 145px', border: '1px solid rgba(0,0,0,0.5)' }}>

            <button style={{ float: "right" }} onClick={() => removePattern()}>X</button>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div>
                    {!first ? <button onClick={() => swapPattern(idx - 1, idx)}>^</button> : <span>&nbsp;&nbsp;</span>}
                    {!last ? <button onClick={() => swapPattern(idx + 1, idx)}>V</button> : <span>&nbsp;&nbsp;</span>}
                </div>
                <div>
                    <span style={{ visibility: last ? 'hidden' : 'inherit' }}>
                        <button onClick={() => setLimit(pattern.limit - 1)}>-1</button>
                        <button onClick={() => setLimit(Math.max(0, pattern.limit - 8))}>-8</button>
                        <input type="number"
                            style={{ textAlign: 'center' }}
                            size={4}
                            value={pattern.limit}
                            onChange={e => setLimit(e.target.value)} />
                        <button onClick={() => setLimit(Math.min(255, pattern.limit + 8))}>+8</button>
                        <button onClick={() => setLimit(pattern.limit + 1)}>+1</button>
                    </span>

                </div>
                <div>
                    {pattern.pattern.map((row, y) => <div key={y} style={{ height: '15px', whiteSpace: 'nowrap' }}>
                        {row.map((pixel, x) => <div key={y + '_' + x} onClick={() => togglePatternPixel(x, y)} style={{
                            cursor: 'pointer',
                            background: pixel ? 'white' : 'black',
                            display: 'inline-block',
                            height: '15px',
                            width: '15px',
                            margin: 'margin:0 1px 1px 0'
                        }}></div>)}
                        <br />
                    </div>)}
                </div>
                <div>
                    Width:
                    <button onClick={() => adjustWidth(-1)}>-1</button>
                    <button onClick={() => adjustWidth(1)}>+1</button>
                    <br />
                    Height:
                    <button onClick={() => adjustHeight(-1)}>-1</button>
                    <button onClick={() => adjustHeight(1)}>+1</button>
                </div>
            </div>
        </div>
    );
}

