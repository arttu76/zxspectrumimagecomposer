import { configureStore } from "@reduxjs/toolkit";

import localStorageMiddleware from "./localStorageMiddleware";

import tools from "./toolsSlice";
import layers, { loadLayerSrc } from "./layersSlice";

import { Layer, State } from "../types";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

const preloadedState = JSON.parse('' + localStorage.getItem("state")) as State || undefined;

const store = configureStore({
    preloadedState,
    reducer: {
        tools,
        layers,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
    })
        .concat(localStorageMiddleware)
});

(preloadedState?.layers?.layers || []).forEach((layer: Layer) => {
    layer.loaded && store.dispatch(loadLayerSrc(layer));
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store;
