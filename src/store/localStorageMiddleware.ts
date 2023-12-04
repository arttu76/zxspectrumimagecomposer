import { Action, Middleware } from '@reduxjs/toolkit';
import { saveStateImageMaskPixelAttributeDataToLocalStorage } from "../utils/exportImport";
import { debounce } from "../utils/utils";
import { setError } from "./housekeepingSlice";
import store, { RootState } from "./store";


const updateLocalStorage = () => {
    const state = store.getState();
    const error = saveStateImageMaskPixelAttributeDataToLocalStorage(state);
    if (
        error !== null
        || (
            error === null
            && state.housekeeping.error !== null
        )
    ) {
        store.dispatch(setError(error));
    }
}

const updateLocalStorageDebounced = debounce(() => updateLocalStorage(), 100);

export const localStorageMiddleware: Middleware<
    {},
    RootState
> = _ => next => action => {

    if (!(action as Action).type.startsWith('housekeeping/')) {
        updateLocalStorageDebounced();
    }

    return next(action);
};
