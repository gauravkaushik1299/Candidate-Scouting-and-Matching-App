import { useEffect, useState } from "react";
import axios from "axios";
import JDInput from "../components/JDInput";
import CandidateCard from "../components/CandidateCard";
import AgentSteps from "../components/AgentSteps";

const PAGE_SIZE = 10;

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://catalyst-project-zwhi.onrender.com")
).replace(/\/$/, "");

const SKILL_ALIASES = {
  "node.js": ["node.js", "node js", "node"],
  express: ["express", "express.js"],
  mongodb: ["mongodb", "mongo db", "mongo"],
  aws: ["aws", "amazon web services"],
  react: ["react", "react.js"],
  python: ["python"],
  typescript: ["typescript", "type script"],
  sql: ["sql", "postgresql", "mysql"],
  docker: ["docker"],
  java: ["java"],
};
const SKILL_LABELS = {
  "node.js": "Node.js",
  express: "Express",
  mongodb: "MongoDB",
  aws: "AWS",
  react: "React",
  python: "Python",
  typescript: "TypeScript",
  sql: "SQL",
  docker: "Docker",
  java: "Java",
};

function parseJobRequirements(text) {
  const hasPhrase = (phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
  };
  const skills = Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) => aliases.some(hasPhrase))
    .map(([skill]) => SKILL_LABELS[skill]);
  const roleAliases = [
    ["Full-Stack Engineer", ["full-stack", "full stack", "fullstack", "full-stack dev", "full stack dev", "fullstack dev"]],
    ["Backend Developer", ["backend", "back-end", "back end", "backend dev", "back-end dev"]],
    ["Frontend Developer", ["frontend", "front-end", "front end", "frontend dev", "front-end dev"]],
    ["DevOps Engineer", ["devops", "dev ops"]],
    ["Cloud Engineer", ["cloud engineer", "cloud developer"]],
    ["Data Engineer", ["data engineer", "data developer"]],
    ["QA Automation Engineer", ["qa automation engineer", "test automation engineer", "automation tester"]],
    ["Software Engineer", ["software engineer", "software developer"]],
    ["API Developer", ["api developer", "api engineer"]],
    ["Platform Engineer", ["platform engineer", "platform developer"]],
    ["Mobile Engineer", ["mobile engineer", "mobile developer"]],
    ["Engineering Lead", ["engineering lead", "engineering manager", "technical lead", "tech lead"]],
  ];
  const role = roleAliases.find(([, aliases]) => aliases.some(hasPhrase))?.[0] || null;
  const experienceMatch = text.match(/(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s*\+?\s*(?:years?|yrs?)/i);
  const wordNumbers = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const prefix = experienceMatch ? text.slice(Math.max(0, experienceMatch.index - 48), experienceMatch.index).toLowerCase() : "";
  let operator = "gte";
  if (/\b(less\s+than|less\s+that|under|below|fewer\s+than)\s*$/.test(prefix)) operator = "lt";
  else if (/\b(at\s+most|up\s+to|no\s+more\s+than|or\s+less)\s*$/.test(prefix)) operator = "lte";
  else if (/\b(more\s+than|over|greater\s+than)\s*$/.test(prefix)) operator = "gt";
  return {
    role,
    skills,
    experience: experienceMatch ? { years: Number.parseFloat(wordNumbers[experienceMatch[1].toLowerCase()] ?? experienceMatch[1]), operator } : null,
  };
}

function enrichLegacyCandidate(candidate, requiredSkills) {
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const skillMatches = requiredSkills.map((requiredSkill) => {
    const exact = skills.find((skill) => skill.toLowerCase() === requiredSkill.toLowerCase());
    const partial = exact || skills.find((skill) =>
      skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
      requiredSkill.toLowerCase().includes(skill.toLowerCase()),
    );
    return {
      requiredSkill,
      candidateSkill: partial || null,
      matchType: !partial ? "missing" : exact ? "exact" : "partial",
    };
  });
  const explanationExperience = candidate.explanation?.match(/Experience:\s*(\d+(?:\.\d+)?)\s*(?:yrs?|years?)/i);

  return {
    ...candidate,
    experience: candidate.experience ?? (explanationExperience ? Number.parseFloat(explanationExperience[1]) : null),
    skillMatches: candidate.skillMatches || skillMatches,
    skillScore: candidate.skillScore ?? (
      skillMatches.length
        ? Math.round(skillMatches.reduce((total, item) => total + (item.matchType === "exact" ? 1 : item.matchType === "partial" ? 0.5 : 0), 0) / skillMatches.length * 100)
        : null
    ),
  };
}

