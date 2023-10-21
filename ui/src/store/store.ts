import { configureStore } from "@reduxjs/toolkit";

import localStorageMiddleware from "./localStorageMiddleware";

import layers, { loadLayerSrc } from "./layersSlice";
import tools from "./toolsSlice";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { Layer, State, Undefinable } from "../types";

const preloadedState = JSON.parse('' + localStorage.getItem("state")) as Undefinable<State> || undefined;

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
