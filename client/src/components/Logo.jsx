/* eslint-disable react/prop-types */
export default function Logo({ collapsed = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-semibold text-fg ${className}`}>
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold tracking-tight text-white"
        style={{ background: "var(--primary)" }}
      >
        SM
      </span>
      {!collapsed && (
        <span className="text-[15px] leading-none tracking-tight">
          SMP <span className="font-normal text-muted">Marketplace</span>
        </span>
      )}
    </span>
  );
}
