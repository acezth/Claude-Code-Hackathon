import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const NAV: { to: string; label: string; icon: string }[] = [
  { to: "/",         label: "Today",      icon: "◎" },
  { to: "/scan",     label: "Scene Scan", icon: "📷" },
  { to: "/fridge",   label: "Meal Scan",  icon: "🍽️" },
  { to: "/eat",      label: "Eat",        icon: "🍽️" },
  { to: "/activity", label: "Activity",   icon: "⚡" },
  { to: "/settings", label: "Settings",   icon: "⚙" },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  function handleSignOut() {
    signOut();
    nav("/login", { replace: true });
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

        {user && (
          <div className="user-chip">
            {user.picture ? (
              <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
            ) : (
              <div className="avatar-fallback">{initials}</div>
            )}
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="sign-out" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              ⎋
            </button>
          </div>
        )}

        <div className="foot">v0.1 · template</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

