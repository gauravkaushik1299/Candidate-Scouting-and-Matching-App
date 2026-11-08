import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "../../data/candidates.json");

export async function loadCandidatePool() {
  const candidates = JSON.parse(await readFile(jsonPath, "utf8"));
  return {
    candidates,
    source: "json",
    refreshedAt: new Date().toISOString(),
  };
}

