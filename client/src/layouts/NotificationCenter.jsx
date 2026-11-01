import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Badge, Button, Popover, Spin, Tooltip } from "antd";
import { BellOutlined, CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { notificationsApi } from "../services/endpoints";
import { fromNow } from "../utils/format";

const KEY = ["notifications", "recent"];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();

  // Lightweight polling is enough for this app's notification volume;
  // it pauses automatically while the tab is in the background.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: KEY,
    queryFn: () => notificationsApi.list({ limit: 15 }),
    refetchInterval: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const onError = (err) => message.error(err.message);
  const readAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: invalidate, onError });
  const readOne = useMutation({ mutationFn: notificationsApi.read, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: notificationsApi.remove, onSuccess: invalidate, onError });

  const items = data?.data || [];
  const unread = data?.meta?.unreadCount || 0;

  const openItem = (n) => {
    if (!n.read) readOne.mutate(n._id);
    setOpen(false);
    // In-app paths only: reject protocol-relative or backslash forms that
    // could resolve to another origin.
    if (/^\/(?![/\\])/.test(n.onClick || "") && !n.onClick.includes("\\")) navigate(n.onClick);
  };

  const content = (
    <div className="w-[min(380px,calc(100vw-32px))]">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="font-semibold text-fg">Notifications</div>
          <div className="text-xs text-muted">{unread ? `${unread} unread` : "You're all caught up"}</div>
        </div>
        <Button size="small" type="text" icon={<CheckOutlined />} disabled={!unread} loading={readAll.isPending} onClick={() => readAll.mutate()}>
          Mark all read
        </Button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : isError ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            Couldn&apos;t load notifications.{" "}
            <Button type="link" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">No notifications yet.</div>
        ) : (
          <ul className="m-0 list-none p-0" aria-label="Notifications">
            {items.map((n) => (
              <li key={n._id} className="group relative border-b border-line last:border-0">
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className="flex w-full cursor-pointer gap-3 border-0 bg-transparent px-4 py-3 pr-12 text-left transition-colors hover:bg-surface-hover"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: n.read ? "transparent" : "var(--primary)" }}
                  />
                  <span className="min-w-0">
                    <span className={`block text-sm ${n.read ? "text-muted" : "font-semibold text-fg"}`}>
                      {n.title}
                      {!n.read && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">{n.message}</span>
                    <span className="mt-1 block text-xs text-subtle">{fromNow(n.createdAt)}</span>
                  </span>
                </button>
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Delete notification: ${n.title}`}
                    icon={<DeleteOutlined />}
                    className="absolute right-3 top-3 opacity-60 group-hover:opacity-100"
                    onClick={() => remove.mutate(n._id)}
                  />
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      styles={{ body: { padding: 0 } }}
    >
      <Tooltip title="Notifications">
        <Button
          type="text"
          shape="circle"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          icon={
            <Badge count={unread} size="small" offset={[2, -2]}>
              <BellOutlined className="text-[17px] text-muted" />
            </Badge>
          }
        />
      </Tooltip>
    </Popover>
  );
}
