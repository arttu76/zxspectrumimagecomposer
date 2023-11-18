import { saveStateImageMaskPixelAttributeDataToLocalStorage } from "../utils/exportImport";
import { debounce } from "../utils/utils";
import store from "./store";


const updateLocalStorage = () => {
    saveStateImageMaskPixelAttributeDataToLocalStorage(store.getState());
}

const updateLocalStorageDebounced = debounce(() => updateLocalStorage(), 100);

const localStorageMiddleware = () => (next: any) => (action: any) => {
    updateLocalStorageDebounced();
    return next(action);
};

export default localStorageMiddleware;
