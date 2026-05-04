import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import "./AuthPage.css";

function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">Student Toolkit</div>
        <h1>Create your account</h1>
        <p>Sign up to start using PDF and image conversion tools.</p>
        <div className="auth-widget">
          <SignUp routing="path" path="/sign-up" />
        </div>
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/sign-in">Login instead</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
