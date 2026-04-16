import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Jobs", path: "/dashboard/jobs", icon: <Briefcase size={18} /> },
    { label: "Stats", path: "/dashboard/stats", icon: <BarChart3 size={18} /> },
    { label: "Profile", path: "/dashboard/profile", icon: <User size={18} /> },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r h-screen flex flex-col shadow-sm">
      {/* Top Brand */}
      <div className="px-5 py-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Job<span className="text-blue-600">Tracker</span>
        </h2>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {navItems.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${active
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="px-4 py-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
