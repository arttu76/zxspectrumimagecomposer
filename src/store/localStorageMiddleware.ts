import { saveStateImageMaskPixelAttributeDataToLocalStorage } from "../utils/exportImport";
import { debounce } from "../utils/utils";
import { setError } from "./housekeepingSlice";
import store from "./store";


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

const localStorageMiddleware = () => (next: any) => (action: any) => {

    if (!action.type.startsWith('housekeeping/')) {
        updateLocalStorageDebounced();
    }
    return next(action);
};

export default localStorageMiddleware;
