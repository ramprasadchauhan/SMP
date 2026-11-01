/* eslint-disable react/prop-types */
import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Segmented, Table } from "antd";
import { bidsApi, productsApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { formatDate, formatPrice } from "../../utils/format";
import { EmptyState, PageHeader, ProductThumb, QueryError, StatusTag } from "../../components/ui";
import ListPagination from "../../components/ListPagination";

const URL_SCHEMA = { tab: "placed", page: 1, limit: 10 };

// Shared by this page and the "bids on a listing" drawer.
export function BidsTable({ mode, productId, page: pageProp, limit: limitProp, onPage }) {
  const [local, setLocal] = useState({ page: 1, limit: 10 });
  const page = pageProp ?? local.page;
  const limit = limitProp ?? local.limit;
  const fetcher = {
    placed: () => bidsApi.mine({ page, limit }),
    received: () => bidsApi.received({ page, limit }),
    product: () => productsApi.bids(productId, { page, limit }),
  }[mode];

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: mode === "product" ? ["product", productId, "bids", page, limit] : ["bids", mode, page, limit],
    queryFn: fetcher,
    placeholderData: keepPreviousData,
  });

  const productCol = {
    title: "Listing",
    key: "product",
    render: (_, b) =>
      b.product ? (
        <Link to={`/marketplace/${b.product._id}`} className="flex min-w-0 items-center gap-3 text-inherit no-underline">
          <ProductThumb src={b.product.images?.[0]} alt={b.product.name} size={40} />
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{b.product.name}</div>
            <div className="text-xs text-muted">Asking {formatPrice(b.product.price)}</div>
          </div>
        </Link>
      ) : (
        <span className="text-muted">Deleted listing</span>
      ),
  };
  const contactCol = {
    title: "Buyer",
    key: "buyer",
    render: (_, b) => (
      <div className="min-w-0 text-sm">
        <div className="font-medium text-fg">{b.buyer?.name || "Unknown"}</div>
        <div className="text-muted">{b.buyer?.email}</div>
        {b.mobile && <div className="text-muted">{b.mobile}</div>}
      </div>
    ),
  };
  const columns = [
    ...(mode !== "product" ? [productCol] : []),
    ...(mode === "placed"
      ? [{ title: "Seller", key: "seller", render: (_, b) => b.seller?.name || "—" }, { title: "Listing status", key: "status", render: (_, b) => b.product && <StatusTag status={b.product.status} /> }]
      : [contactCol]),
    { title: "Offer", dataIndex: "bidAmount", key: "bidAmount", width: 110, render: (v) => <span className="font-semibold tabular-nums text-fg">{formatPrice(v)}</span> },
    { title: "Message", dataIndex: "message", key: "message", ellipsis: true, responsive: ["lg"] },
    { title: "Date", dataIndex: "createdAt", key: "createdAt", width: 120, render: (d) => <span className="text-muted">{formatDate(d)}</span> },
  ];

  if (isError) return <QueryError error={error} onRetry={refetch} />;
  const changePage = ({ page, limit }) => (onPage ? onPage({ page, limit }) : setLocal({ page, limit }));
  return (
    <>
      <Table
        className="data-table"
        rowKey="_id"
        columns={columns}
        dataSource={data?.data || []}
        loading={isFetching}
        pagination={false}
        scroll={{ x: 640 }}
        expandable={{
          expandedRowRender: (b) => <p className="m-0 whitespace-pre-line text-sm text-fg">{b.message}</p>,
          rowExpandable: (b) => Boolean(b.message),
        }}
        locale={{
          emptyText: isLoading ? " " : (
            <EmptyState
              title={mode === "placed" ? "You haven't placed any bids" : "No bids yet"}
              description={mode === "placed" ? "Browse the marketplace and make an offer." : "Offers from buyers will appear here."}
            />
          ),
        }}
      />
      <ListPagination meta={data?.meta} noun="bids" onChange={changePage} />
    </>
  );
}

export default function MyBidsPage() {
  const [url, setUrl] = useUrlState(URL_SCHEMA);
  const tab = url.tab === "received" ? "received" : "placed";
  return (
    <>
      <PageHeader title="Bids" description="Offers you've made, and offers buyers have made on your listings." />
      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <Segmented
            value={tab}
            onChange={(t) => setUrl({ tab: t })}
            options={[
              { value: "placed", label: "Bids I placed" },
              { value: "received", label: "Bids on my listings" },
            ]}
          />
        </div>
        <BidsTable key={tab} mode={tab} page={url.page} limit={url.limit} onPage={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
      </div>
    </>
  );
}
