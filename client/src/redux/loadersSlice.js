import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
};

const loadersSlice = createSlice({
  name: "loaders",
  initialState,
  reducers: {
    setLoader: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setLoader } = loadersSlice.actions;
export default loadersSlice.reducer;
