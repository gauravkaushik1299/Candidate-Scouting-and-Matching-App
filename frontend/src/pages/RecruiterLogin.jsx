import { useState } from "react";
import { supabase } from "../supabase";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../useTheme";

function RecruiterLogin({ onBack, recovery = false, onPasswordUpdated }) {
  const { darkMode, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase isn’t configured in the frontend environment yet.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    if (recovery) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (updateError) return setError(updateError.message);
      setMessage("Password updated. Opening the recruiter workspace…");
      window.setTimeout(onPasswordUpdated, 800);
      return;
    }

    if (showReset) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setBusy(false);
      if (resetError) return setError(resetError.message);
      setResetSent(true);
      setMessage("If this email belongs to an invited recruiter, a password setup link will arrive shortly.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) setError("Sign-in failed. Check your email and password, or use the password setup link.");
  };

  return (
    <main className="app-shell portal-shell screen-transition">
      <header className="page-header">
        <img className="brand-mark" src="/favicon.svg?v=2" alt="" />
        <div><p className="eyebrow">Recruiter workspace</p><h1>Candidate Scout</h1></div>
        <div className="page-header__actions">
          {!recovery && <button className="header-action-button" type="button" onClick={onBack}>Applicant upload</button>}
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </div>
      </header>
      <section className="auth-panel portal-panel">
        <p className="eyebrow">Recruiter access</p>
        <h2>{recovery ? "Set a new password" : showReset ? "Set or reset your password" : "Sign in to search profiles"}</h2>
        <p className="portal-help">
          {recovery ? "Choose a password for your recruiter account."
            : showReset ? "We’ll email a password link to an invited recruiter account."
              : "Recruiter accounts are invitation-only. Applicants can upload a resume without signing in."}
        </p>
        {!supabase && <p className="error-message" role="alert">Supabase isn’t configured in the frontend environment yet.</p>}
        <form onSubmit={submit} className="auth-form">
          {!recovery && (
            <label className="profile-edit-field profile-edit-field--wide">
              <span>Email</span>
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
          )}
          {!showReset && (
            <label className="profile-edit-field profile-edit-field--wide">
              <span>{recovery ? "New password" : "Password"}</span>
              <input type="password" autoComplete={recovery ? "new-password" : "current-password"} minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <div className="portal-actions">
            {!recovery && !resetSent && <button className="text-button" type="button" onClick={() => { setShowReset((current) => !current); setError(""); setMessage(""); }}>{showReset ? "Back to sign in" : "Set or reset password"}</button>}
            <button className="button" type="submit" disabled={busy || (!supabase) || (showReset && resetSent)}>
              {busy ? "Please wait…" : recovery ? "Update password" : showReset ? "Send password link" : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default RecruiterLogin;
