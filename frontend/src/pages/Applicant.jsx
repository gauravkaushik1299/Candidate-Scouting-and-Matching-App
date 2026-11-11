import { useState } from "react";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../useTheme";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://candidate-scouting-and-matching-app.onrender.com")
).replace(/\/$/, "");

const EMPTY_PROFILE = {
  name: "",
  email: "",
  title: "",
  company: "",
  experience: "",
  location: "",
  skills: [],
  bio: "",
  workMode: "Not specified",
  availability: "Not specified",
  extractionDetails: {},
};

function Applicant({ onRecruiter }) {
  const { darkMode, toggleTheme } = useTheme();
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [profile, setProfile] = useState(null);
  const [skillsText, setSkillsText] = useState("");
  const [savedProfile, setSavedProfile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const extract = async (event) => {
    event.preventDefault();
    if (!file || !consent) return;

    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("consent", "true");

    try {
      const response = await axios.post(`${API_URL}/applicant/extract`, formData, { timeout: 55000 });
      const extracted = { ...EMPTY_PROFILE, ...response.data.data.profile };
      setProfile(extracted);
      setSkillsText((extracted.skills || []).join(", "));
      setFile(null);
      event.target.reset();
    } catch (requestError) {
      setError(requestError.response?.data?.message || (requestError.code === "ECONNABORTED"
        ? "The request took too long. Please try again with a smaller or text-based resume."
        : "Could not process that resume. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }));

  const submitProfile = async () => {
    setBusy(true);
    setError("");
    const reviewedProfile = {
      ...profile,
      skills: [...new Set(skillsText.split(",").map((skill) => skill.trim()).filter(Boolean))],
      experience: profile.experience === "" ? null : Number(profile.experience),
    };
    try {
      const response = await axios.post(`${API_URL}/applicant/submit`, { consent: true, profile: reviewedProfile });
      setSavedProfile(response.data.data.profile);
      setProfile(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not submit the profile. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell portal-shell screen-transition">
      <header className="page-header">
        <img className="brand-mark" src="/favicon.svg?v=2" alt="" />
        <div>
          <p className="eyebrow">Candidate scouting</p>
          <h1>Share your experience</h1>
        </div>
        <div className="page-header__actions">
          <button className="header-action-button" type="button" onClick={onRecruiter}>Recruiter sign in</button>
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </div>
      </header>

      <section className="intro-section">
        <p className="eyebrow">Applicant profile</p>
        <h2>Turn your resume into a searchable profile.</h2>
        <p className="intro-copy">Upload a resume, review the details we extract, and choose whether to share your profile with recruiters.</p>
      </section>

      {savedProfile ? (
        <section className="portal-panel applicant-success" role="status">
          <span className="applicant-success__icon" aria-hidden="true">✓</span>
          <p className="eyebrow">Profile submitted</p>
          <h2>Thank you, {savedProfile.name}.</h2>
          <p>Your reviewed profile is now available for recruiter searches. The uploaded resume file was discarded after extraction.</p>
          <CandidateProfile profile={savedProfile} />
          <button className="button" type="button" onClick={() => { setSavedProfile(null); setConsent(false); }}>Submit another resume</button>
        </section>
      ) : profile ? (
        <section className="portal-panel">
          <div className="portal-panel__heading">
            <div>
              <p className="eyebrow">Review before sharing</p>
              <h2>Check the extracted details</h2>
            </div>
            <span className="review-badge">AI extracted · please verify</span>
          </div>
          <p className="portal-help">Correct anything the extraction missed. Only submit when the profile looks right.</p>
          <div className="profile-edit-grid">
            <ProfileField label="Name" value={profile.name} onChange={(value) => updateProfile("name", value)} required />
            <ProfileField label="Email" value={profile.email} onChange={(value) => updateProfile("email", value)} type="email" />
            <ProfileField label="Current job title" value={profile.title} onChange={(value) => updateProfile("title", value)} />
            <ProfileField label="Current company" value={profile.company} onChange={(value) => updateProfile("company", value)} />
            <ProfileField label="Experience (years)" value={profile.experience ?? ""} onChange={(value) => updateProfile("experience", value)} type="number" min="0" max="80" step="0.1" />
            <ProfileField label="Location" value={profile.location} onChange={(value) => updateProfile("location", value)} />
            <ProfileField label="Work preference" value={profile.workMode} onChange={(value) => updateProfile("workMode", value)} />
            <ProfileField label="Availability" value={profile.availability} onChange={(value) => updateProfile("availability", value)} />
            <label className="profile-edit-field profile-edit-field--wide">
              <span>Skills (comma separated)</span>
              <input value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />
            </label>
            <label className="profile-edit-field profile-edit-field--wide">
              <span>Professional summary</span>
              <textarea rows="4" value={profile.bio} onChange={(event) => updateProfile("bio", event.target.value)} />
            </label>
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="portal-actions">
            <button className="secondary-button" type="button" disabled={busy} onClick={() => { setProfile(null); setFile(null); }}>Start over</button>
            <button className="button" type="button" disabled={busy || !profile.name.trim()} onClick={submitProfile}>
              {busy ? "Submitting…" : "Submit reviewed profile"}
            </button>
          </div>
        </section>
      ) : (
        <form className="portal-panel resume-upload-form" onSubmit={extract}>
          <div className="portal-panel__heading">
            <div>
              <p className="eyebrow">Resume upload</p>
              <h2>Start with your resume</h2>
            </div>
            <span className="upload-type-note">PDF, DOCX, or TXT · up to 8 MB</span>
          </div>
          <label className="resume-dropzone">
            <span className="resume-dropzone__icon" aria-hidden="true">↑</span>
            <strong>{file ? file.name : "Choose a resume to upload"}</strong>
            <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Select a PDF, Word document, or text file from your device."}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="consent-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I agree to send my resume to Google Gemini for information extraction. I’ll review the extracted profile before sharing it with recruiters. This app does not store the original file; only the profile I submit is stored. Google’s data handling depends on the API plan in use.</span>
          </label>
          <p className="portal-help resume-upload-form__account-note">You don’t need to create an account.</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="portal-actions">
            <button className="button" type="submit" disabled={!file || !consent || busy}>
              {busy ? "Reading resume…" : "Extract profile"}
              {!busy && <span className="button-arrow" aria-hidden="true">→</span>}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function ProfileField({ label, value, onChange, type = "text", ...inputProps }) {
  return (
    <label className="profile-edit-field">
      <span>{label}</span>
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...inputProps} />
    </label>
  );
}

function CandidateProfile({ profile }) {
  return (
    <div className="submitted-profile-card">
      <div className="submitted-profile-card__heading">
        <div className="candidate-avatar" aria-hidden="true">{profile.name?.slice(0, 2).toUpperCase() || "CA"}</div>
        <div><h3>{profile.name}</h3><p>{profile.title || "Title not listed"}{profile.company ? ` · ${profile.company}` : ""}</p></div>
      </div>
      <dl>
        <div><dt>Email</dt><dd>{profile.email || "Not listed"}</dd></div>
        <div><dt>Location</dt><dd>{profile.location || "Not listed"}</dd></div>
        <div><dt>Experience</dt><dd>{profile.experience == null ? "Not listed" : `${profile.experience} years`}</dd></div>
        <div><dt>Availability</dt><dd>{profile.availability || "Not specified"}</dd></div>
      </dl>
      <div className="submitted-profile-card__skills"><strong>Skills</strong><div>{(profile.skills || []).map((skill) => <span className="criteria-tag" key={skill}>{skill}</span>)}</div></div>
      {profile.bio && <p className="submitted-profile-card__bio">{profile.bio}</p>}
    </div>
  );
}

export default Applicant;
