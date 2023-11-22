import { useAppSelector } from '../store/store';
import '../styles/ToolbarErrors.scss';
import { Keys, PixelationType, ToolType } from '../types';
import { isGrowableGridEmpty } from '../utils/growableGridManager';
import { getWindow, safeZero } from '../utils/utils';

export const ToolbarErrors = () => {

    const win = getWindow();
    const shownLayers = useAppSelector(state => state.layers.layers.filter(l => l.shown));
    const activeLayer = useAppSelector(state => state.layers.layers.find(l => l.active && l.shown));
    const tool = useAppSelector(state => state.tools.tool);

    const noPixels = (
        tool === ToolType.attributes
        && activeLayer
        && (!activeLayer.originalHeight || !activeLayer.originalWidth)
        && isGrowableGridEmpty(win[Keys.manualPixels][activeLayer.id])
    );

    const nonDitheredExport = (
        tool === ToolType.export
        && !!shownLayers.find(l => (
            // visible layer has an image which is not dithered ...
            l.pixelate == PixelationType.none
            // ... and actually has an image
            && safeZero(l.originalHeight) > 0
            && safeZero(l.originalWidth) > 0
            && safeZero(l.height) > 0
            && safeZero(l.width) > 0
        ))
    );


    return <>
        {shownLayers.length === 0 && <div className="ToolbarErrors">You do not have shown layers: this tool does nothing at the moment.</div>}
        {noPixels && <div className="ToolbarErrors">Active layer does not have any pixels defined: changing attributes doesn't make any visual changes on this layer.</div>}
        {nonDitheredExport && <div className="ToolbarErrors">Some visible layers have not been dithered: exported image may differ from what is shown in the editor.</div>}

    </>

};
