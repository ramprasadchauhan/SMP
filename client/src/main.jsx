import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import store from "./redux/store.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <React.StrictMode>
      <ConfigProvider
        theme={{
          components: {
            Button: {
              colorPrimary: "#40513B",
              colorPrimaryHover: "#40513B",
              borderRadius: 0,
              boxShadow: "none",
            },
          },
          token: {
            borderRadius: "2px",
            colorPrimary: "#40513B",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </React.StrictMode>
  </Provider>
);
