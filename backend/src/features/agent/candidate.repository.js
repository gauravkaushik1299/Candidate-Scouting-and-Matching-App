import { supabaseAdmin } from "../../config/supabase.js";

const PROFILE_COLUMNS = "id, name, email, title, company, experience, location, skills, bio, work_mode, availability, created_at";
const PAGE_SIZE = 1000;

export async function loadCandidatePool() {
  if (!supabaseAdmin) {
    const error = new Error("Applicant profile storage is not configured on the server.");
    error.status = 503;
    throw error;
  }

  const candidates = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("candidate_profiles")
      .select(PROFILE_COLUMNS)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Could not load applicant profiles: ${error.message}`);
    const profiles = data || [];
    candidates.push(...profiles.map((profile) => ({
      ...profile,
      source: "applicant",
      workMode: profile.work_mode,
    })));
    if (profiles.length < PAGE_SIZE) break;
  }

  return {
    candidates,
    source: "supabase",
    refreshedAt: new Date().toISOString(),
  };
}
