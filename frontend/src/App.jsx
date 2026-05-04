import { Route, Routes, Navigate, Link } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import TopNav from "./components/TopNav";
import ToolPage from "./components/ToolPage";
import Subscription from "./components/Subscription";
import LoginPage from "./pages/LoginPage";
import { Zap } from "lucide-react";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <TopNav />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProtectedDashboard />} />
          <Route
            path="/tool/:toolId"
            element={
              <ProtectedRoute>
                <ToolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route path="/sign-in/*" element={<LoginPage />} />
          <Route
            path="/sign-up/*"
            element={<Navigate to="/sign-in" replace />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken();
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
        await fetch(`${apiBaseUrl}/api/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("User sync failed:", error);
      }
    }

    syncUser();
  }, [isLoaded, user, getToken]);

  if (!isLoaded) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function ProtectedDashboard() {
  const { user } = useUser();
  const [tools, setTools] = useState([]);

  useEffect(() => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    fetch(`${apiBaseUrl}/api/tools`)
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []))
      .catch(() => setTools([]));
  }, []);

  return (
    <div className="dashboard-page hero-page">
      <div className="dashboard-header hero-header">
        <h1>Welcome back, {(user?.firstName || "Student").toUpperCase()}!</h1>
        <p>
          Select a tool below to get started.
        </p>
      </div>

      <div className="dashboard-content">
        {tools.map((group) => (
          <div key={group.category} className="tool-category-section">
            <h2 className="category-title">{group.category}</h2>
            <div className="tool-grid">
              {group.items.map((item) => (
                <Link
                  key={item}
                  to={`/tool/${createSlug(item)}`}
                  className="tool-card"
                >
                  <div className="tool-card-icon">
                    {/* Simplified icons for the dashboard */}
                    <Zap size={24} />
                  </div>
                  <div className="tool-card-info">
                    <h3>{item}</h3>
                    <p>Free, easy to use PDF tool.</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default App;
