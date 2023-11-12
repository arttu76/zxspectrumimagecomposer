import { debounce, persistStateImageMaskPixelAttributeData } from "../utils/utils";
import store from "./store";


const updateLocalStorage = () => {
    persistStateImageMaskPixelAttributeData(store.getState());
}

const updateLocalStorageDebounced = debounce(() => updateLocalStorage(), 100);

const localStorageMiddleware = () => (next: any) => (action: any) => {
    updateLocalStorageDebounced();
    return next(action);
};

export default localStorageMiddleware;
