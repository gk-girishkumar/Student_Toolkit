import { SignIn } from '@clerk/clerk-react';
import './AuthPage.css';

function LoginPage() {
  return (
    <div className="auth-page auth-page-simple">
      <div className="auth-panel auth-panel-simple">
        <div className="auth-brand">Student Toolkit</div>
        <h1>Sign in to continue</h1>
        <p>Use your existing credentials or sign up directly from the Clerk form.</p>
        <div className="auth-widget">
          <SignIn routing="path" path="/sign-in" />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
