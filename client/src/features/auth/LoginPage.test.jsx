import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import { renderWithApp, normalUser } from "../../test/utils";
import { authApi } from "../../services/endpoints";
import { ApiError } from "../../services/apiClient";

describe("LoginPage", () => {
  it("validates required fields before calling the API", async () => {
    const spy = vi.spyOn(authApi, "login");
    renderWithApp(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Enter your email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not prefill credentials", () => {
    renderWithApp(<LoginPage />);
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("shows the API error message on failed sign-in", async () => {
    vi.spyOn(authApi, "login").mockRejectedValueOnce(new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password" }));
    renderWithApp(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), "someone@smp.test");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("stores the signed-in user on success", async () => {
    vi.spyOn(authApi, "login").mockResolvedValueOnce({ success: true, data: { user: normalUser } });
    const { store } = renderWithApp(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Email"), normalUser.email);
    await userEvent.type(screen.getByLabelText("Password"), "whatever1");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(store.getState().auth.status).toBe("authenticated"));
    expect(store.getState().auth.user.email).toBe(normalUser.email);
  });

  it("explains why the user was signed out", () => {
    renderWithApp(<LoginPage />, { auth: { status: "unauthenticated", user: null, notice: { code: "SESSION_EXPIRED" } } });
    expect(screen.getByText(/your session expired/i)).toBeInTheDocument();
  });
});
