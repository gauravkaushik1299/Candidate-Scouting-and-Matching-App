export function calculateFinalScore(matchScore, interestScore) {
  const finalScore = matchScore * 0.7 + interestScore * 0.3;

  return Math.min(Math.round(finalScore), 100);
}

export function rankCandidates(candidates) {
  return candidates
    .sort((a, b) => Number(b.preferredFit) - Number(a.preferredFit) || b.finalScore - a.finalScore);
}

