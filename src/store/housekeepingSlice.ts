import {
    Action,
    PayloadAction,
    createSlice
} from "@reduxjs/toolkit";
import { Nullable } from "../types";

const initialState = {
    repaint: 0,
    error: null as string | null
}

const housekeepingSlice = createSlice({
    name: 'housekeeping',
    initialState,
    reducers: {
        repaint: (state, _: Action) => {
            state.repaint = Date.now();
        },
        setError: (state, action: PayloadAction<Nullable<string>>) => {
            state.error = action.payload;
        }
    }
})

export const {
    repaint,
    setError
} = housekeepingSlice.actions;

export default housekeepingSlice.reducer;
