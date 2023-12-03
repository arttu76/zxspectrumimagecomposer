import { AnyAction, Dispatch, MiddlewareAPI } from '@reduxjs/toolkit';
import { HighlightType } from '../types';
import { setHighlight } from './toolsSlice';

const highlightAutoDisablerMiddleware = (storeApi: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
    if (
        action.type === setHighlight.type
        && action.payload !== HighlightType.none
    ) {
        setTimeout(
            () => storeApi.dispatch(setHighlight(HighlightType.none)),
            1000
        );
    }
    return next(action);
};

export default highlightAutoDisablerMiddleware;
