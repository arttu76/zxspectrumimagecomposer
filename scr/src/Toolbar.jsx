import React from "react";
import {useSelector, useDispatch} from "react-redux";

import {
    setZoom,
    setCrispScaling,
    setTool,
    setBrushSize,
    setBrushShape
} from "./toolsSlice";

export const Toolbar = () => {
    const zoom = useSelector((state) => state.tools.zoom);
    const crisp = useSelector((state) => state.tools.crisp);
    const tool = useSelector((state) => state.tools.tool);
    const brushSize = useSelector((state) => state.tools.brushSize);
    const brushShape = useSelector((state) => state.tools.brushShape);

    const dispatch = useDispatch();

    return (
        <div>
            Tool:
            <button
                style={{opacity: tool === 'nudge' ? 1 : 0.5}}
                type="text"
                onClick={() => dispatch(setTool({tool: 'nudge'}))}>nudge</button>
            <button
                style={{opacity: tool === 'mask' ? 1 : 0.5}}
                type="text"
                onClick={() => dispatch(setTool({tool: 'mask'}))}>mask
            </button>
            <button
                style={{opacity: tool === 'attributes' ? 1 : 0.5}}
                type="text"
                onClick={() => dispatch(setTool({tool: 'attributes'}))}>attributes
            </button>

            &nbsp;

            {tool === 'nudge' ? '' : <span>
            Brush:
            <select value={brushSize} onChange={(e) => dispatch(setBrushSize({brushSize: e.target.value}))}>
                {[1, 2, 3, 4, 5, 10, 15, 20, 25].map(value => <option key={value} value={value}>{value}</option>)}
            </select>

            <select value={brushShape} onChange={(e) => dispatch(setBrushShape({brushShape: e.target.value}))}>
                {['block', 'circle'].map(value => <option key={value} value={value}>{value}</option>)}
            </select>

                &nbsp;
            </span>}

            Zoom:
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((zoomLevel) => <button
                key={zoomLevel}
                style={{opacity: zoom === zoomLevel ? 1 : 0.5}}
                type="text"
                onClick={() => dispatch(setZoom({zoom: zoomLevel}))}>{zoomLevel}</button>)}

            &nbsp;

            <span style={{opacity: zoom === 1 ? 0.25 : 1}}>
            Scaling:
            <button
                style={{opacity: crisp ? 1 : 0.5}}
                type="text"
                onClick={() => dispatch(setCrispScaling({crisp: true}))}>Pixelated</button>
            <button
                style={{opacity: crisp ? 0.5 : 1}}
                type="text"
                onClick={() => dispatch(setCrispScaling({crisp: false}))}>Smooth</button>
            </span>
        </div>
    );
};
