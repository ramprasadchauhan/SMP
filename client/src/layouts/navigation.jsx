/* eslint-disable react-refresh/only-export-components -- navigation config, not a component module */
import {
  AppstoreOutlined,
  AuditOutlined,
  DashboardOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

// Single source for the sidebar, breadcrumbs and page titles.
export const NAV_GROUPS = [
  {
    key: "overview",
    label: "Overview",
    items: [{ path: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> }],
  },
  {
    key: "market",
    label: "Marketplace",
    items: [
      { path: "/marketplace", label: "Browse products", icon: <ShopOutlined /> },
      { path: "/my-products", label: "My listings", icon: <TagsOutlined /> },
      { path: "/my-bids", label: "Bids", icon: <DollarOutlined /> },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    role: "admin",
    items: [
      { path: "/admin/users", label: "Users", icon: <TeamOutlined /> },
      { path: "/admin/products", label: "Product moderation", icon: <SafetyCertificateOutlined /> },
      { path: "/admin/audit-logs", label: "Audit log", icon: <AuditOutlined /> },
    ],
  },
];

const EXTRA = [{ path: "/account", label: "Account settings", icon: <UserOutlined /> }];

export function findNavItem(pathname) {
  const all = [...NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), ...EXTRA];
  return all
    .filter((i) => pathname === i.path || pathname.startsWith(i.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export const FALLBACK_ICON = <AppstoreOutlined />;
