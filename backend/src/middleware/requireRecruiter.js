import { supabaseAdmin } from "../config/supabase.js";

export async function requireRecruiter(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ success: false, message: "Recruiter authentication is not configured on the server." });
  }

  const authorization = req.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Sign in as a recruiter to search candidate profiles." });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user || data.user.is_anonymous) {
      return res.status(401).json({ success: false, message: "Your recruiter session is invalid or expired. Please sign in again." });
    }
    req.recruiter = data.user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Could not verify your recruiter session." });
  }
}
