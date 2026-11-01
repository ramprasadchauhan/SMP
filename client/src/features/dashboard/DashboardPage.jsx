/* eslint-disable react/prop-types */
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Segmented, Skeleton, Timeline } from "antd";
import {
  BellOutlined,
  DollarOutlined,
  InboxOutlined,
  PlusOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { dashboardApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { DATE_RANGES, AUDIT_ACTION_LABELS } from "../../constants";
import { formatNumber, formatPrice, fromNow, percentChange, capitalize } from "../../utils/format";
import { EmptyState, PageHeader, ProductThumb, QueryError, StatCard, StatusTag, UserCell } from "../../components/ui";
import { CategoryBars, StatusDonut, TrendChart } from "./charts";

const URL_SCHEMA = { days: 30 };

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const [{ days }, setUrl] = useUrlState(URL_SCHEMA);
  const validDays = DATE_RANGES.some((r) => r.value === days) ? days : 30;
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard", validDays],
    queryFn: () => dashboardApi.summary(validDays),
    placeholderData: (prev) => prev,
  });
  const summary = data?.data;
  const rangeLabel = DATE_RANGES.find((r) => r.value === validDays)?.label;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={user.role === "admin" ? "Marketplace health at a glance." : "Your listings and offers at a glance."}
        actions={
          <Segmented
            aria-label="Date range"
            value={validDays}
            onChange={(v) => setUrl({ days: v })}
            options={DATE_RANGES.map((r) => ({ value: r.value, label: r.label }))}
          />
        }
      />
      {isError ? (
        <div className="card">
          <QueryError error={error} onRetry={refetch} />
        </div>
      ) : summary?.scope === "admin" ? (
        <AdminDashboard s={summary} loading={isLoading} rangeLabel={rangeLabel} days={validDays} fetching={isFetching} />
      ) : (
        <UserDashboard s={summary} loading={isLoading} rangeLabel={rangeLabel} days={validDays} />
      )}
    </>
  );
}

