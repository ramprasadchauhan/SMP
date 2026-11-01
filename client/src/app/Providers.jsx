/* eslint-disable react-refresh/only-export-components -- exports the query client factory used by tests */
/* eslint-disable react/prop-types */
import { useEffect, useMemo } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";
import { buildTheme } from "./theme";
import { setSessionEndedHandler } from "../services/apiClient";
import { signedOut } from "../store/authSlice";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry transient failures once; never retry client errors (4xx).
        retry: (count, err) => count < 1 && !(err?.status >= 400 && err?.status < 500),
      },
      mutations: { retry: false },
    },
  });
}

function ThemeBridge({ children }) {
  const mode = useSelector((s) => s.ui.theme);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  return (
    <ConfigProvider theme={theme}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

// When any request reports that the session ended (expired, revoked or the
// account was blocked), drop cached data and return to the sign-in screen.
function SessionWatcher({ queryClient }) {
  const dispatch = useDispatch();
  useEffect(() => {
    setSessionEndedHandler((err) => {
      queryClient.clear();
      dispatch(signedOut({ notice: { code: err.code, message: err.message } }));
    });
    return () => setSessionEndedHandler(() => {});
  }, [dispatch, queryClient]);
  return null;
}

export default function Providers({ store, queryClient, children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionWatcher queryClient={queryClient} />
        <ThemeBridge>{children}</ThemeBridge>
      </QueryClientProvider>
    </Provider>
  );
}
