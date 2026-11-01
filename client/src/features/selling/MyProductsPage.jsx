import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Drawer, Dropdown, Grid, Input, Segmented, Table } from "antd";
import { DeleteOutlined, DollarOutlined, EditOutlined, EyeOutlined, MoreOutlined, PictureOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { productsApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { PRODUCT_STATUSES, categoryLabel } from "../../constants";
import { capitalize, formatDate, formatPrice } from "../../utils/format";
import { EmptyState, PageHeader, ProductThumb, QueryError, StatusTag, Toolbar } from "../../components/ui";
import ListPagination from "../../components/ListPagination";
import ProductFormModal from "./ProductFormModal";
import ProductImagesModal from "./ProductImagesModal";
import { BidsTable } from "./MyBidsPage";

const URL_SCHEMA = { q: "", status: "", sort: "createdAt", order: "desc", page: 1, limit: 10, new: "" };

export default function MyProductsPage() {
  const qc = useQueryClient();
  const { modal, message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [url, setUrl] = useUrlState(URL_SCHEMA);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebouncedValue(search);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(url.new === "1");
  const [imagesFor, setImagesFor] = useState(null);
  const [bidsFor, setBidsFor] = useState(null);

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params = { q: url.q, status: url.status, sort: url.sort, order: url.order, page: url.page, limit: url.limit };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["products", "mine", params],
    queryFn: () => productsApi.mine(params),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      message.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => message.error(err.message),
  });

  const openForm = (p = null) => {
    setEditing(p);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    if (url.new) setUrl({ new: "" }, { resetPage: false });
  };
  const confirmDelete = (p) =>
    modal.confirm({
      title: `Delete “${p.name}”?`,
      content: "The listing and every bid on it will be permanently removed.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync(p._id).catch(() => {}),
    });

  const menu = (p) => ({
    items: [
      { key: "view", icon: <EyeOutlined />, label: <Link to={`/marketplace/${p._id}`}>View listing</Link> },
      { key: "edit", icon: <EditOutlined />, label: "Edit details", onClick: () => openForm(p) },
      { key: "photos", icon: <PictureOutlined />, label: "Manage photos", onClick: () => setImagesFor(p._id) },
      { key: "bids", icon: <DollarOutlined />, label: "View bids", onClick: () => setBidsFor(p) },
      { type: "divider" },
      { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true, onClick: () => confirmDelete(p) },
    ],
  });

  const sortOrder = (key) => (url.sort === key ? (url.order === "asc" ? "ascend" : "descend") : null);
  const columns = [
    {
      title: "Listing",
      key: "name",
      sorter: true,
      sortOrder: sortOrder("name"),
      render: (_, p) => (
        <div className="flex min-w-0 items-center gap-3">
          <ProductThumb src={p.images?.[0]} alt={p.name} />
          <div className="min-w-0">
            <Link to={`/marketplace/${p._id}`} className="block truncate font-medium text-fg">
              {p.name}
            </Link>
            <div className="truncate text-xs text-muted">
              {categoryLabel(p.category)} · {p.images?.length || 0} photo(s)
            </div>
          </div>
        </div>
      ),
    },
    { title: "Price", key: "price", dataIndex: "price", width: 120, sorter: true, sortOrder: sortOrder("price"), render: (v) => <span className="tabular-nums">{formatPrice(v)}</span> },
    { title: "Status", key: "status", dataIndex: "status", width: 120, render: (s) => <StatusTag status={s} /> },
    { title: "Listed", key: "createdAt", dataIndex: "createdAt", width: 130, sorter: true, sortOrder: sortOrder("createdAt"), render: (d) => <span className="text-muted">{formatDate(d)}</span> },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      width: 140,
      align: "right",
      render: (_, p) => (
        <div className="flex justify-end gap-1">
          <Button size="small" onClick={() => setBidsFor(p)}>
            Bids
          </Button>
          <Dropdown menu={menu(p)} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.name}`} />
          </Dropdown>
        </div>
      ),
    },
  ];

  const products = data?.data || [];
  const empty = (
    <EmptyState
      title={url.q || url.status ? "No listings match" : "You haven't listed anything yet"}
      description={url.q || url.status ? "Try another search or status." : "Create your first listing. It will go live once approved."}
      action={
        !(url.q || url.status) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            New listing
          </Button>
        )
      }
    />
  );

  return (
    <>
      <PageHeader
        title="My listings"
        description="Create and manage the items you're selling."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            New listing
          </Button>
        }
      />
      <div className="card overflow-hidden">
        <Toolbar>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-subtle" />}
            placeholder="Search my listings"
            aria-label="Search my listings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <div className="max-w-full overflow-x-auto">
            <Segmented
              value={url.status}
              onChange={(status) => setUrl({ status })}
              options={[{ value: "", label: "All" }, ...PRODUCT_STATUSES.map((s) => ({ value: s, label: capitalize(s) }))]}
            />
          </div>
        </Toolbar>
        {isError ? (
          <QueryError error={error} onRetry={refetch} />
        ) : screens.md === false ? (
          isLoading ? (
            <div className="p-6 text-center text-muted">Loading…</div>
          ) : products.length ? (
            <ul className="m-0 list-none divide-y divide-line p-0">
              {products.map((p) => (
                <li key={p._id} className="flex items-start justify-between gap-3 p-4">
                  <Link to={`/marketplace/${p._id}`} className="flex min-w-0 items-center gap-3 text-inherit no-underline">
                    <ProductThumb src={p.images?.[0]} alt={p.name} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-fg">{p.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <StatusTag status={p.status} /> {formatPrice(p.price)}
                      </div>
                    </div>
                  </Link>
                  <Dropdown menu={menu(p)} trigger={["click"]} placement="bottomRight">
                    <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.name}`} />
                  </Dropdown>
                </li>
              ))}
            </ul>
          ) : (
            empty
          )
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
            locale={{ emptyText: isLoading ? " " : empty }}
            scroll={{ x: 640 }}
          />
        )}
        <ListPagination meta={data?.meta} noun="listings" onChange={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
      </div>

      <ProductFormModal open={formOpen} product={editing} onClose={closeForm} onCreated={(p) => setImagesFor(p._id)} />
      <ProductImagesModal productId={imagesFor} onClose={() => setImagesFor(null)} />
      <Drawer open={Boolean(bidsFor)} onClose={() => setBidsFor(null)} title={bidsFor ? `Bids · ${bidsFor.name}` : "Bids"} width={screens.md === false ? "100%" : 720} destroyOnHidden>
        {bidsFor && <BidsTable mode="product" productId={bidsFor._id} />}
      </Drawer>
    </>
  );
}
