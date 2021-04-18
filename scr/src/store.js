import {
    configureStore,
    getDefaultMiddleware,
    combineReducers,
} from "@reduxjs/toolkit";

import tools from "./toolsSlice";
import layers from "./layersSlice";

const clearRememberedState = () => {
    localStorage.clear();
//    delete window._imageData;
//    delete window._maskData;
}

const localStorageMiddleware = store => next => action => {
    const result = next(action);

    // make painting fast
    if (action.type.indexOf('repaint') !== -1) {
        return result;
    }

    try {
        localStorage.setItem('state', JSON.stringify(store.getState()));
//        localStorage.setItem('_imageData', JSON.stringify(window._imageData));
//        localStorage.setItem('_maskData', JSON.stringify(window._maskData));
    } catch (err) {
        clearRememberedState();
        console.log(err);
    }
    return result;
};

let preloadedState = undefined;
try {
    /*
        if (localStorage.getItem('_imageData')) {
            window._imageData = JSON.parse(localStorage.getItem('_imageData'));
        }
        if (localStorage.getItem('_maskData')) {
            window._maskData = JSON.parse(localStorage.getItem('_maskData'));
        }
     */
    preloadedState = JSON.parse(localStorage.getItem('state')) || undefined;
} catch (err) {
    console.log(err);
    clearRememberedState();
}

const store = configureStore({
    preloadedState,
    reducer: combineReducers({
        tools,
        layers
    }),
    middleware: getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
    }).concat(localStorageMiddleware),
});

export default store;
