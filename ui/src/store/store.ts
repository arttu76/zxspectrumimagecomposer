import { configureStore } from "@reduxjs/toolkit";

import localStorageMiddleware from "./localStorageMiddleware";

import layers from "./layersSlice";
import repaint from "./repaintSlice";
import tools from "./toolsSlice";

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { restoreStateImageMaskData } from "../utils/utils";
import repaintScreenMiddleware from "./repaintScreenMiddleware";

const preloadedState = restoreStateImageMaskData();

const store = configureStore({
    preloadedState,
    reducer: {
        repaint,
        tools,
        layers
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
    })
        .concat(localStorageMiddleware)
        .concat(repaintScreenMiddleware)
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store;
