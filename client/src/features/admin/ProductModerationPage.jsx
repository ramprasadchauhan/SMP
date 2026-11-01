/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Dropdown, Grid, Input, Segmented, Select, Table, Tag, Tooltip } from "antd";
import { CheckOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, MoreOutlined, ReloadOutlined, SearchOutlined, StopOutlined } from "@ant-design/icons";
import { productsApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { CATEGORIES, PRODUCT_ACTIONS, PRODUCT_STATUSES, categoryLabel } from "../../constants";
import { capitalize, formatDate, formatPrice } from "../../utils/format";
import { EmptyState, PageHeader, ProductThumb, QueryError, StatusTag, Toolbar } from "../../components/ui";
import ListPagination from "../../components/ListPagination";

const URL_SCHEMA = { q: "", status: "", category: "", seller: "", sort: "createdAt", order: "desc", page: 1, limit: 10 };

function useModeration() {
  const qc = useQueryClient();
  const { modal, message } = App.useApp();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const onError = (err) => message.error(err.message);
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => productsApi.setStatus(id, status),
    onSuccess: (res) => {
      message.success(`“${res.data.name}” is now ${res.data.status}. The seller has been notified.`);
      refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      message.success("Listing deleted");
      refresh();
    },
    onError,
  });

  const changeStatus = (p, action) => {
    const run = () => setStatus.mutateAsync({ id: p._id, status: action.to }).catch(() => {});
    if (!action.danger) return run();
    modal.confirm({
      title: `${action.label} “${p.name}”?`,
      content:
        action.to === "blocked"
          ? "The listing will be hidden from the marketplace immediately. You can unblock it later."
          : "The listing will not be published. The seller will be notified.",
      okText: action.label,
      okButtonProps: { danger: true },
      onOk: run,
    });
  };
  const confirmDelete = (p) =>
    modal.confirm({
      title: `Delete “${p.name}”?`,
      content: "This permanently removes the listing and all bids on it. This cannot be undone.",
      okText: "Delete listing",
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync(p._id).catch(() => {}),
    });
  return { changeStatus, confirmDelete, busyId: setStatus.isPending ? setStatus.variables?.id : null };
}

