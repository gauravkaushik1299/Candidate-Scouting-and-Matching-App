export function calculateInterestScore(matchScore, candidate) {
  const experience = candidate.experience || 1;

  // 🔹 Base interest from match
  let baseInterest = matchScore * 0.7;

  // 🔹 Experience effect (more experienced = slightly less likely to be desperate)
  let experienceEffect = 0;
  if (experience >= 5) {
    experienceEffect = -5; // senior devs are selective
  } else if (experience <= 2) {
    experienceEffect = +5; // juniors more eager
  }

  // Stable simulated variation keeps repeated searches reproducible.
  const identity = String(candidate.id ?? candidate.email ?? candidate.name ?? "profile");
  let hash = 0;
  for (const character of identity) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  const randomness = Math.abs(hash) % 10;

  let interestScore = baseInterest + experienceEffect + randomness;

  // clamp between 0–100
  interestScore = Math.max(0, Math.min(interestScore, 100));

  // 🔹 Smarter explanation
  let explanation = "";

  if (interestScore > 75) {
    explanation = "Highly interested due to strong match";
  } else if (interestScore > 50) {
    explanation = "Moderately interested, decent alignment";
  } else {
    explanation = "Low interest due to weak match";
  }

  return {
    score: Math.round(interestScore),
    explanation,
  };
}

