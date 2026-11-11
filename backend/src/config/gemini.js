const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;

export async function fetchGemini(url, options) {
  const signal = AbortSignal.timeout(GEMINI_TIMEOUT_MS);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { ...options, signal });
    if (response.status !== 503 || attempt === 1) return response;
    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}
