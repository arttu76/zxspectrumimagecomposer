import React from "react";
import {useSelector, useDispatch} from "react-redux";

import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";

import {Layer} from "./Layer";

import {
    setAttributeGrid,
    addLayer,
    changeLayerOrdering,
    changeBackground
} from "./layersSlice";

export const Layers = () => {
    const attributeGrid = useSelector((state) => state.layers.attributeGrid);
    const layers = useSelector((state) => state.layers.layers);
    const background = useSelector((state) => state.layers.background);
    const dispatch = useDispatch();

    const onDragEnd = (result) => {
        if (result.reason === 'DROP' && result.destination) {
            dispatch(changeLayerOrdering({
                fromIndex: result.source.index,
                toIndex: result.destination.index
            }));
        }
    };

    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: "none",
        ...draggableStyle,
        opacity: isDragging ? 0.75 : 1,
        boxShadow: isDragging ? '2px 2px 15px 0 rgba(0,0,0,0.75)' : 'none'

    });

    return (
        <div className="layerContainer">
            <div className="layerItem layerBackground">
                Show attribute grid:
                <input type="checkbox"
                       defaultChecked={attributeGrid}
                       onChange={e => dispatch(setAttributeGrid({ attributeGrid: e.target.checked}))}
                />
            </div>

            <button className="layerItem layerAdd"
                    type="text"
                    onClick={() => dispatch(addLayer())}>Add layer
            </button>
            <div>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {layers.map((layer, index) => (
                                    <Draggable key={layer.id} draggableId={'layer_' + layer.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={getItemStyle(
                                                    snapshot.isDragging,
                                                    provided.draggableProps.style
                                                )}
                                            ><Layer layer={layer}></Layer></div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
            <div className="layerItem layerBackground">
                Background:
                <select value={background} onChange={(e) => dispatch(changeBackground({background: e.target.value}))}>
                    <option value={-1}>Transparent</option>
                    <option value={0}>Black (0)</option>
                    <option value={1}>Blue (1)</option>
                    <option value={2}>Red (2)</option>
                    <option value={3}>Magenta (3)</option>
                    <option value={4}>Green (4)</option>
                    <option value={5}>Cyan (5)</option>
                    <option value={6}>Yellow (6)</option>
                    <option value={7}>White (7)</option>
                </select>
            </div>

        </div>
    );
};
