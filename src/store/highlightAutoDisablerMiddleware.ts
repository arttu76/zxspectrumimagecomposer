import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { HighlightType } from '../types';
import { RootState } from './store';
import { setHighlight } from './toolsSlice';

export const highlightAutoDisablerMiddleware: Middleware<
    {},
    RootState
> = storeApi => next => action => {

    const highlightAction = action as PayloadAction<HighlightType>;
    if (
        highlightAction.type === setHighlight.type
        && highlightAction.payload !== HighlightType.none
    ) {
        setTimeout(
            () => storeApi.dispatch(setHighlight(HighlightType.none)),
            1000
        );
    }
    return next(action);
};
