import { calculateMatchScore } from "./match.engine.js";
import { calculateInterestScore } from "./interest.engine.js";
import { calculateFinalScore, rankCandidates } from "./ranking.engine.js";

export function runAgent(jd, candidatesData) {
  const results = [];
  const requirement = jd.experience;
  const requiredYears = typeof requirement === "number" ? requirement : requirement?.years;

  for (const candidate of candidatesData) {
    const match = calculateMatchScore(candidate, jd);

    const skillMatchRatio =
      (match.matchedSkills.length + match.partialMatches.length * 0.5) /
      (jd.skills.length || 1);
    const minRelevantSkillCoverage = jd.skills.length >= 3 ? 0.4 : jd.skills.length > 0 ? 0.6 : 0;
    const enoughSkillEvidence = jd.skills.length === 0 || skillMatchRatio >= minRelevantSkillCoverage;
    const skillsFit = jd.skills.length === 0 || skillMatchRatio >= 0.85;
    const roleFit = !jd.role || match.roleMatch;
    const experienceFit = requiredYears == null
      ? true
      : match.experienceMatches === true;
    const preferredFit = roleFit && experienceFit && enoughSkillEvidence;
    const criteriaFit = skillsFit && roleFit && experienceFit;

    const hasRoleEvidence = Boolean(jd.role && match.roleMatch);
    const candidateExperience = candidate.experience;
    const experienceTolerance = requiredYears == null ? null : Math.max(1, requiredYears * 0.5);
    const hasExperienceEvidence = requiredYears != null && candidateExperience != null && (
      match.experienceMatches === true || Math.abs(candidateExperience - requiredYears) <= experienceTolerance
    );
    const skillEvidenceThreshold = jd.skills.length >= 3 ? 0.4 : 0.25;
    const hasSkillEvidence = jd.skills.length > 0 && skillMatchRatio >= skillEvidenceThreshold;
    const requestedCriteriaCount = Number(Boolean(jd.role)) + Number(jd.skills.length > 0) + Number(requiredYears != null);
    const matchedCriteriaCount = Number(hasRoleEvidence) + Number(hasSkillEvidence) + Number(hasExperienceEvidence);
    const strongSkillEvidence = jd.skills.length > 0 && skillMatchRatio >= 0.75;
    const relevant = requestedCriteriaCount === 1
      ? matchedCriteriaCount > 0
      : matchedCriteriaCount >= 2 || strongSkillEvidence;
    if (!relevant) continue;

    const interest = calculateInterestScore(match.score, candidate);

    const finalScore = calculateFinalScore(match.score, interest.score);

    results.push({
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      title: candidate.title,
      company: candidate.company,
      skills: candidate.skills,
      experience: candidate.experience,
      location: candidate.location,
      bio: candidate.bio,
      availability: candidate.availability,
      workMode: candidate.workMode,
      matchScore: match.score,
      skillScore: match.skillScore,
      roleScore: match.roleScore,
      preferredFit,
      criteriaFit,
      bio: candidate.bio,
      experienceFit: match.experienceFit,
      skillMatches: match.skillMatches,
      interestScore: interest.score,
      finalScore,
      explanation: `${match.explanation}, ${interest.explanation}`,
    });
  }

  return rankCandidates(results);
}

