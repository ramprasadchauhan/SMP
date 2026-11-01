/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { App, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, Tooltip } from "antd";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
} from "@ant-design/icons";
import Logo from "../components/Logo";
import { RoleTag, UserAvatar } from "../components/ui";
import ErrorBoundary from "../components/ErrorBoundary";
import NotificationCenter from "./NotificationCenter";
import { NAV_GROUPS, findNavItem } from "./navigation";
import { setSidebarCollapsed, toggleTheme } from "../store/uiSlice";
import { signedOut } from "../store/authSlice";
import { authApi } from "../services/endpoints";

const { Sider, Header, Content } = Layout;

function SideNav({ role, pathname, onNavigate, collapsed }) {
  const items = NAV_GROUPS.filter((g) => !g.role || g.role === role).map((g) => ({
    type: "group",
    key: g.key,
    label: collapsed ? null : g.label,
    children: g.items.map((i) => ({ key: i.path, icon: i.icon, label: <Link to={i.path} onClick={onNavigate}>{i.label}</Link> })),
  }));
  const selected = findNavItem(pathname)?.path;
  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={selected ? [selected] : []}
      style={{ borderInlineEnd: 0 }}
      aria-label="Main navigation"
    />
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Breakpoints are unknown on the very first render; assume desktop.
  const isDesktop = screens.lg ?? true;
  const user = useSelector((s) => s.auth.user);
  const { theme, sidebarCollapsed } = useSelector((s) => s.ui);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const current = findNavItem(pathname);
  useEffect(() => {
    document.title = current ? `${current.label} · SMP` : "SMP Marketplace";
  }, [current]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ title: <Link to="/dashboard">Home</Link> }];
    if (current && current.path !== "/dashboard") {
      if (current.group) crumbs.push({ title: current.group });
      crumbs.push({ title: pathname === current.path ? current.label : <Link to={current.path}>{current.label}</Link> });
      if (pathname !== current.path) crumbs.push({ title: "Details" });
    } else if (!current) {
      crumbs.push({ title: "Not found" });
    }
    return crumbs;
  }, [current, pathname]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // The cookie is cleared server-side when reachable; local state is cleared regardless.
    }
    qc.clear();
    dispatch(signedOut());
    message.success("You have been signed out");
    navigate("/login", { replace: true });
  };

  const userMenu = {
    items: [
      {
        key: "header",
        disabled: true,
        label: (
          <div className="py-1">
            <div className="font-semibold text-fg">{user.name}</div>
            <div className="text-xs text-muted">{user.email}</div>
          </div>
        ),
      },
      { type: "divider" },
      { key: "account", icon: <SettingOutlined />, label: "Account settings", onClick: () => navigate("/account") },
      { key: "logout", icon: <LogoutOutlined />, label: "Sign out", danger: true, onClick: logout },
    ],
  };

  const brand = (
    <Link to="/dashboard" className="flex h-[60px] items-center px-5 no-underline" aria-label="SMP home">
      <Logo collapsed={isDesktop && sidebarCollapsed} />
    </Link>
  );

  return (
    <Layout className="min-h-screen">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {isDesktop && (
        <Sider
          width={248}
          collapsedWidth={72}
          collapsed={sidebarCollapsed}
          trigger={null}
          className="border-r border-line"
          style={{ position: "sticky", top: 0, height: "100vh", overflow: "auto" }}
        >
          {brand}
          <SideNav role={user.role} pathname={pathname} collapsed={sidebarCollapsed} />
        </Sider>
      )}
      {!isDesktop && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          placement="left"
          width={272}
          closable={false}
          styles={{ body: { padding: 0 } }}
          title={null}
        >
          {brand}
          <SideNav role={user.role} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Layout>
        <Header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line">
          <Tooltip title={isDesktop ? (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}>
            <Button
              type="text"
              aria-label={isDesktop ? (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}
              icon={!isDesktop ? <MenuOutlined /> : sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => (isDesktop ? dispatch(setSidebarCollapsed(!sidebarCollapsed)) : setMobileOpen(true))}
            />
          </Tooltip>
          <Breadcrumb items={breadcrumbs} className="hidden min-w-0 sm:block" />
          <div className="ml-auto flex items-center gap-1">
            <Tooltip title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <Button
                type="text"
                shape="circle"
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                icon={theme === "dark" ? <SunOutlined className="text-muted" /> : <MoonOutlined className="text-muted" />}
                onClick={() => dispatch(toggleTheme())}
              />
            </Tooltip>
            <NotificationCenter />
            <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
              <Button type="text" className="ml-1 flex h-10 items-center gap-2.5 px-1.5" aria-label="Account menu">
                <UserAvatar name={user.name} size={30} />
                <span className="hidden flex-col items-start leading-tight md:flex">
                  <span className="max-w-[160px] truncate text-[13px] font-semibold text-fg">{user.name}</span>
                  <RoleTag role={user.role} />
                </span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content id="main" tabIndex={-1} className="w-full px-4 py-6 outline-none sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <ErrorBoundary resetKey={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
