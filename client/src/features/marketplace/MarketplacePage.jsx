/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Badge, Button, Checkbox, Drawer, Grid, Input, InputNumber, Select, Skeleton } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { productsApi } from "../../services/endpoints";
import { useUrlState } from "../../hooks/useUrlState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { AGE_RANGES, CATEGORIES, categoryLabel } from "../../constants";
import { formatPrice, fromNow } from "../../utils/format";
import { EmptyState, PageHeader, ProductThumb, QueryError } from "../../components/ui";
import ListPagination from "../../components/ListPagination";

const URL_SCHEMA = { q: "", category: [], age: [], minPrice: "", maxPrice: "", sort: "newest", page: 1, limit: 12 };
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function Filters({ url, setUrl }) {
  const [min, setMin] = useState(url.minPrice);
  const [max, setMax] = useState(url.maxPrice);
  useEffect(() => {
    setMin(url.minPrice);
    setMax(url.maxPrice);
  }, [url.minPrice, url.maxPrice]);

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 text-[13px] font-semibold text-fg">Category</legend>
        <Checkbox.Group className="flex flex-col gap-2" value={url.category} onChange={(category) => setUrl({ category })} options={CATEGORIES} />
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 text-[13px] font-semibold text-fg">Item age</legend>
        <Checkbox.Group className="flex flex-col gap-2" value={url.age} onChange={(age) => setUrl({ age })} options={AGE_RANGES} />
      </fieldset>
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-3 text-[13px] font-semibold text-fg">Price (USD)</legend>
        <div className="flex items-center gap-2">
          <InputNumber aria-label="Minimum price" placeholder="Min" min={0} value={min === "" ? null : Number(min)} onChange={(v) => setMin(v ?? "")} className="w-full" />
          <span className="text-muted">–</span>
          <InputNumber aria-label="Maximum price" placeholder="Max" min={0} value={max === "" ? null : Number(max)} onChange={(v) => setMax(v ?? "")} className="w-full" />
        </div>
        <Button className="mt-2" block onClick={() => setUrl({ minPrice: min, maxPrice: max })}>
          Apply price
        </Button>
      </fieldset>
    </div>
  );
}

export default function MarketplacePage() {
  const screens = Grid.useBreakpoint();
  const [url, setUrl, reset] = useUrlState(URL_SCHEMA);
  const [search, setSearch] = useState(url.q);
  const debounced = useDebouncedValue(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (debounced !== url.q) setUrl({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["products", "market", url],
    queryFn: () => productsApi.marketplace(url),
    placeholderData: keepPreviousData,
  });
  const products = data?.data || [];
  const activeFilters = url.category.length + url.age.length + (url.minPrice !== "" || url.maxPrice !== "" ? 1 : 0);
  const isDesktop = screens.lg ?? true;

  return (
    <>
      <PageHeader title="Browse products" description="Pre-owned items reviewed by our moderators." />
      <div className="flex gap-6">
        {isDesktop && (
          <aside className="card sticky top-[84px] h-fit w-60 shrink-0 p-5" aria-label="Filters">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-semibold text-fg">Filters</span>
              {activeFilters > 0 && (
                <Button type="link" size="small" className="p-0" onClick={() => setUrl({ category: [], age: [], minPrice: "", maxPrice: "" })}>
                  Reset
                </Button>
              )}
            </div>
            <Filters url={url} setUrl={setUrl} />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-subtle" />}
              placeholder="Search products"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[200px] flex-1"
            />
            {!isDesktop && (
              <Badge count={activeFilters} size="small">
                <Button size="large" icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)}>
                  Filters
                </Button>
              </Badge>
            )}
            <Select size="large" aria-label="Sort products" value={url.sort} onChange={(sort) => setUrl({ sort })} options={SORTS} className="w-48" />
          </div>
          {data?.meta && (
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              {data.meta.total} {data.meta.total === 1 ? "result" : "results"}
              {isFetching && !isLoading && " · updating…"}
            </p>
          )}

          {isError ? (
            <div className="card">
              <QueryError error={error} onRetry={refetch} />
            </div>
          ) : isLoading ? (
            <Grid4>{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}</Grid4>
          ) : products.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No products match"
                description="Try another search term or remove some filters."
                action={
                  <Button
                    onClick={() => {
                      setSearch("");
                      reset();
                    }}
                  >
                    Clear all filters
                  </Button>
                }
              />
            </div>
          ) : (
            <Grid4>
              {products.map((p) => (
                <ProductCard key={p._id} p={p} />
              ))}
            </Grid4>
          )}
          {products.length > 0 && (
            <div className="card mt-6 overflow-hidden">
              <ListPagination meta={data?.meta} noun="products" pageSizeOptions={[12, 24, 48]} onChange={({ page, limit }) => setUrl({ page, limit }, { resetPage: false })} />
            </div>
          )}
        </div>
      </div>
      <Drawer title="Filters" open={filtersOpen} onClose={() => setFiltersOpen(false)} placement="right" width={300}>
        <Filters url={url} setUrl={setUrl} />
      </Drawer>
    </>
  );
}

const Grid4 = ({ children }) => <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{children}</div>;

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-surface-hover" />
      <div className="p-4">
        <Skeleton active title={{ width: "70%" }} paragraph={{ rows: 1, width: "40%" }} />
      </div>
    </div>
  );
}

function ProductCard({ p }) {
  return (
    <Link
      to={`/marketplace/${p._id}`}
      className="card group flex flex-col overflow-hidden text-inherit no-underline transition-shadow hover:shadow-md focus-visible:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {p.images?.[0] ? (
          <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center">
            <ProductThumb alt={p.name} size={56} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-surface/90 px-2 py-0.5 text-xs font-medium text-fg backdrop-blur">{categoryLabel(p.category)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-[15px] font-semibold text-fg">{p.name}</h3>
        <p className="line-clamp-2 text-sm text-muted">{p.description}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-lg font-semibold tabular-nums text-fg">{formatPrice(p.price)}</span>
          <span className="text-xs text-subtle">{fromNow(p.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
