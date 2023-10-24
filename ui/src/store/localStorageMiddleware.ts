import { debounce, persistStateImageMaskData } from "../utils/utils";

import store from "./store";

const updateLocalStorage = () => {
    persistStateImageMaskData(store.getState());
}

const updateLocalStorageDebounced = debounce(() => updateLocalStorage(), 500);

const localStorageMiddleware = () => (next: any) => (action: any) => {
    updateLocalStorageDebounced();
    return next(action);
};

export default localStorageMiddleware;
