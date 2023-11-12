import '../styles/PatternEditor.scss';

import React from "react";

import { useAppDispatch } from "../store/store";

import * as R from "ramda";

import {
    removeLayerPattern,
    updateLayerPattern
} from "../store/layersSlice";

import { Layer, PixelationPattern } from "../types";
import { Button, Input } from './CustomElements';
import { Group } from './Group';

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
        const patternA = R.clone(layer.patterns[a]);
        const patternB = R.clone(layer.patterns[b]);

        const aLimit = layer.patterns[a].limit;
        const bLimit = layer.patterns[b].limit;

        dispatch(updateLayerPattern({
            layer,
            pattern: {
                ...patternB,
                limit: aLimit
            },
            idx: a
        }));
        dispatch(updateLayerPattern({
            layer,
            pattern: {
                ...patternA,
                limit: bLimit
            },
            idx: b
        }));
    }

    const setLimit = (limit: number | string) => {
        dispatch(updateLayerPattern({
            layer,
            pattern: R.assoc(
                'limit',
                Math.min(Math.round(parseInt('' + limit, 10) || 0), 255),
                pattern
            ),
            idx
        }));
    }

    const layerStartIntensity = idx === 0 ? 0 : layer.patterns[idx - 1].limit;
    const layerEndIntensity = last ? 255 : layer.patterns[idx].limit;
    const coveragePercentage = Math.round((layerEndIntensity - layerStartIntensity) / 255 * 100);

    const warning = layerStartIntensity === layerEndIntensity || layerStartIntensity >= layerEndIntensity;

    return (
        <Group
            title={last ? `Pattern for other values (${coveragePercentage}%)` : `Pattern for ${layerStartIntensity}...${layerEndIntensity} (${coveragePercentage}%)`}
            cornerIcon="delete"
            cornerIconTooltip="Remove this pattern"
            cornerIconOnClick={removePattern}>
            <div className="PatternEditor">
                <div className="patternTools">
                    <div className="movePattern">
                        {!first && <Button
                            tooltip="Move up"
                            icon="north"
                            onClick={() => swapPattern(idx - 1, idx)} />}
                        {!last && <Button
                            tooltip="Move down"
                            icon="south"
                            onClick={() => swapPattern(idx + 1, idx)} />}
                    </div>
                    <div className={"patternLimits" + (warning ? " warning" : "")}>
                        {!last && <>
                            <Button
                                tooltip="Limit -1"
                                onClick={() => setLimit(Math.max(0, pattern.limit - 1))} >-1</Button>
                            <Button
                                tooltip="Limit -8"
                                onClick={() => setLimit(Math.max(0, pattern.limit - 8))} >-8</Button>
                            <Input type="text"
                                tooltip="Highest intensity for this pattern"
                                size={4}
                                value={pattern.limit}
                                onChange={e => setLimit(e.target.value)} />
                            <Button
                                tooltip="Limit +8"
                                onClick={() => setLimit(Math.min(255, pattern.limit + 8))} >+8</Button>
                            <Button
                                tooltip="Limit +1"
                                onClick={() => setLimit(Math.min(255, pattern.limit + 1))} >+1</Button>
                        </>}
                        <div className="patternPixels">
                            {pattern.pattern.map((row, y) => <div
                                key={pattern.id + y}
                                className="pixelRow">
                                {row.map((pixel, x) => <div
                                    key={pattern.id + y + '_' + x}
                                    className={pixel ? "pixel set" : "pixel"}
                                    onClick={() => togglePatternPixel(x, y)}></div>)}
                            </div>)}
                        </div>
                    </div>
                    <div className="patternSize">
                        <div>
                            <Button
                                tooltip="Increase pattern width"
                                onClick={() => adjustWidth(+1)} >X+</Button>
                            <Button
                                tooltip="Increase pattern height"
                                onClick={() => adjustHeight(+1)} >Y+</Button>
                        </div>
                        {pattern.pattern[0].length > 1 && <Button
                            tooltip="Decrease pattern width"
                            onClick={() => adjustWidth(-1)} >X-</Button>}
                        {pattern.pattern.length > 1 && <Button
                            tooltip="Decrease pattern height"
                            onClick={() => adjustHeight(-1)} >Y-</Button>}
                        <div>
                        </div>
                    </div>
                </div>
            </div>
        </Group >
    );
}

