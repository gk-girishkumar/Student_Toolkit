import { Route, Routes, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import TopNav from './components/TopNav';
import ToolMenu from './components/ToolMenu';
import ToolPage from './components/ToolPage';
import Subscription from './components/Subscription';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <TopNav />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProtectedDashboard />} />
          <Route path="/tool/:toolId" element={<ToolPage />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/sign-in/*" element={<LoginPage />} />
          <Route path="/sign-up/*" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedDashboard() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken({ template: 'default' });
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
        await fetch(`${apiBaseUrl}/api/user`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('User sync failed:', error);
      }
    }

    syncUser();
  }, [isLoaded, user, getToken]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <div className="dashboard-page hero-page">
      <div className="dashboard-header hero-header">
        <h1>Welcome back, {user.firstName || 'Student'}!</h1>
        <p>Use the tool list below to select any PDF or image conversion tool.</p>
      </div>
    </div>
  );
}

export default App;
