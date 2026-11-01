/* eslint-disable react/prop-types */
import { Avatar, Button, Empty, Result, Tag, Tooltip } from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  PictureOutlined,
  StopFilled,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { capitalize, initials } from "../utils/format";

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Status is conveyed by icon + text, never by colour alone.
const STATUS_STYLE = {
  active: { color: "success", icon: <CheckCircleFilled /> },
  approved: { color: "success", icon: <CheckCircleFilled /> },
  pending: { color: "warning", icon: <ClockCircleFilled /> },
  rejected: { color: "default", icon: <CloseCircleFilled /> },
  blocked: { color: "error", icon: <StopFilled /> },
};

export function StatusTag({ status }) {
  const s = STATUS_STYLE[status] || { color: "default", icon: <MinusCircleFilled /> };
  return (
    <Tag color={s.color} icon={s.icon} bordered={false} className="m-0 font-medium">
      {capitalize(status) || "Unknown"}
    </Tag>
  );
}

export function RoleTag({ role }) {
  return (
    <Tag bordered={false} color={role === "admin" ? "geekblue" : "default"} className="m-0 font-medium">
      {role === "admin" ? "Admin" : "User"}
    </Tag>
  );
}

const AVATAR_COLORS = ["#0f766e", "#4f46e5", "#b45309", "#be185d", "#0369a1", "#15803d", "#7c3aed"];
const colorFor = (seed = "") => AVATAR_COLORS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export function UserAvatar({ name, size = 32 }) {
  return (
    <Avatar size={size} style={{ background: colorFor(name), fontSize: size * 0.4, fontWeight: 600, flexShrink: 0 }}>
      {initials(name)}
    </Avatar>
  );
}

export function UserCell({ name, email }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={name} />
      <div className="min-w-0">
        <div className="truncate font-medium text-fg">{name}</div>
        {email && <div className="truncate text-xs text-muted">{email}</div>}
      </div>
    </div>
  );
}

export function ProductThumb({ src, alt, size = 44 }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="shrink-0 rounded-lg border border-line object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-subtle"
      style={{ width: size, height: size }}
      role="img"
      aria-label="No image"
    >
      <PictureOutlined />
    </span>
  );
}

export function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
      <h3 className="mt-1 text-[15px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function QueryError({ error, onRetry, compact = false }) {
  return (
    <Result
      status="warning"
      className={compact ? "py-6" : undefined}
      title="Couldn't load this data"
      subTitle={error?.message || "Please try again."}
      extra={onRetry && <Button onClick={onRetry}>Try again</Button>}
    />
  );
}

export function StatCard({ label, value, hint, delta, icon, loading }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-surface-hover" />
      ) : (
        <div className="text-[26px] font-semibold leading-none tracking-tight text-fg">{value}</div>
      )}
      <div className="flex min-h-[20px] items-center gap-2 text-xs text-muted">
        {typeof delta === "number" && <Delta value={delta} />}
        {hint}
      </div>
    </div>
  );
}

function Delta({ value }) {
  const up = value >= 0;
  return (
    <Tooltip title="Change compared with the previous period">
      <span
        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold"
        style={{
          color: up ? "var(--success)" : "var(--danger)",
          background: up ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 12%, transparent)",
        }}
      >
        {up ? <ArrowUpOutlined aria-hidden /> : <ArrowDownOutlined aria-hidden />}
        <span className="sr-only">{up ? "up" : "down"}</span>
        {Math.abs(value)}%
      </span>
    </Tooltip>
  );
}

export function Toolbar({ children, extra }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {extra && <div className="flex flex-wrap items-center gap-2">{extra}</div>}
    </div>
  );
}
