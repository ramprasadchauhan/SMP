/* eslint-disable react/prop-types */
import { Pagination } from "antd";

export default function ListPagination({ meta, onChange, pageSizeOptions = [10, 20, 50], noun = "items" }) {
  if (!meta) return null;
  const from = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
      <span className="text-sm text-muted" aria-live="polite">
        {meta.total ? `Showing ${from}–${to} of ${meta.total} ${noun}` : `No ${noun}`}
      </span>
      <Pagination
        current={meta.page}
        pageSize={meta.limit}
        total={meta.total}
        showSizeChanger
        pageSizeOptions={pageSizeOptions}
        onChange={(page, limit) => onChange({ page, limit })}
        size="small"
        hideOnSinglePage={false}
      />
    </div>
  );
}
