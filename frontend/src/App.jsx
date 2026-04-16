import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ResetPassword from "./pages/Auth/ResetPassword";
import ConfirmEmail from "./pages/Auth/ConfirmEmail";
import Jobs from "./pages/Dashboard/Jobs";
import Stats from "./pages/Dashboard/Stats";
import Profile from "./pages/Dashboard/Profile";
import JobDetail from "./pages/Dashboard/JobDetail";
import NotFound from "./pages/NotFound";
import NewJob from "./pages/Dashboard/NewJob";
import JobEdit from "./pages/Dashboard/JobEdit";
// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <div className="flex min-h-screen">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* public reset route — must be top-level (no auth) */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="jobs" element={<Jobs />} />
          <Route path="stats" element={<Stats />} />
          <Route path="profile" element={<Profile />} />
          <Route path="job/new" element={<NewJob />} />
          <Route path="job/:id" element={<JobDetail />} />
          <Route path="job/:id/edit" element={<JobEdit />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
