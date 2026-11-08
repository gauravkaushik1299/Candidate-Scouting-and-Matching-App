export function calculateMatchScore(candidate, jd) {
  const jdSkills = jd.skills || [];
  const experienceRequirement = jd.experience;
  const requiredExp = typeof experienceRequirement === "number" ? experienceRequirement : experienceRequirement?.years;

  const candidateSkills = candidate.skills || [];

  let matchedSkills = [];
  let partialMatches = [];

  // 🔹 Smart skill matching (exact + partial)
  for (const jdSkill of jdSkills) {
    const jdLower = jdSkill.toLowerCase();

    const exact = candidateSkills.find((s) => s.toLowerCase() === jdLower);

    if (exact) {
      matchedSkills.push(exact);
    } else {
      // partial match (Node vs Node.js, Mongo vs MongoDB)
      const partial = candidateSkills.find(
        (s) =>
          s.toLowerCase().includes(jdLower) ||
          jdLower.includes(s.toLowerCase()),
      );

      if (partial) {
        partialMatches.push(partial);
      }
    }
  }

  // Exact matches count fully; related skill names count as partial evidence.
  const skillMatches = jdSkills.map((requiredSkill) => {
    const exact = candidateSkills.find(
      (skill) => skill.toLowerCase() === requiredSkill.toLowerCase(),
    );
    if (exact) return { requiredSkill, candidateSkill: exact, matchType: "exact" };

    const partial = candidateSkills.find(
      (skill) =>
        skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
        requiredSkill.toLowerCase().includes(skill.toLowerCase()),
    );
    return partial
      ? { requiredSkill, candidateSkill: partial, matchType: "partial" }
      : { requiredSkill, candidateSkill: null, matchType: "missing" };
  });

  const skillMatchRatio =
    (matchedSkills.length + partialMatches.length * 0.5) / (jdSkills.length || 1);
  const skillScore = jdSkills.length ? Math.round(skillMatchRatio * 100) : null;
  const candidateTitle = (candidate.title || "").toLowerCase();
  const roleMatchers = {
    "Full-Stack Engineer": /\bfull[\s-]?stack\b/,
    "Backend Developer": /\bback[\s-]?end\b/,
    "Frontend Developer": /\bfront[\s-]?end\b/,
    "DevOps Engineer": /\bdev\s*ops\b/,
    "Cloud Engineer": /\bcloud\b/,
    "Data Engineer": /\bdata\b/,
    "QA Automation Engineer": /\b(qa|test|automation)\b/,
    "Software Engineer": /\b(software|developer)\b/,
    "API Developer": /\bapi\b/,
    "Platform Engineer": /\bplatform\b/,
    "Mobile Engineer": /\bmobile\b/,
    "Engineering Lead": /\b(lead|manager)\b/,
  };
  const roleMatch = !jd.role || Boolean(roleMatchers[jd.role]?.test(candidateTitle));
  const roleScore = jd.role == null ? null : roleMatch ? 100 : 0;

  // 🔹 Experience scoring (realistic)
  let experienceScore = null;
  let experienceMatches = null;

  if (requiredExp != null && candidate.experience != null) {
    const operator = typeof experienceRequirement === "number" ? "gte" : experienceRequirement.operator;
    const fits = operator === "lt" ? candidate.experience < requiredExp
      : operator === "lte" ? candidate.experience <= requiredExp
        : operator === "gt" ? candidate.experience > requiredExp
          : candidate.experience >= requiredExp;
    experienceScore = fits ? 1 : Math.max(0, 1 - Math.abs(candidate.experience - requiredExp) / Math.max(requiredExp, 1));
    experienceMatches = fits;
  }

  // 🔹 Bonus logic (top candidates stand out)
  let bonus = 0;

  if (jdSkills.length > 0 && matchedSkills.length === jdSkills.length) {
    bonus += 5; // perfect skill match
  }

  if (requiredExp != null && (!experienceRequirement?.operator || experienceRequirement.operator === "gte") && candidate.experience > requiredExp + 2) {
    bonus += 5; // strong experience
  }

  // Keep the criteria scores visible so the overall score can be explained.
  const evidenceScore = jdSkills.length > 0
    ? skillMatchRatio * 100 * (jd.role ? 0.8 : 1) + (jd.role ? roleScore * 0.2 : 0)
    : roleScore;
  const weightedScore = requiredExp == null
    ? evidenceScore
    : evidenceScore * 0.7 + (experienceScore ?? 0) * 30;
  const matchScore = Math.min(Math.round(weightedScore + bonus), 100);
  const experienceFit = experienceScore == null ? null : Math.round(experienceScore * 100);

  return {
    score: matchScore,
    skillScore,
    roleScore,
    roleMatch,
    experienceMatches,
    experienceFit,
    matchedSkills,
    partialMatches,
    skillMatches,
    explanation: `
      Exact matches: ${matchedSkills.length},
      Partial matches: ${partialMatches.length},
      ${requiredExp == null ? "Experience requirement not specified" : `Experience: ${candidate.experience} yrs vs ${formatExperienceRequirement(experienceRequirement)} required`}
    `,
  };
}

function formatExperienceRequirement(requirement) {
  if (typeof requirement === "number") return `${requirement}+`;
  const operator = { lt: "<", lte: "≤", gt: ">", gte: ">=" }[requirement.operator] || ">=";
  return `${operator}${requirement.years}`;
}

