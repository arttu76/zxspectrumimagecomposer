import '../styles/Layers.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import { DragDropContext, Draggable, DraggingStyle, DropReason, DropResult, Droppable, NotDraggingStyle } from "react-beautiful-dnd";

import { LayerEditor } from "./LayerEditor";

import {
    addLayer,
    changeBackground,
    changeLayerOrdering
} from "../store/layersSlice";
import { Undefinable } from '../types';
import { Icon } from './Icon';

export const Layers = () => {

    const layers = useAppSelector((state) => state.layers.layers);
    const background = useAppSelector((state) => state.layers.background);
    const dispatch = useAppDispatch();

    const onDragEnd = (result: DropResult): void => {
        if (result.reason === 'DROP' as DropReason && result.destination) {
            dispatch(changeLayerOrdering({
                fromIndex: result.source.index,
                toIndex: result.destination.index
            }));
        }
    };

    const getItemStyle = (isDragging: boolean, draggableStyle: Undefinable<DraggingStyle | NotDraggingStyle>): any => ({
        ...draggableStyle,
        userSelect: "none",
        opacity: isDragging ? "0.75" : "1",
        boxShadow: isDragging ? '2px 2px 15px 0 rgba(0,0,0,0.75)' : 'none'
    });

    return (
        <div className="Layers">
            <button className="layerItem layerAdd"
                onClick={() => dispatch(addLayer())}><Icon icon='add_circle' /> Add layer
            </button>
            <div>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
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
                                            ><LayerEditor layer={layer}></LayerEditor></div>
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
                <Icon icon='background_replace' /> Background:
                <select value={background} onChange={(e) => dispatch(changeBackground({ background: e.target.value }))}>
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
