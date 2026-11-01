import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";
import { writePref } from "../utils/storage";

export function createStore(preloadedState) {
  const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState,
  });

  let prev = store.getState().ui;
  store.subscribe(() => {
    const { ui } = store.getState();
    if (ui === prev) return;
    if (ui.theme !== prev.theme) writePref("smp.theme", ui.theme);
    if (ui.sidebarCollapsed !== prev.sidebarCollapsed) writePref("smp.sidebarCollapsed", ui.sidebarCollapsed);
    prev = ui;
  });
  return store;
}

const store = createStore();
export default store;
