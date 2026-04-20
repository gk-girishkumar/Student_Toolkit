import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import ToolMenu from './components/ToolMenu';
import ToolPage from './components/ToolPage';
import Subscription from './components/Subscription';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Student Toolkit</div>
        <nav className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/subscription">Pricing</Link>
        </nav>
        <div className="auth-actions">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignIn path="/sign-in" routing="path" />
            <SignUp path="/sign-up" routing="path" />
          </SignedOut>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProtectedDashboard />} />
          <Route path="/tool/:toolId" element={<ToolPage />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedDashboard() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.firstName || 'Student'}!</h1>
          <p>Use the tools below to manage PDF and image tasks, or upgrade to a premium plan.</p>
        </div>
      </div>
      <ToolMenu />
    </div>
  );
}

export default App;
