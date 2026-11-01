import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined, SafetyOutlined, ShopOutlined, ThunderboltOutlined } from "@ant-design/icons";
import Logo from "../components/Logo";
import { toggleTheme } from "../store/uiSlice";

const POINTS = [
  { icon: <ShopOutlined />, title: "List in minutes", text: "Publish items with photos and condition details." },
  { icon: <ThunderboltOutlined />, title: "Real offers", text: "Buyers bid directly and you get notified instantly." },
  { icon: <SafetyOutlined />, title: "Moderated", text: "Every listing is reviewed before it goes live." },
];

export default function AuthLayout() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(160deg, #0b3b37 0%, #0f766e 100%)" }}
      >
        <span className="inline-flex items-center gap-2.5 text-[15px] font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-[13px] font-bold">SM</span>
          SMP Marketplace
        </span>
        <div className="max-w-md">
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight">Buy and sell pre-owned goods with confidence.</h2>
          <ul className="mt-10 flex list-none flex-col gap-6 p-0">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-lg" aria-hidden="true">
                  {p.icon}
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="block text-sm text-white/75">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className="text-xs text-white/60">© {new Date().getFullYear()} SMP</span>
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <span className="lg:invisible">
            <Logo />
          </span>
          <Tooltip title="Toggle theme">
            <Button
              type="text"
              shape="circle"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => dispatch(toggleTheme())}
            />
          </Tooltip>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