export default function ProductModerationPage() {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const { message } = App.useApp();
  const [url, setUrl] = useUrlState(URL_SCHEMA);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebouncedValue(search);
  const [exporting, setExporting] = useState(false);
  const { changeStatus, confirmDelete, busyId } = useModeration();

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filters = { q: url.q, status: url.status, category: url.category, seller: url.seller, sort: url.sort, order: url.order };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["products", "manage", { ...filters, page: url.page, limit: url.limit }],
    queryFn: () => productsApi.manage({ ...filters, page: url.page, limit: url.limit }),
    placeholderData: keepPreviousData,
  });
  const counts = data?.meta?.statusCounts || {};
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const menu = (p) => ({
    items: [
      { key: "view", icon: <EyeOutlined />, label: "View listing", onClick: () => navigate(`/marketplace/${p._id}`) },
      { type: "divider" },
      ...(PRODUCT_ACTIONS[p.status] || []).map((a) => ({
        key: a.to,
        icon: a.danger ? <StopOutlined /> : <CheckOutlined />,
        label: a.label,
        danger: a.danger,
        onClick: () => changeStatus(p, a),
      })),
      { type: "divider" },
      { key: "delete", icon: <DeleteOutlined />, label: "Delete listing", danger: true, onClick: () => confirmDelete(p) },
    ],
  });

  const primaryAction = (p) => {
    const action = PRODUCT_ACTIONS[p.status]?.[0];
    if (!action || action.danger) return null;
    return (
      <Button size="small" onClick={() => changeStatus(p, action)} loading={busyId === p._id}>
        {action.label}
      </Button>
    );
  };

  const sortOrder = (key) => (url.sort === key ? (url.order === "asc" ? "ascend" : "descend") : null);
  const columns = [
    {
      title: "Listing",
      key: "name",
      sorter: true,
      sortOrder: sortOrder("name"),
      render: (_, p) => (
        <Link to={`/marketplace/${p._id}`} className="flex min-w-0 items-center gap-3 text-inherit no-underline">
          <ProductThumb src={p.images?.[0]} alt={p.name} />
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{p.name}</div>
            <div className="truncate text-xs text-muted">{categoryLabel(p.category)} · {p.age} yr old</div>
          </div>
        </Link>
      ),
    },
    {
      title: "Seller",
      key: "seller",
      responsive: ["lg"],
      render: (_, p) => (
        <div className="min-w-0">
          <div className="truncate text-fg">{p.seller?.name || "Deleted user"}</div>
          <div className="truncate text-xs text-muted">{p.seller?.email}</div>
        </div>
      ),
    },
    { title: "Price", key: "price", dataIndex: "price", width: 110, sorter: true, sortOrder: sortOrder("price"), render: (v) => <span className="tabular-nums">{formatPrice(v)}</span> },
    { title: "Status", key: "status", dataIndex: "status", width: 120, render: (s) => <StatusTag status={s} /> },
    { title: "Submitted", key: "createdAt", dataIndex: "createdAt", width: 130, sorter: true, sortOrder: sortOrder("createdAt"), render: (d) => <span className="text-muted">{formatDate(d)}</span> },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      width: 150,
      align: "right",
      render: (_, p) => (
        <div className="flex items-center justify-end gap-1">
          {primaryAction(p)}
          <Dropdown menu={menu(p)} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.name}`} />
          </Dropdown>
        </div>
      ),
    },
  ];

  const exportCsv = async () => {
    setExporting(true);
    try {
      await productsApi.exportCsv(filters);
    } catch (err) {
      message.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const products = data?.data || [];
  const hasFilters = url.q || url.category || url.seller;

  return (
    <>
      <PageHeader
        title="Product moderation"
        description="Review new listings and keep the marketplace safe. Sellers are notified of every decision."
        actions={
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto border-b border-line px-4 pt-4">
          <Segmented
            className="mb-4"
            value={url.status}
            onChange={(status) => setUrl({ status })}
            options={[
              { value: "", label: `All (${totalAll})` },
              ...PRODUCT_STATUSES.map((s) => ({ value: s, label: `${capitalize(s)} (${counts[s] || 0})` })),
            ]}
          />
        </div>
        <Toolbar
          extra={
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined spin={isFetching && !isLoading} />} onClick={() => refetch()} aria-label="Refresh list" />
            </Tooltip>
          }
        >
          <Input
            allowClear
            prefix={<SearchOutlined className="text-subtle" />}
            placeholder="Search listings"
            aria-label="Search listings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Filter by category"
            value={url.category}
            onChange={(category) => setUrl({ category })}
            className="w-full sm:w-44"
            options={[{ value: "", label: "All categories" }, ...CATEGORIES]}
          />
          {url.seller && (
            <Tag closable onClose={() => setUrl({ seller: "" })} className="m-0 py-1">
              Filtered to one seller
            </Tag>
          )}
          {hasFilters && (
            <Button
              type="link"
              onClick={() => {
                setSearch("");
                setUrl({ q: "", category: "", seller: "" });
              }}
            >
              Clear filters
            </Button>
          )}
        </Toolbar>

        {isError ? (
          <QueryError error={error} onRetry={refetch} />
        ) : screens.md === false ? (
          <MobileList products={products} loading={isLoading} menu={menu} primaryAction={primaryAction} />
        ) : (
          <Table
            className="data-table"
            rowKey="_id"
            columns={columns}
            dataSource={products}
            loading={isFetching && !isLoading ? { delay: 200 } : isLoading}
            pagination={false}
            onChange={(_, __, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              setUrl(s?.order ? { sort: s.columnKey, order: s.order === "ascend" ? "asc" : "desc" } : { sort: "createdAt", order: "desc" });
            }}
            locale={{
              emptyText: isLoading ? " " : (
                <EmptyState
                  title={url.status === "pending" ? "Review queue is empty" : "No listings found"}
                  description={url.status === "pending" ? "New submissions will appear here." : "Try a different filter."}
                />
              ),
            }}
            scroll={{ x: 760 }}
          />
        )}
        <ListPagination meta={data?.meta} noun="listings" onChange={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
      </div>
    </>
  );
}

function MobileList({ products, loading, menu, primaryAction }) {
  if (loading) return <div className="p-6 text-center text-muted">Loading listings…</div>;
  if (!products.length) return <EmptyState title="No listings found" />;
  return (
    <ul className="m-0 list-none divide-y divide-line p-0">
      {products.map((p) => (
        <li key={p._id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <Link to={`/marketplace/${p._id}`} className="flex min-w-0 items-center gap-3 text-inherit no-underline">
              <ProductThumb src={p.images?.[0]} alt={p.name} />
              <div className="min-w-0">
                <div className="truncate font-medium text-fg">{p.name}</div>
                <div className="truncate text-xs text-muted">
                  {p.seller?.name} · {formatPrice(p.price)}
                </div>
              </div>
            </Link>
            <Dropdown menu={menu(p)} trigger={["click"]} placement="bottomRight">
              <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.name}`} />
            </Dropdown>
          </div>
          <div className="flex items-center justify-between gap-2">
            <StatusTag status={p.status} />
            {primaryAction(p)}
          </div>
        </li>
      ))}
    </ul>
  );
}
