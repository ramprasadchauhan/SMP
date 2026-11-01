import { Skeleton } from "antd";

export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading page">
      <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 360 }} />
      <div className="card p-5">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    </div>
  );
}
