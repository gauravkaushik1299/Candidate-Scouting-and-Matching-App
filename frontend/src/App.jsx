import { useEffect, useState } from "react";
import Applicant from "./pages/Applicant";
import Home from "./pages/Home";
import RecruiterLogin from "./pages/RecruiterLogin";
import { supabase } from "./supabase";

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [view, setView] = useState(() => window.localStorage.getItem("candidate-last-workspace") === "recruiter" ? "recruiter" : "applicant");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setView("recovery");
      if (event === "SIGNED_IN") window.localStorage.setItem("candidate-last-workspace", "recruiter");
      if (event === "SIGNED_OUT") setView("recruiter");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) return <main className="app-shell portal-shell"><p className="portal-help">Loading…</p></main>;
  if (view === "recovery") return <RecruiterLogin recovery onPasswordUpdated={() => setView("recruiter")} />;
  if (session) {
    return <Home accessToken={session.access_token} onSignOut={() => supabase.auth.signOut()} />;
  }
  if (view === "applicant") return <Applicant onRecruiter={() => { window.localStorage.setItem("candidate-last-workspace", "recruiter"); setView("recruiter"); }} />;
  return <RecruiterLogin onBack={() => { window.localStorage.removeItem("candidate-last-workspace"); setView("applicant"); }} />;
}

export default App;
