/* eslint-disable react/prop-types */
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GuestOnly, RequireAuth, RequireRole } from "../routes/guards";
import { restoreSession } from "../store/authSlice";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import ErrorBoundary from "../components/ErrorBoundary";
import FullPageLoader from "../components/FullPageLoader";
import PageSkeleton from "../components/PageSkeleton";
import NotFoundPage from "../pages/NotFoundPage";

// Route-level code splitting keeps the initial bundle small.
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/RegisterPage"));
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage"));
const MarketplacePage = lazy(() => import("../features/marketplace/MarketplacePage"));
const ProductDetailPage = lazy(() => import("../features/marketplace/ProductDetailPage"));
const MyProductsPage = lazy(() => import("../features/selling/MyProductsPage"));
const MyBidsPage = lazy(() => import("../features/selling/MyBidsPage"));
const AccountPage = lazy(() => import("../features/account/AccountPage"));
const UsersPage = lazy(() => import("../features/admin/UsersPage"));
const ProductModerationPage = lazy(() => import("../features/admin/ProductModerationPage"));
const AuditLogPage = lazy(() => import("../features/admin/AuditLogPage"));

function LegacyProductRedirect() {
  const { id } = useParams();
  return <Navigate to={`/marketplace/${id}`} replace />;
}

function RootErrorBoundary({ children }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function AppRoutes() {
  return (
    <RootErrorBoundary>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Suspense fallback={<FullPageLoader />}><LoginPage /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<FullPageLoader />}><RegisterPage /></Suspense>} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Lazy page={DashboardPage} />} />
            <Route path="/marketplace" element={<Lazy page={MarketplacePage} />} />
            <Route path="/marketplace/:id" element={<Lazy page={ProductDetailPage} />} />
            <Route path="/my-products" element={<Lazy page={MyProductsPage} />} />
            <Route path="/my-bids" element={<Lazy page={MyBidsPage} />} />
            <Route path="/account" element={<Lazy page={AccountPage} />} />

            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
              <Route path="/admin/users" element={<Lazy page={UsersPage} />} />
              <Route path="/admin/products" element={<Lazy page={ProductModerationPage} />} />
              <Route path="/admin/audit-logs" element={<Lazy page={AuditLogPage} />} />
            </Route>

            {/* Paths used by the previous UI and stored in existing notifications. */}
            <Route path="/profile" element={<Navigate to="/my-products" replace />} />
            <Route path="/product/:id" element={<LegacyProductRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </RootErrorBoundary>
  );
}

function Lazy({ page: Page }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Page />
    </Suspense>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const status = useSelector((s) => s.auth.status);

  // Restore the session exactly once on startup (and on refresh).
  useEffect(() => {
    if (status === "idle") dispatch(restoreSession());
  }, [dispatch, status]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}
