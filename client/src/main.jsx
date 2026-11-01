import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app/App.jsx";
import Providers, { createQueryClient } from "./app/Providers.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import store from "./store/store.js";

// Apply the saved theme before first paint to avoid a light/dark flash.
document.documentElement.dataset.theme = store.getState().ui.theme;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers store={store} queryClient={createQueryClient()}>
        <App />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>
);
