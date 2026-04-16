// src/components/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  console.log("DashboardLayout rendered");
  return (
    <div className="flex w-full">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet /> {/* nested routes (jobs, stats, profile) render here */}
      </main>
    </div>
  );
}
