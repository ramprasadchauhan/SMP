import { configureStore } from "@reduxjs/toolkit";
import lodarReducer from "./loadersSlice";

import userReducer from "./userSlice";

const store = configureStore({
  reducer: {
    loaders: lodarReducer,
    users: userReducer,
  },
});

export default store;
