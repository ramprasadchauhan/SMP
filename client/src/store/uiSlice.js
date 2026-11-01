import { createSlice } from "@reduxjs/toolkit";
import { readPref } from "../utils/storage";

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const initialState = {
  theme: readPref("smp.theme", prefersDark() ? "dark" : "light"),
  sidebarCollapsed: readPref("smp.sidebarCollapsed", false),
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { toggleTheme, setSidebarCollapsed } = uiSlice.actions;
export default uiSlice.reducer;
