/* eslint-disable react/prop-types */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Result } from "antd";
import FullPageLoader from "../components/FullPageLoader";
import { restoreSession, selectAuth } from "../store/authSlice";
import ForbiddenPage from "../pages/ForbiddenPage";

// Shown when the session check itself failed (server down, timeout). The
// user is not logged out: they can retry once the server is reachable.
function SessionError({ error }) {
  const dispatch = useDispatch();
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Result
        status="warning"
        title="We couldn't reach the server"
        subTitle={error?.message || "Please check your connection and try again."}
        extra={
          <Button type="primary" onClick={() => dispatch(restoreSession())}>
            Retry
          </Button>
        }
      />
    </div>
  );
}

// Protected routes wait for the session check to resolve before deciding
// anything, so a refresh or deep link never flashes a blank page or bounces
// an authenticated user to /login.
export function RequireAuth() {
  const { status, error } = useSelector(selectAuth);
  const location = useLocation();

  if (status === "idle" || status === "loading") return <FullPageLoader label="Checking your session…" />;
  if (status === "error") return <SessionError error={error} />;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

export function RequireRole({ role }) {
  const user = useSelector((s) => s.auth.user);
  return user?.role === role ? <Outlet /> : <ForbiddenPage />;
}

// Login/register: signed-in users go straight to where they were heading.
export function GuestOnly() {
  const { status, error } = useSelector(selectAuth);
  const location = useLocation();
  if (status === "idle" || status === "loading") return <FullPageLoader />;
  if (status === "error") return <SessionError error={error} />;
  if (status === "authenticated") return <Navigate to={location.state?.from || "/dashboard"} replace />;
  return <Outlet />;
}
