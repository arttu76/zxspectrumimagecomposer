import {
    Action,
    PayloadAction,
    createSlice
} from "@reduxjs/toolkit";
import { HousekeepingSliceState, Nullable } from "../types";

const initialState: HousekeepingSliceState = {
    repaint: 0,
    error: null
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
