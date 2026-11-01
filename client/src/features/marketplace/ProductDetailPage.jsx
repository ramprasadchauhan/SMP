/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Result, Skeleton, Tooltip } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from "@ant-design/icons";
import { productsApi } from "../../services/endpoints";
import { categoryLabel } from "../../constants";
import { formatDate, formatPrice, fromNow } from "../../utils/format";
import { EmptyState, ProductThumb, QueryError, StatusTag, UserCell } from "../../components/ui";
import BidModal from "./BidModal";

const FLAGS = [
  ["billAvailable", "Original bill"],
  ["warrantyAvailable", "Warranty"],
  ["accessoriesAvailable", "Accessories"],
  ["boxAvailable", "Original box"],
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [imageIndex, setImageIndex] = useState(0);
  const [bidOpen, setBidOpen] = useState(false);

  const product = useQuery({ queryKey: ["product", id], queryFn: () => productsApi.get(id) });
  const bids = useQuery({ queryKey: ["product", id, "bids"], queryFn: () => productsApi.bids(id, { limit: 20 }), enabled: product.isSuccess });

  if (product.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-surface-hover" />
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }
  if (product.isError) {
    return product.error.status === 404 || product.error.code === "VALIDATION_ERROR" ? (
      <Result
        status="404"
        title="Listing not found"
        subTitle="It may have been removed or is not available yet."
        extra={<Button onClick={() => navigate("/marketplace")}>Back to marketplace</Button>}
      />
    ) : (
      <div className="card">
        <QueryError error={product.error} onRetry={product.refetch} />
      </div>
    );
  }

  const p = product.data.data;
  const isOwner = p.seller?._id === user._id;
  const canBid = !isOwner && p.status === "approved";
  const images = p.images || [];
  const current = images[Math.min(imageIndex, images.length - 1)];

  return (
    <>
      <Button type="link" icon={<ArrowLeftOutlined />} className="mb-4 px-0" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/marketplace"))}>
        Back
      </Button>

      {p.status !== "approved" && (
        <Alert
          className="mb-5"
          showIcon
          type={p.status === "pending" ? "warning" : "error"}
          message={`This listing is ${p.status} and is not visible to buyers.`}
          description={p.status === "pending" ? "An administrator will review it shortly." : undefined}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section aria-label="Photos">
          <div className="card aspect-square overflow-hidden">
            {current ? (
              <img src={current} alt={`${p.name}, photo ${imageIndex + 1} of ${images.length}`} className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full place-items-center bg-surface-2">
                <ProductThumb alt="No photos" size={72} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="list">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="listitem"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === imageIndex}
                  onClick={() => setImageIndex(i)}
                  className="shrink-0 cursor-pointer rounded-lg border-2 bg-transparent p-0.5"
                  style={{ borderColor: i === imageIndex ? "var(--primary)" : "transparent" }}
                >
                  <img src={src} alt="" className="h-16 w-16 rounded-md object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <span>{categoryLabel(p.category)}</span>
              <span aria-hidden="true">·</span>
              <span>Listed {fromNow(p.createdAt)}</span>
              {p.status !== "approved" && <StatusTag status={p.status} />}
            </div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-fg">{p.name}</h1>
            <div className="mt-3 text-[28px] font-semibold tabular-nums text-fg">{formatPrice(p.price)}</div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Tooltip title={isOwner ? "You can't bid on your own listing" : !canBid ? "Bidding opens once the listing is approved" : null}>
              <Button type="primary" size="large" icon={<DollarOutlined />} disabled={!canBid} onClick={() => setBidOpen(true)}>
                Place a bid
              </Button>
            </Tooltip>
            {isOwner && (
              <Link to="/my-products">
                <Button size="large">Manage my listings</Button>
              </Link>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Description</h2>
            <p className="whitespace-pre-line break-words text-[15px] text-fg">{p.description}</p>
          </div>

          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="Category">{categoryLabel(p.category)}</Descriptions.Item>
            <Descriptions.Item label="Age">
              {p.age} {p.age === 1 ? "year" : "years"} (bought ~{new Date().getFullYear() - p.age})
            </Descriptions.Item>
            {FLAGS.map(([key, label]) => (
              <Descriptions.Item key={key} label={label}>
                {p[key] ? (
                  <span style={{ color: "var(--success)" }}>
                    <CheckCircleOutlined /> Included
                  </span>
                ) : (
                  <span className="text-muted">
                    <CloseCircleOutlined /> Not included
                  </span>
                )}
              </Descriptions.Item>
            ))}
          </Descriptions>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Seller</h2>
            <UserCell name={p.seller?.name || "Unknown seller"} email={p.seller?.email} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Bids</h2>
            <BidList query={bids} />
          </div>
        </section>
      </div>

      {bidOpen && <BidModal product={p} open={bidOpen} onClose={() => setBidOpen(false)} />}
    </>
  );
}

function BidList({ query }) {
  if (query.isLoading) return <Skeleton active paragraph={{ rows: 2 }} />;
  if (query.isError) return <QueryError error={query.error} onRetry={query.refetch} compact />;
  const { data: items, meta } = query.data;
  if (!meta.visible) return <p className="text-sm text-muted">The seller has chosen to keep bids private.</p>;
  if (!items.length) return <EmptyState title="No bids yet" description="Be the first to make an offer." />;
  return (
    <ul className="card m-0 list-none divide-y divide-line p-0">
      {items.map((b) => (
        <li key={b._id} className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="font-medium text-fg">{b.buyer?.name || "Unknown"}</div>
            <div className="text-xs text-muted">{formatDate(b.createdAt)}</div>
            {meta.privileged && (
              <div className="mt-2 text-sm text-muted">
                {b.message && <p className="mb-1 italic">“{b.message}”</p>}
                <span>{b.buyer?.email}</span>
                {b.mobile && <span> · {b.mobile}</span>}
              </div>
            )}
          </div>
          <span className="shrink-0 font-semibold tabular-nums text-fg">{formatPrice(b.bidAmount)}</span>
        </li>
      ))}
    </ul>
  );
}
