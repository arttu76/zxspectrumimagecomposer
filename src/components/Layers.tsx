import '../styles/Layers.scss';

import { useAppDispatch, useAppSelector } from '../store/store';

import { LayerEditor } from "./LayerEditor";

import {
    addLayer,
    changeBackground
} from "../store/layersSlice";
import { Button } from './CustomElements';
import { Icon } from './Icon';

export const Layers = () => {

    const layers = useAppSelector((state) => state.layers.layers);
    const background = useAppSelector((state) => state.layers.background);
    const dispatch = useAppDispatch();

    return (
        <div className="Layers">
            <div className="layerItem layerAdd">
                <Button
                    icon='add_circle'
                    content='Add layer'
                    tooltip="Add a new layer"
                    onClick={() => dispatch(addLayer())} >Add layer</Button>
            </div>
            <div>
                {layers.map((layer) => <LayerEditor key={layer.id} layer={layer}></LayerEditor>)}
            </div>
            <div className="layerItem layerBackground">
                <Icon icon='background_replace' /> Background:
                <select
                    value={background}
                    onChange={(e) => dispatch(changeBackground({ background: e.target.value }))}>
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
