import { configureStore } from "@reduxjs/toolkit";

import localStorageMiddleware from "./localStorageMiddleware";

import housekeeping from "./housekeepingSlice";
import layers from "./layersSlice";
import tools from "./toolsSlice";

import { repaint as repaintAction } from './housekeepingSlice';

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { restoreStateImageMaskPixelAttributeDataFromLocalStorage } from "../utils/exportImport";
import windowPropertyMiddleware from "./windowPropertyMiddleware";

const preloadedState = restoreStateImageMaskPixelAttributeDataFromLocalStorage();

const store = configureStore({
    preloadedState,
    reducer: {
        housekeeping,
        tools,
        layers
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
    })
        .concat(localStorageMiddleware)
        .concat(windowPropertyMiddleware)
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

setTimeout(() => store.dispatch(repaintAction()), 10);

export default store;
