/* eslint-disable react/prop-types */
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Drawer, Dropdown, Grid, Skeleton, Timeline } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { usersApi } from "../../services/endpoints";
import { AUDIT_ACTION_LABELS } from "../../constants";
import { formatDateTime, fromNow } from "../../utils/format";
import { EmptyState, QueryError, RoleTag, StatusTag, UserAvatar } from "../../components/ui";
import { userMenuItems } from "./userActions";

export default function UserDetailDrawer({ userId, onClose, actions }) {
  const me = useSelector((s) => s.auth.user);
  const screens = Grid.useBreakpoint();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.get(userId),
    enabled: Boolean(userId),
  });
  const detail = data?.data;
  const u = detail?.user;

  return (
    <Drawer
      open={Boolean(userId)}
      onClose={onClose}
      width={screens.sm === false ? "100%" : 480}
      title="User details"
      destroyOnHidden
      extra={
        u && (
          <Dropdown menu={{ items: userMenuItems(u, me._id, actions) }} trigger={["click"]} placement="bottomRight">
            <Button icon={<MoreOutlined />}>Actions</Button>
          </Dropdown>
        )
      }
    >
      {isLoading ? (
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      ) : isError ? (
        <QueryError error={error} onRetry={refetch} compact />
      ) : u ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar name={u.name} size={56} />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-fg">{u.name}</div>
              <div className="truncate text-sm text-muted">{u.email}</div>
              <div className="mt-2 flex gap-2">
                <RoleTag role={u.role} />
                <StatusTag status={u.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Listings", Object.values(detail.stats.products).reduce((a, b) => a + b, 0)],
              ["Bids placed", detail.stats.bidsPlaced],
              ["Bids received", detail.stats.bidsReceived],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-surface-2 p-3">
                <div className="text-xs text-muted">{label}</div>
                <div className="text-xl font-semibold text-fg">{value}</div>
              </div>
            ))}
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Joined">{formatDateTime(u.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Last sign-in">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Not recorded"}</Descriptions.Item>
            <Descriptions.Item label="Status changed">{u.statusChangedAt ? formatDateTime(u.statusChangedAt) : "Never"}</Descriptions.Item>
            <Descriptions.Item label="Listings by status">
              {Object.keys(detail.stats.products).length
                ? Object.entries(detail.stats.products).map(([k, v]) => `${v} ${k}`).join(" · ")
                : "None"}
            </Descriptions.Item>
          </Descriptions>
          <Link to={`/admin/products?seller=${u._id}`}>View this user&apos;s listings</Link>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg">Account history</h3>
            {detail.activity.length ? (
              <Timeline
                items={detail.activity.map((a) => ({
                  children: (
                    <div className="text-sm">
                      <div className="text-fg">{AUDIT_ACTION_LABELS[a.action] || a.action}</div>
                      <div className="text-muted">
                        {a.changes && Object.entries(a.changes).map(([k, v]) => `${k}: ${v.from} → ${v.to}`).join(", ")} by {a.actorName}
                      </div>
                      <div className="text-xs text-subtle">{fromNow(a.createdAt)}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <EmptyState title="No changes recorded" description="Status and role changes will be listed here." />
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
