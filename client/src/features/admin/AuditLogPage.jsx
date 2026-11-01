import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Select, Table, Tag } from "antd";
import { auditApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { AUDIT_ACTION_LABELS } from "../../constants";
import { formatDateTime, fromNow } from "../../utils/format";
import { EmptyState, PageHeader, QueryError, Toolbar } from "../../components/ui";
import ListPagination from "../../components/ListPagination";

const URL_SCHEMA = { action: "", targetType: "", page: 1, limit: 20 };

export default function AuditLogPage() {
  const [url, setUrl] = useUrlState(URL_SCHEMA);
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["audit", url],
    queryFn: () => auditApi.list(url),
    placeholderData: keepPreviousData,
  });

  const columns = [
    {
      title: "When",
      dataIndex: "createdAt",
      width: 200,
      render: (d) => (
        <div>
          <div className="text-fg">{fromNow(d)}</div>
          <div className="text-xs text-muted">{formatDateTime(d)}</div>
        </div>
      ),
    },
    { title: "Administrator", dataIndex: "actorName", width: 180, render: (v) => <span className="font-medium text-fg">{v}</span> },
    { title: "Action", dataIndex: "action", width: 200, render: (a) => <Tag bordered={false}>{AUDIT_ACTION_LABELS[a] || a}</Tag> },
    {
      title: "Target",
      key: "target",
      render: (_, a) => (
        <div className="min-w-0">
          <div className="truncate text-fg">{a.targetLabel || a.targetId}</div>
          <div className="text-xs capitalize text-muted">{a.targetType}</div>
        </div>
      ),
    },
    {
      title: "Change",
      dataIndex: "changes",
      render: (c) =>
        c ? (
          <span className="text-muted">
            {Object.entries(c).map(([k, v]) => (
              <span key={k}>
                {k}: <span className="line-through">{v.from}</span> → <span className="font-medium text-fg">{v.to}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of administrative actions: who did what, and when." />
      <div className="card overflow-hidden">
        <Toolbar>
          <Select
            aria-label="Filter by action"
            value={url.action}
            onChange={(action) => setUrl({ action })}
            className="w-full sm:w-60"
            options={[{ value: "", label: "All actions" }, ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))]}
          />
          <Select
            aria-label="Filter by target"
            value={url.targetType}
            onChange={(targetType) => setUrl({ targetType })}
            className="w-full sm:w-40"
            options={[
              { value: "", label: "All targets" },
              { value: "user", label: "Users" },
              { value: "product", label: "Products" },
            ]}
          />
        </Toolbar>
        {isError ? (
          <QueryError error={error} onRetry={refetch} />
        ) : (
          <Table
            className="data-table"
            rowKey="_id"
            columns={columns}
            dataSource={data?.data || []}
            loading={isFetching}
            pagination={false}
            scroll={{ x: 820 }}
            locale={{ emptyText: isLoading ? " " : <EmptyState title="No entries yet" description="Blocking users, changing roles and moderating listings are recorded here." /> }}
          />
        )}
        <ListPagination meta={data?.meta} noun="entries" pageSizeOptions={[20, 50, 100]} onChange={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
      </div>
    </>
  );
}
