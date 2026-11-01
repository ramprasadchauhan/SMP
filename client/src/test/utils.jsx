/* eslint-disable react-refresh/only-export-components -- test helpers, not hot-reloaded */
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Providers, { createQueryClient } from "../app/Providers";
import { createStore } from "../store/store";

export const adminUser = { _id: "a1", name: "Avery Admin", email: "admin@smp.test", role: "admin", status: "active", createdAt: "2026-01-01T00:00:00Z" };
export const normalUser = { _id: "u1", name: "Bailey Buyer", email: "buyer@smp.test", role: "user", status: "active", createdAt: "2026-01-01T00:00:00Z" };

export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

export function renderWithApp(ui, { auth = { status: "unauthenticated", user: null }, route = "/", path = "*" } = {}) {
  const store = createStore({ auth: { notice: null, error: null, ...auth }, ui: { theme: "light", sidebarCollapsed: false } });
  const result = render(
    <Providers store={store} queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>
    </Providers>
  );
  return { ...result, store };
}