function Home() {
  const [results, setResults] = useState([]);
  const [criteria, setCriteria] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem("candidate-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem("candidate-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const runAgent = async (jdText) => {
    if (!jdText.trim()) return;

    setLoading(true);
    setResults([]);
    setCriteria(null);
    setSourceMeta(null);
    setCurrentPage(1);
    setError(null);
    setHasRun(true);

    try {
      const res = await axios.post(`${API_URL}/run-agent`, {
        jobDescription: jdText,
      });
      const data = res.data?.data;
      const raw = Array.isArray(data) ? data : data?.candidates;
      const nextCriteria = Array.isArray(data)
        ? parseJobRequirements(jdText)
        : data?.criteria || parseJobRequirements(jdText);
      const requiredSkills = nextCriteria?.skills || [];
      const clean = Array.isArray(raw)
        ? raw.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            item.name &&
            Array.isArray(item.skills)
        ).map((candidate) => enrichLegacyCandidate(candidate, requiredSkills))
        : [];
      setCriteria(nextCriteria);
      setSourceMeta(Array.isArray(data) ? null : {
        source: data?.source,
        count: data?.sourceCount,
        refreshedAt: data?.refreshedAt,
      });
      setResults(clean);
      setLoading(false);
      setTimeout(() => {
        document.querySelector(".results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("API Error:", err);
      setError(
        err.response?.data?.message ||
        "Could not reach the scouting service. Check that the backend is running and try again."
      );
      setLoading(false);
    }
  };

  const requiredSkills = criteria?.skills || [];
  const requiredExperience = criteria?.experience;
  const pageCount = Math.ceil(results.length / PAGE_SIZE);
  const firstVisibleResult = (currentPage - 1) * PAGE_SIZE;
  const pageResults = results.slice(firstVisibleResult, firstVisibleResult + PAGE_SIZE);
  const pageNumbers = getPageNumbers(currentPage, pageCount);

  const goToPage = (page) => {
    setCurrentPage(page);
    setTimeout(() => document.querySelector(".results-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">TS</div>
        <div>
          <p className="eyebrow">Candidate scouting</p>
          <h1>Candidate shortlist</h1>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setDarkMode((enabled) => !enabled)}
          aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
          aria-pressed={darkMode}
        >
          <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
          {darkMode ? "Dark mode" : "Light mode"}
        </button>
      </header>

      <section className="intro-section">
        <p className="eyebrow">Find the right people</p>
        <h2>Turn a role description into a focused shortlist.</h2>
        <p className="intro-copy">Compare role, skill, and experience evidence against the requirements that matter for this role.</p>
      </section>

      <JDInput onSubmit={runAgent} loading={loading} />

      {error && <p className="error-message" role="alert">{error}</p>}

      {loading && (
        <div className="loading-panel fade-in">
          <AgentSteps />
        </div>
      )}

      {hasRun && !loading && !error && results.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">⌕</span>
          <h2>No close matches yet</h2>
          <p>{requiredExperience != null
            ? `No profiles were found for the recognized criteria. Try using a job title, technologies, or an experience range from the sample data.`
            : "Try adding the key technologies and experience level from the role description."}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <section className="results-section" aria-labelledby="results-title">
          <div className="results-overview">
            <div className="results-heading">
              <div>
                <p className="eyebrow">Shortlist</p>
                <h2 id="results-title">Candidate matches</h2>
              </div>
              <span className="result-count">{results.length} relevant profiles</span>
            </div>

            <div className="criteria-summary">
              <div className="criteria-summary__label">
                <span className="criteria-summary__icon" aria-hidden="true">⌕</span>
                <div>
                  <strong>Role requirements</strong>
                  <span>Exact fits rank first; related profiles can appear as potential matches</span>
                </div>
              </div>
              <div className="criteria-summary__values">
                {requiredSkills.map((skill) => <span className="criteria-tag" key={skill}>{skill}</span>)}
                {criteria?.role && <span className="criteria-tag" key="role">{criteria.role}</span>}
                {requiredExperience != null && <span className="criteria-tag criteria-tag--experience">{formatExperienceRequirement(requiredExperience)} years</span>}
              </div>
            </div>
          </div>

          {sourceMeta?.source && (
            <p className="source-note">
              <span className="source-dot" />
              Local sample data
              {sourceMeta.count != null && ` · ${sourceMeta.count} profiles with skill data`}
              {sourceMeta.refreshedAt && ` · updated ${new Date(sourceMeta.refreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
            </p>
          )}

          <div className="grid">
            {pageResults.map((candidate, index) => (
              <CandidateCard
                key={candidate.id ?? `${candidate.name}-${index}`}
                candidate={candidate}
                rank={firstVisibleResult + index + 1}
                requiredSkills={requiredSkills}
                requiredExperience={requiredExperience}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <nav className="results-pagination" aria-label="Candidate result pages">
              <span className="results-pagination__status">
                Showing {firstVisibleResult + 1}–{Math.min(firstVisibleResult + PAGE_SIZE, results.length)} of {results.length}
              </span>
              <div className="results-pagination__controls">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
                {pageNumbers.map((page, index) => page == null
                  ? <span className="results-pagination__ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
                  : (
                    <button
                      type="button"
                      key={page}
                      className={page === currentPage ? "is-active" : ""}
                      aria-current={page === currentPage ? "page" : undefined}
                      aria-label={`Page ${page}`}
                      onClick={() => goToPage(page)}
                    >{page}</button>
                  ))}
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>Next</button>
              </div>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 1) return pageCount === 1 ? [1] : [];

  const start = Math.max(2, currentPage - 2);
  const end = Math.min(pageCount - 1, currentPage + 2);
  const pages = [1];

  if (start > 2) pages.push(null);
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < pageCount - 1) pages.push(null);
  pages.push(pageCount);
  return pages;
}

function formatExperienceRequirement(requirement) {
  if (typeof requirement === "number") return `${requirement}+`;
  const operator = { lt: "<", lte: "≤", gt: ">", gte: ">=" }[requirement.operator] || ">=";
  return `${operator}${requirement.years}`;
}

export default Home;

