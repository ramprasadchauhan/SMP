import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { RequireAuth, RequireRole } from "./guards";
import { adminUser, normalUser, renderWithApp } from "../test/utils";

const Protected = (
  <Routes>
    <Route element={<RequireAuth />}>
      <Route path="/secret" element={<div>Secret content</div>} />
      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin/users" element={<div>Admin content</div>} />
      </Route>
    </Route>
  </Routes>
);

describe("RequireAuth", () => {
  it("shows a loading state (not a blank page) while the session is being restored", () => {
    renderWithApp(Protected, { auth: { status: "loading", user: null }, route: "/secret" });
    expect(screen.getByRole("status")).toHaveTextContent(/checking your session/i);
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login screen")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to the login page", () => {
    renderWithApp(Protected, { auth: { status: "unauthenticated", user: null }, route: "/secret" });
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders protected content once authenticated (e.g. after a refresh)", () => {
    renderWithApp(Protected, { auth: { status: "authenticated", user: normalUser }, route: "/secret" });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("offers a retry instead of logging out when the server is unreachable", () => {
    renderWithApp(Protected, { auth: { status: "error", user: null, error: { message: "Unable to reach the server." } }, route: "/secret" });
    expect(screen.getByText(/couldn't reach the server/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});

describe("RequireRole", () => {
  it("shows an access-denied page to non-admins", () => {
    renderWithApp(Protected, { auth: { status: "authenticated", user: normalUser }, route: "/admin/users" });
    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("lets admins through", () => {
    renderWithApp(Protected, { auth: { status: "authenticated", user: adminUser }, route: "/admin/users" });
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
