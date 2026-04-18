import { NavLink, Outlet } from "react-router-dom";

const NAV: { to: string; label: string; icon: string }[] = [
  { to: "/",           label: "Today",       icon: "◎" },
  { to: "/scan",       label: "Scene Scan",  icon: "📷" },
  { to: "/fridge",     label: "Fridge",      icon: "🧊" },
  { to: "/groceries",  label: "Groceries",   icon: "🛒" },
  { to: "/activity",   label: "Activity",    icon: "⚡" },
  { to: "/coach",      label: "Coach",       icon: "🧭" },
  { to: "/settings",   label: "Settings",    icon: "⚙" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot" />
          <span>BEAT</span>
        </div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span style={{ width: 18, display: "inline-block", textAlign: "center" }}>
              {n.icon}
            </span>
            {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="foot">v0.1 · template</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
