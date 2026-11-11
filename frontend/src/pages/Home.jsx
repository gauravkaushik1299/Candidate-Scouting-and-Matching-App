import { useMemo, useState } from "react";
import axios from "axios";
import JDInput from "../components/JDInput";
import CandidateCard from "../components/CandidateCard";
import AgentSteps from "../components/AgentSteps";
import FilterSelect from "../components/FilterSelect";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../useTheme";

const PAGE_SIZE = 10;
const DEFAULT_PRIORITIES = { role: 14, skills: 56, experience: 30 };
const DEFAULT_FILTERS = { search: "", skill: "", role: "all", experience: "all" };

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://candidate-scouting-and-matching-app.onrender.com")
).replace(/\/$/, "");

function Home({ accessToken, onSignOut }) {
  const [results, setResults] = useState([]);
  const [criteria, setCriteria] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { darkMode, toggleTheme } = useTheme();

  const runAgent = async (jdText) => {
    if (!jdText.trim()) return;

    setLoading(true);
    setResults([]);
    setCriteria(null);
    setSourceMeta(null);
    setCurrentPage(1);
    setFilters(DEFAULT_FILTERS);
    setError(null);
    setHasRun(true);

    try {
      const res = await axios.post(`${API_URL}/run-agent`, {
        jobDescription: jdText,
      }, {
        timeout: 55000,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = res.data?.data;
      const raw = data?.candidates;
      const nextCriteria = data?.criteria || { role: null, skills: [], experience: null };
      const clean = Array.isArray(raw)
        ? raw.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            item.name
        ).map((candidate) => ({
          ...candidate,
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        }))
        : [];
      setCriteria(nextCriteria);
      setSourceMeta({
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
  const activePriorities = getPriorityPercentages(priorities, criteria);
  const prioritizedResults = useMemo(() => results
    .map((candidate) => ({ ...candidate, matchScore: getWeightedMatchScore(candidate, priorities) }))
    .sort((a, b) => b.matchScore - a.matchScore || Number(b.preferredFit) - Number(a.preferredFit) || (b.finalScore || 0) - (a.finalScore || 0)), [results, priorities]);
  const filteredResults = useMemo(() => prioritizedResults.filter((candidate) => {
    const search = filters.search.trim().toLowerCase();
    if (search && ![candidate.name, candidate.title, candidate.company, candidate.location].some((value) => value?.toLowerCase().includes(search))) return false;
    if (filters.skill && !candidate.skillMatches?.some((match) => match.requiredSkill === filters.skill && match.matchType !== "missing")) return false;
    if (filters.role === "match" && candidate.roleScore !== 100) return false;
    if (filters.role === "other" && candidate.roleScore === 100) return false;
    if (filters.experience !== "all") {
      const fit = getExperienceFit(candidate.experience, requiredExperience);
      if (filters.experience !== fit) return false;
    }
    return true;
  }), [prioritizedResults, filters, requiredExperience]);
  const pageCount = Math.ceil(filteredResults.length / PAGE_SIZE);
  const firstVisibleResult = (currentPage - 1) * PAGE_SIZE;
  const pageResults = filteredResults.slice(firstVisibleResult, firstVisibleResult + PAGE_SIZE);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const hasActiveFilters = filters.search || filters.skill || filters.role !== "all" || filters.experience !== "all";

  const goToPage = (page) => {
    setCurrentPage(page);
    setTimeout(() => document.querySelector(".results-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <main className="app-shell screen-transition">
      <header className="page-header">
        <img className="brand-mark" src="/favicon.svg?v=2" alt="" />
        <div>
          <p className="eyebrow">Candidate scouting</p>
          <h1>Candidate Scout</h1>
        </div>
        <div className="page-header__actions">
          <button className="header-action-button" type="button" onClick={onSignOut}>Sign out</button>
          <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
        </div>
      </header>

      <section className="intro-section">
        <p className="eyebrow">Find the right people</p>
        <h2>Turn a role description into a focused shortlist.</h2>
        <p className="intro-copy">Compare role, skill, and experience evidence against the requirements that matter for this role.</p>
      </section>

      <JDInput
        onSubmit={runAgent}
        loading={loading}
      />

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
            ? "No submitted profiles matched these requirements. Try adjusting the role, technologies, or experience threshold."
            : "Try adding the key technologies and experience level from the role description."}</p>
          {criteria && <CriteriaSummary criteria={criteria} />}
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
              <span className="result-count">{hasActiveFilters ? `${filteredResults.length} of ${results.length} profiles` : `${results.length} relevant profiles`}</span>
            </div>

            <CriteriaSummary criteria={criteria} />

            <section className="match-priorities" aria-labelledby="priority-title">
              <div className="match-priorities__heading">
                <div>
                  <h3 id="priority-title">Match priorities</h3>
                  <p>Change what matters most. Available weights are normalized to 100%.</p>
                </div>
                <button className="text-button" type="button" onClick={() => { setPriorities(DEFAULT_PRIORITIES); setCurrentPage(1); }}>Reset</button>
              </div>
              <div className="priority-controls">
                {[
                  { key: "skills", label: "Skills", available: requiredSkills.length > 0 },
                  { key: "role", label: "Role", available: Boolean(criteria?.role) },
                  { key: "experience", label: "Experience", available: requiredExperience != null },
                ].map(({ key, label, available }) => (
                  <div className={`priority-control ${available ? "" : "is-unavailable"}`} key={key}>
                    <div className="priority-control__heading">
                      <div className="priority-control__label">
                        <span>{label}</span>
                        <span className="priority-info">
                          <button className="priority-info__button" type="button" aria-label={`About ${label.toLowerCase()} priority`} aria-describedby={`priority-info-${key}`}>i</button>
                          <span className="priority-info__tooltip" id={`priority-info-${key}`} role="tooltip">
                            <strong>{label}</strong>
                            <span>{getPriorityExplanation(key)}</span>
                            <span className="priority-info__impact">{available
                              ? `Current influence: ${activePriorities[key]}% of this search’s adjustable score.`
                              : `No ${label.toLowerCase()} requirement was detected, so this factor is excluded.`}</span>
                          </span>
                        </span>
                      </div>
                      <strong>{available ? `${activePriorities[key]}%` : "Not specified"}</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={priorities[key]}
                      disabled={!available}
                      aria-label={`Set ${label.toLowerCase()} priority`}
                      onChange={(event) => { setPriorities((current) => ({ ...current, [key]: Number(event.target.value) })); setCurrentPage(1); }}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {sourceMeta?.source && (
            <p className="source-note">
              <span className="source-dot" />
              Supabase applicant profiles
              {sourceMeta.count != null && ` · ${sourceMeta.count} profiles`}
              {sourceMeta.refreshedAt && ` · updated ${new Date(sourceMeta.refreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
            </p>
          )}

          <section className="results-filters" aria-label="Filter candidate results">
            <label className="filter-search">
              <span>Search profiles</span>
              <input
                type="search"
                value={filters.search}
                placeholder="Name, title, company, or location"
                onChange={(event) => { setFilters((current) => ({ ...current, search: event.target.value })); setCurrentPage(1); }}
              />
            </label>
            <FilterSelect
              label="Required skill"
              value={filters.skill}
              disabled={!requiredSkills.length}
              options={[{ value: "", label: "Any skill" }, ...requiredSkills.map((skill) => ({ value: skill, label: skill }))]}
              onChange={(value) => { setFilters((current) => ({ ...current, skill: value })); setCurrentPage(1); }}
            />
            <FilterSelect
              label="Role fit"
              value={filters.role}
              disabled={!criteria?.role}
              options={[{ value: "all", label: "All titles" }, { value: "match", label: "Matches role" }, { value: "other", label: "Other titles" }]}
              onChange={(value) => { setFilters((current) => ({ ...current, role: value })); setCurrentPage(1); }}
            />
            <FilterSelect
              label="Experience"
              value={filters.experience}
              disabled={requiredExperience == null}
              options={[{ value: "all", label: "Any experience" }, { value: "match", label: "Meets requirement" }, { value: "other", label: "Outside requirement" }, { value: "unknown", label: "Not listed" }]}
              onChange={(value) => { setFilters((current) => ({ ...current, experience: value })); setCurrentPage(1); }}
            />
            {hasActiveFilters && <button className="text-button results-filters__clear" type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setCurrentPage(1); }}>Clear filters</button>}
          </section>

          {filteredResults.length > 0 ? (
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
          ) : (
            <div className="filter-empty-state" role="status">No profiles match these filters. Adjust or clear the filters to see candidates.</div>
          )}

          {pageCount > 1 && (
            <nav className="results-pagination" aria-label="Candidate result pages">
              <span className="results-pagination__status">
                Showing {firstVisibleResult + 1}–{Math.min(firstVisibleResult + PAGE_SIZE, filteredResults.length)} of {filteredResults.length}
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

function CriteriaSummary({ criteria }) {
  const requiredSkills = criteria?.skills || [];
  const requiredExperience = criteria?.experience;

  return (
    <div className="criteria-summary">
      <div className="criteria-summary__label">
        <span className="criteria-summary__icon" aria-hidden="true">⌕</span>
        <div>
          <strong>Search parameters · Gemini extracted</strong>
          <span>Detected from the submitted job description.</span>
        </div>
      </div>
      <div className="criteria-summary__values">
        {requiredSkills.map((skill) => <span className="criteria-tag" key={skill}>{skill}</span>)}
        {criteria?.role && <span className="criteria-tag" key="role">{criteria.role}</span>}
        {requiredExperience != null && <span className="criteria-tag criteria-tag--experience">{formatExperienceRequirement(requiredExperience)} years</span>}
      </div>
    </div>
  );
}

function getWeightedMatchScore(candidate, priorities) {
  const components = [
    { value: candidate.roleScore, weight: priorities.role },
    { value: candidate.skillScore, weight: priorities.skills },
    { value: candidate.experienceFit, weight: priorities.experience },
  ].filter(({ value, weight }) => value != null && weight > 0);
  const totalWeight = components.reduce((total, item) => total + item.weight, 0);
  if (!totalWeight) return Number(candidate.matchScore) || 0;
  return Math.round(components.reduce((total, item) => total + item.value * item.weight, 0) / totalWeight);
}

function getPriorityExplanation(key) {
  const explanations = {
    skills: "Compares the requested skills with skills listed on each profile. Exact and related matches contribute to skill coverage.",
    role: "Compares the requested role with each candidate’s current job title. Matching titles receive stronger role evidence.",
    experience: "Compares the experience requirement with each candidate’s listed years. Missing experience is left out of the score.",
  };
  return explanations[key];
}

function getPriorityPercentages(priorities, criteria) {
  const available = [
    ["role", Boolean(criteria?.role)],
    ["skills", Boolean(criteria?.skills?.length)],
    ["experience", criteria?.experience != null],
  ].filter(([, enabled]) => enabled).map(([key]) => key);
  if (!available.length) return { role: 0, skills: 0, experience: 0 };
  const total = available.reduce((sum, key) => sum + priorities[key], 0);
  if (!total) {
    const equal = Math.floor(100 / available.length);
    return Object.fromEntries(available.map((key, index) => [key, index === available.length - 1 ? 100 - equal * (available.length - 1) : equal]));
  }
  const percentages = Object.fromEntries(available.map((key) => [key, Math.round(priorities[key] / total * 100)]));
  const roundedTotal = available.reduce((sum, key) => sum + percentages[key], 0);
  percentages[available[available.length - 1]] += 100 - roundedTotal;
  return percentages;
}

function getExperienceFit(candidateExperience, requirement) {
  if (candidateExperience == null || requirement == null) return "unknown";
  const years = typeof requirement === "number" ? requirement : requirement.years;
  const operator = typeof requirement === "number" ? "gte" : requirement.operator;
  const matches = operator === "lt" ? candidateExperience < years
    : operator === "lte" ? candidateExperience <= years
      : operator === "gt" ? candidateExperience > years
        : candidateExperience >= years;
  return matches ? "match" : "other";
}

function formatExperienceRequirement(requirement) {
  if (typeof requirement === "number") return `${requirement}+`;
  const operator = { lt: "<", lte: "≤", gt: ">", gte: ">=" }[requirement.operator] || ">=";
  return `${operator}${requirement.years}`;
}

export default Home;