function AdminDashboard({ s, loading, rangeLabel, days }) {
  if (loading || !s) return <DashboardSkeleton />;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          icon={<TeamOutlined />}
          value={formatNumber(s.users.total)}
          delta={percentChange(s.users.newInRange, s.users.newInPreviousRange)}
          hint={`${s.users.newInRange} new in ${rangeLabel}`}
        />
        <StatCard
          label="Active / blocked"
          icon={<TeamOutlined />}
          value={`${formatNumber(s.users.active)} / ${formatNumber(s.users.blocked)}`}
          hint={<Link to="/admin/users?status=blocked">Review blocked users</Link>}
        />
        <StatCard
          label="Live listings"
          icon={<ShopOutlined />}
          value={formatNumber(s.products.byStatus.approved)}
          delta={percentChange(s.products.newInRange, s.products.newInPreviousRange)}
          hint={`${s.products.newInRange} submitted in ${rangeLabel}`}
        />
        <StatCard
          label="Bids placed"
          icon={<DollarOutlined />}
          value={formatNumber(s.bids.inRange)}
          delta={percentChange(s.bids.inRange, s.bids.inPreviousRange)}
          hint={`${formatPrice(s.bids.volumeInRange)} offered`}
        />
      </div>

      {s.products.byStatus.pending > 0 && (
        <div className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--warning) 14%, transparent)", color: "var(--warning)" }} aria-hidden="true">
              <ClockCircleOutlined />
            </span>
            <div>
              <div className="font-semibold text-fg">{s.products.byStatus.pending} listing(s) awaiting review</div>
              <div className="text-sm text-muted">New listings stay hidden from buyers until approved.</div>
            </div>
          </div>
          <Link to="/admin/products?status=pending">
            <Button type="primary">Review queue</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Activity" className="xl:col-span-2" extra={<span className="text-xs text-muted">Last {rangeLabel}, UTC days</span>}>
          <TrendChart
            data={s.trend}
            days={days}
            series={[
              { key: "users", label: "New users", color: "var(--chart-1)" },
              { key: "products", label: "New listings", color: "var(--chart-2)" },
              { key: "bids", label: "Bids", color: "var(--chart-3)" },
            ]}
          />
        </Card>
        <Card title="Listings by status">
          <StatusDonut byStatus={s.products.byStatus} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Listings by category">
          {s.products.byCategory.length ? <CategoryBars data={s.products.byCategory} /> : <EmptyState title="No listings yet" />}
        </Card>
        <Card title="Newest users" extra={<Link to="/admin/users">View all</Link>} styles={{ body: { padding: "8px 0" } }}>
          <ul className="m-0 list-none p-0">
            {s.recentUsers.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                <UserCell name={u.name} email={u.email} />
                <span className="shrink-0 text-xs text-muted">{fromNow(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Recent admin activity" extra={<Link to="/admin/audit-logs">Audit log</Link>}>
          {s.recentActivity.length ? (
            <Timeline
              items={s.recentActivity.map((a) => ({
                children: (
                  <div className="text-sm">
                    <div className="text-fg">
                      <span className="font-medium">{a.actorName}</span> · {AUDIT_ACTION_LABELS[a.action] || a.action}
                    </div>
                    <div className="text-muted">
                      {a.targetLabel}
                      {a.changes && Object.entries(a.changes).map(([k, v]) => ` (${k}: ${v.from} → ${v.to})`)}
                    </div>
                    <div className="text-xs text-subtle">{fromNow(a.createdAt)}</div>
                  </div>
                ),
              }))}
            />
          ) : (
            <EmptyState title="No admin activity yet" description="Status and role changes will appear here." />
          )}
        </Card>
      </div>

      <Card title="Recently updated listings" extra={<Link to="/admin/products">Moderate</Link>} styles={{ body: { padding: "8px 0" } }}>
        <ul className="m-0 list-none p-0">
          {s.recentProducts.map((p) => (
            <li key={p._id} className="flex items-center justify-between gap-3 px-6 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb src={p.images?.[0]} alt={p.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate font-medium text-fg">{p.name}</div>
                  <div className="truncate text-xs text-muted">
                    {capitalize(p.category)} · {p.seller?.name || "Unknown seller"} · {formatPrice(p.price)}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs text-muted sm:inline">{fromNow(p.updatedAt)}</span>
                <StatusTag status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function UserDashboard({ s, loading, rangeLabel, days }) {
  if (loading || !s) return <DashboardSkeleton />;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live listings" icon={<TagsOutlined />} value={formatNumber(s.products.byStatus.approved)} hint={`${s.products.total} total · ${s.products.byStatus.pending} pending review`} />
        <StatCard
          label="Bids received"
          icon={<InboxOutlined />}
          value={formatNumber(s.bidsReceived.inRange)}
          delta={percentChange(s.bidsReceived.inRange, s.bidsReceived.inPreviousRange)}
          hint={`in ${rangeLabel}`}
        />
        <StatCard
          label="Bids placed"
          icon={<DollarOutlined />}
          value={formatNumber(s.bidsPlaced.inRange)}
          delta={percentChange(s.bidsPlaced.inRange, s.bidsPlaced.inPreviousRange)}
          hint={`in ${rangeLabel}`}
        />
        <StatCard label="Unread notifications" icon={<BellOutlined />} value={formatNumber(s.unreadNotifications)} hint="Open the bell to review" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Bidding activity" className="xl:col-span-2" extra={<span className="text-xs text-muted">Last {rangeLabel}, UTC days</span>}>
          <TrendChart
            data={s.trend}
            days={days}
            series={[
              { key: "bidsReceived", label: "Bids received", color: "var(--chart-1)" },
              { key: "bidsPlaced", label: "Bids placed", color: "var(--chart-2)" },
            ]}
          />
        </Card>
        <Card title="My listings by status">
          {s.products.total ? (
            <StatusDonut byStatus={s.products.byStatus} />
          ) : (
            <EmptyState
              title="No listings yet"
              description="List your first item to start receiving offers."
              action={
                <Link to="/my-products?new=1">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add a listing
                  </Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>
      <Card title="Latest offers on your listings" extra={<Link to="/my-bids?tab=received">View all</Link>} styles={{ body: { padding: "8px 0" } }}>
        {s.recentBidsReceived.length ? (
          <ul className="m-0 list-none p-0">
            {s.recentBidsReceived.map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={b.product?.image} alt={b.product?.name || "Product"} size={40} />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-fg">{b.product?.name || "Deleted product"}</div>
                    <div className="truncate text-xs text-muted">from {b.buyer?.name || "Unknown"} · {fromNow(b.createdAt)}</div>
                  </div>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-fg">{formatPrice(b.bidAmount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No offers yet" description="When buyers bid on your listings, they'll show up here." />
        )}
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <Skeleton.Node active style={{ width: "100%", height: 260 }}>
          <span />
        </Skeleton.Node>
      </div>
    </div>
  );
}
