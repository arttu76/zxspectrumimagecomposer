import { getWindow, debounce } from "../utils";

import store from "./store";

const updateLocalStorage = () => {
    const win = getWindow();
    localStorage.setItem("state", JSON.stringify(store.getState()));
    localStorage.setItem('_maskData', JSON.stringify(win._maskData));
}

const updateLocalStorageDebounced = debounce(() => updateLocalStorage(), 500);

const localStorageMiddleware = () => (next: any) => (action: any) => {
    updateLocalStorageDebounced();
    return next(action);
};

export default localStorageMiddleware;
