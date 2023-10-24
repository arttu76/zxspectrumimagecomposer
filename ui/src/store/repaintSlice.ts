import {
    Action,
    createSlice
} from "@reduxjs/toolkit";

const initialState = {
    repaint: 0
}

const repaintSlice = createSlice({
    name: 'repaint',
    initialState,
    reducers: {
        repaint: (state, _: Action) => {
            state.repaint = Date.now();
        }
    }
})

export const {
    repaint
} = repaintSlice.actions;

export default repaintSlice.reducer;
