/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { App, Button, Dropdown, Grid, Input, Select, Table, Tooltip } from "antd";
import { DownloadOutlined, MoreOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { usersApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatDate, fromNow } from "../../utils/format";
import { EmptyState, PageHeader, QueryError, RoleTag, StatusTag, Toolbar, UserCell } from "../../components/ui";
import ListPagination from "../../components/ListPagination";
import UserDetailDrawer from "./UserDetailDrawer";
import { useUserActions, userMenuItems } from "./userActions";

const URL_SCHEMA = { q: "", role: "", status: "", sort: "createdAt", order: "desc", page: 1, limit: 10, user: "" };

export default function UsersPage() {
  const me = useSelector((s) => s.auth.user);
  const screens = Grid.useBreakpoint();
  const { message } = App.useApp();
  const [url, setUrl] = useUrlState(URL_SCHEMA);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebouncedValue(search);
  const [exporting, setExporting] = useState(false);
  const actions = useUserActions();

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filters = { q: url.q, role: url.role, status: url.status, sort: url.sort, order: url.order };
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["users", { ...filters, page: url.page, limit: url.limit }],
    queryFn: () => usersApi.list({ ...filters, page: url.page, limit: url.limit }),
    placeholderData: keepPreviousData,
  });

  const openUser = (u) => setUrl({ user: u._id }, { resetPage: false });
  const menu = (u) => ({ items: userMenuItems(u, me._id, { onView: openUser, ...actions }) });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await usersApi.exportCsv(filters);
    } catch (err) {
      message.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const sortOrder = (key) => (url.sort === key ? (url.order === "asc" ? "ascend" : "descend") : null);
  const columns = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      sorter: true,
      sortOrder: sortOrder("name"),
      render: (_, u) => (
        <button type="button" onClick={() => openUser(u)} className="cursor-pointer border-0 bg-transparent p-0 text-left">
          <UserCell name={u.name} email={u.email} />
        </button>
      ),
    },
    { title: "Role", dataIndex: "role", key: "role", width: 100, render: (r) => <RoleTag role={r} /> },
    { title: "Status", dataIndex: "status", key: "status", width: 120, render: (s) => <StatusTag status={s} /> },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      sorter: true,
      sortOrder: sortOrder("createdAt"),
      render: (d) => <span className="text-muted">{formatDate(d)}</span>,
    },
    {
      title: "Last sign-in",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      width: 150,
      sorter: true,
      sortOrder: sortOrder("lastLoginAt"),
      responsive: ["xl"],
      render: (d) => <span className="text-muted">{d ? fromNow(d) : "Not recorded"}</span>,
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      width: 56,
      align: "right",
      render: (_, u) => (
        <Dropdown menu={menu(u)} trigger={["click"]} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${u.name}`} />
        </Dropdown>
      ),
    },
  ];

  const users = data?.data || [];
  const hasFilters = url.q || url.role || url.status;

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage accounts, roles and access to the marketplace."
        actions={
          <Tooltip title="Exports every user matching the current filters (up to 5,000 rows)">
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportCsv}>
              Export CSV
            </Button>
          </Tooltip>
        }
      >
        {data?.meta && (
          <p className="mt-2 text-sm text-muted">
            {data.meta.total} {data.meta.total === 1 ? "user" : "users"}
            {hasFilters ? " match your filters" : " in total"}
          </p>
        )}
      </PageHeader>

      <div className="card overflow-hidden">
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
            placeholder="Search name or email"
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Filter by role"
            value={url.role || ""}
            onChange={(role) => setUrl({ role })}
            className="w-[calc(50%-4px)] sm:w-36"
            options={[
              { value: "", label: "All roles" },
              { value: "user", label: "Users" },
              { value: "admin", label: "Admins" },
            ]}
          />
          <Select
            aria-label="Filter by status"
            value={url.status || ""}
            onChange={(status) => setUrl({ status })}
            className="w-[calc(50%-4px)] sm:w-36"
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ]}
          />
          {hasFilters && (
            <Button
              type="link"
              onClick={() => {
                setSearch("");
                setUrl({ q: "", role: "", status: "" });
              }}
            >
              Clear filters
            </Button>
          )}
        </Toolbar>

        {isError ? (
          <QueryError error={error} onRetry={refetch} />
        ) : screens.md === false ? (
          <MobileUserList users={users} loading={isLoading} menu={menu} onOpen={openUser} hasFilters={hasFilters} />
        ) : (
          <Table
            className="data-table"
            rowKey="_id"
            columns={columns}
            dataSource={users}
            loading={isFetching && !isLoading ? { delay: 200 } : isLoading}
            pagination={false}
            onChange={(_, __, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              setUrl(s?.order ? { sort: s.columnKey, order: s.order === "ascend" ? "asc" : "desc" } : { sort: "createdAt", order: "desc" });
            }}
            locale={{ emptyText: isLoading ? " " : <EmptyState title="No users found" description={hasFilters ? "Try a different search or clear the filters." : undefined} /> }}
            scroll={{ x: 720 }}
          />
        )}
        <ListPagination meta={data?.meta} noun="users" onChange={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
      </div>

      <UserDetailDrawer userId={url.user || null} onClose={() => setUrl({ user: "" }, { resetPage: false })} actions={actions} />
    </>
  );
}

function MobileUserList({ users, loading, menu, onOpen, hasFilters }) {
  if (loading) return <div className="p-6 text-center text-muted">Loading users…</div>;
  if (!users.length) return <EmptyState title="No users found" description={hasFilters ? "Try a different search or clear the filters." : undefined} />;
  return (
    <ul className="m-0 list-none divide-y divide-line p-0">
      {users.map((u) => (
        <li key={u._id} className="flex items-start justify-between gap-3 p-4">
          <button type="button" onClick={() => onOpen(u)} className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left">
            <UserCell name={u.name} email={u.email} />
            <div className="mt-2 flex flex-wrap items-center gap-2 pl-11">
              <RoleTag role={u.role} />
              <StatusTag status={u.status} />
              <span className="text-xs text-muted">Joined {formatDate(u.createdAt)}</span>
            </div>
          </button>
          <Dropdown menu={menu(u)} trigger={["click"]} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${u.name}`} />
          </Dropdown>
        </li>
      ))}
    </ul>
  );
}
