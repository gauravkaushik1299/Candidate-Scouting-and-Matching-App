import { useState } from "react";

function Score({ label, value, tone = "blue" }) {
  const safeValue = Math.min(Math.max(Math.round(value ?? 0), 0), 100);

  return (
    <div className="score-meter">
      <div className="score-meter__label">
        <span>{label}</span>
        <strong>{safeValue}%</strong>
      </div>
      <div
        className="score-meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <span className={`score-meter__fill score-meter__fill--${tone}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function CandidateCard({ candidate, rank, requiredSkills = [], requiredExperience }) {
  const [flipped, setFlipped] = useState(false);
  if (!candidate) return null;

  const {
    name = "Unknown candidate",
    email,
    title,
    company,
    skills = [],
    bio,
    availability,
    workMode,
    matchScore = 0,
    skillScore,
    roleScore,
    criteriaFit,
    skillMatches,
    experience,
  } = candidate;

  const requirements = Array.isArray(skillMatches)
    ? skillMatches
    : requiredSkills.map((requiredSkill) => {
      const candidateSkill = skills.find(
        (skill) => skill.toLowerCase() === requiredSkill.toLowerCase(),
      );
      return {
        requiredSkill,
        candidateSkill: candidateSkill || null,
        matchType: candidateSkill ? "exact" : "missing",
      };
    });
  const matchedCount = requirements.filter((item) => item.matchType !== "missing").length;
  const requiredYears = typeof requiredExperience === "number" ? requiredExperience : requiredExperience?.years;
  const experienceOperator = typeof requiredExperience === "number" ? "gte" : requiredExperience?.operator;
  const experienceMatches = experience != null && requiredYears != null && (
    experienceOperator === "lt" ? experience < requiredYears
      : experienceOperator === "lte" ? experience <= requiredYears
        : experienceOperator === "gt" ? experience > requiredYears
          : experience >= requiredYears
  );

  return (
    <article className={`candidate-card ${rank === 1 ? "candidate-card--first" : ""} ${flipped ? "candidate-card--flipped" : ""}`}>
      <div className="candidate-card__inner">
        <div
          className="candidate-card__face candidate-card__front"
          role="button"
          tabIndex={flipped ? -1 : 0}
          inert={flipped}
          onClick={() => setFlipped(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setFlipped(true);
            }
          }}
          aria-label={`Show details for ${name}`}
          aria-pressed={flipped}
        >
          <div className="candidate-card__topline">
            {rank === 1 && criteriaFit !== false && <span className="candidate-best">Top match</span>}
            {criteriaFit === false && <span className="candidate-potential">Potential match</span>}
            <span className="flip-hint">View profile ↻</span>
          </div>

          <div className="candidate-match-heading">
            <div className="match-score" aria-label={`Overall match ${Math.round(matchScore)} percent`}>
              <strong>{Math.round(matchScore)}</strong>
              <span>match</span>
            </div>
            <div>
              <h3 className="candidate-card__name">{name}</h3>
              <p className="eyebrow">Match summary</p>
              <p className="candidate-match-subtitle">Evidence against this job description</p>
            </div>
          </div>

          {requirements.length > 0 && (
            <section className="requirement-section" aria-label="Required skill matches">
              <div className="section-label">
                <span>Required skills</span>
                <span className="coverage-count">{matchedCount}/{requirements.length} matched</span>
              </div>
              <div className="requirement-list">
                {requirements.map((item) => (
                  <span
                    key={item.requiredSkill}
                    className={`requirement-chip requirement-chip--${item.matchType}`}
                    title={item.candidateSkill ? `Profile skill: ${item.candidateSkill}` : "Not listed on this profile"}
                  >
                    <span aria-hidden="true">
                      {item.matchType === "missing" ? "–" : item.matchType === "partial" ? "≈" : "✓"}
                    </span>
                    {item.requiredSkill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="candidate-card__divider" />

          <div className="score-grid">
            {skillScore != null && <Score label="Skill coverage" value={skillScore} tone="teal" />}
            {roleScore != null && (
              <div className="experience-fit">
                <span className="score-meter__label">Candidate title</span>
                <strong className="fit-status">{title || "Not listed"}</strong>
              </div>
            )}
            {requiredExperience != null && (
              <div className="experience-fit">
                <span className="score-meter__label">Experience</span>
                <strong className="fit-status experience-value">
                  <span>{experience == null ? "Not listed" : `${experience} yrs`}</span>
                  {experienceMatches && <span className="experience-match-check" aria-label="Meets experience requirement" title="Meets experience requirement">✓</span>}
                </strong>
              </div>
            )}
          </div>

          <span className="candidate-card__prompt">Click to see candidate details</span>
        </div>

        <section
          className="candidate-card__face candidate-card__back"
          aria-label={`${name} candidate details`}
          aria-hidden={!flipped}
          inert={!flipped}
          onClick={(event) => {
            if (event.target.closest("a, button")) return;
            setFlipped(false);
          }}
        >
          <div className="candidate-back__header">
            <div className="candidate-avatar" aria-hidden="true">
              {name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="candidate-identity__main">
              <h3>{name}</h3>
            </div>
            <button className="flip-back-button" type="button" onClick={() => setFlipped(false)} aria-label="Return to match summary">↶</button>
          </div>

          <dl className="candidate-details">
            <div><dt>Email</dt><dd>{email ? <a href={`mailto:${email}`}>{email}</a> : "Not listed"}</dd></div>
            <div><dt>Current job title</dt><dd>{title || "Not listed"}</dd></div>
            <div><dt>Current company</dt><dd>{company || "Not listed"}</dd></div>
            <div><dt>Location</dt><dd>{candidate.location || "Not listed"}</dd></div>
            <div><dt>Experience</dt><dd>{experience == null ? "Not listed" : `${experience} years`}</dd></div>
            <div><dt>Availability</dt><dd>{availability || "Not listed"}</dd></div>
            {workMode && <div><dt>Work preference</dt><dd>{workMode}</dd></div>}
          </dl>

          <div className="candidate-back__section">
            <h4>Skills</h4>
            {skills.length > 0
              ? <div className="candidate-skill-list">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              : <p className="candidate-bio">No skills listed.</p>}
          </div>

          <div className="candidate-back__section candidate-back__bio">
            <h4>Bio</h4>
            <p className="candidate-bio">{bio || "No bio provided."}</p>
          </div>
          <button className="candidate-card__prompt candidate-card__prompt--back" type="button" onClick={() => setFlipped(false)}>Back to match summary</button>
        </section>
      </div>
    </article>
  );
}

export default CandidateCard;

