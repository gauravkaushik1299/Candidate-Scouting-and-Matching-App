import { runAgent } from "./agent.service.js";
import { loadCandidatePool } from "./candidate.repository.js";

export async function runAgentController(req, res) {
  try {
    const { jobDescription } = req.body;

    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    // Simple JD parsing (basic version)
    const jd = parseJD(jobDescription);
    if (jd.skills.length === 0 && !jd.role && !jd.experience) {
      return res.status(422).json({
        success: false,
        message: "Add a recognized job title or skills such as React, Node.js, Python, SQL, AWS, or MongoDB.",
      });
    }

    const pool = await loadCandidatePool();
    const result = runAgent(jd, pool.candidates);

    return res.json({
      success: true,
      data: {
        criteria: {
          role: jd.role,
          skills: jd.skills,
          experience: jd.experience,
        },
        candidates: result,
        source: pool.source,
        sourceCount: pool.candidates.length,
        refreshedAt: pool.refreshedAt,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
}

// Basic parser (can upgrade later with LLM)
function parseJD(text) {
  const roles = [
    { role: "Full-Stack Engineer", aliases: ["full-stack", "full stack", "fullstack", "full-stack dev", "full stack dev", "fullstack dev"] },
    { role: "Backend Developer", aliases: ["backend", "back-end", "back end", "backend dev", "back-end dev"] },
    { role: "Frontend Developer", aliases: ["frontend", "front-end", "front end", "frontend dev", "front-end dev"] },
    { role: "DevOps Engineer", aliases: ["devops", "dev ops"] },
    { role: "Cloud Engineer", aliases: ["cloud engineer", "cloud developer"] },
    { role: "Data Engineer", aliases: ["data engineer", "data developer"] },
    { role: "QA Automation Engineer", aliases: ["qa automation engineer", "test automation engineer", "automation tester"] },
    { role: "Software Engineer", aliases: ["software engineer", "software developer"] },
    { role: "API Developer", aliases: ["api developer", "api engineer"] },
    { role: "Platform Engineer", aliases: ["platform engineer", "platform developer"] },
    { role: "Mobile Engineer", aliases: ["mobile engineer", "mobile developer"] },
    { role: "Engineering Lead", aliases: ["engineering lead", "engineering manager", "technical lead", "tech lead"] },
  ];
  const skillsMap = {
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

  const normalizedText = text.toLowerCase();
  const hasPhrase = (phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(normalizedText);
  };

  const skillLabels = {
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
  const skills = Object.keys(skillsMap)
    .filter((skill) => skillsMap[skill].some(hasPhrase))
    .map((skill) => skillLabels[skill]);
  const role = roles.find(({ aliases }) => aliases.some(hasPhrase))?.role || null;

  const expMatch = text.match(/(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s*\+?\s*(?:years?|yrs?)/i);
  const wordNumbers = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const years = expMatch ? Number.parseFloat(wordNumbers[expMatch[1].toLowerCase()] ?? expMatch[1]) : null;
  const prefix = expMatch ? text.slice(Math.max(0, expMatch.index - 48), expMatch.index).toLowerCase() : "";
  let operator = "gte";
  if (/\b(less\s+than|less\s+that|under|below|fewer\s+than)\s*$/.test(prefix)) operator = "lt";
  else if (/\b(at\s+most|up\s+to|no\s+more\s+than|or\s+less)\s*$/.test(prefix)) operator = "lte";
  else if (/\b(more\s+than|over|greater\s+than)\s*$/.test(prefix)) operator = "gt";
  const experience = years == null ? null : { years, operator };

  return { role, skills, experience };
}

