/* eslint-disable react/prop-types */
import { Spin } from "antd";
import Logo from "./Logo";

export default function FullPageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg" role="status" aria-live="polite">
      <Logo />
      <Spin />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
