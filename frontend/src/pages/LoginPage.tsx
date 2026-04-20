import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import './AuthPage.css';

function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">Student Toolkit</div>
        <h1>Welcome back</h1>
        <p>Login to access PDF and image tools instantly.</p>
        <div className="auth-widget">
          <SignIn routing="path" path="/sign-in" />
        </div>
        <div className="auth-footer">
          <span>New here?</span>
          <Link to="/sign-up">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
