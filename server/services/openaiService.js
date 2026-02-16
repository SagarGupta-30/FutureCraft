const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ROLE_SKILL_MAP = {
  "Software Engineer": [
    "Data Structures and Algorithms",
    "System Design Basics",
    "Backend Development with Node.js",
    "SQL and Database Design",
    "Testing and Debugging"
  ],
  "Data Scientist": [
    "Python for Data Analysis",
    "Statistics and Probability",
    "Machine Learning Fundamentals",
    "SQL for Analytics",
    "Data Visualization"
  ],
  "AI/ML Engineer": [
    "Deep Learning Fundamentals",
    "Model Deployment",
    "Python and PyTorch/TensorFlow",
    "MLOps Basics",
    "Feature Engineering"
  ],
  "Product Manager": [
    "Product Thinking",
    "User Research",
    "Metrics and Analytics",
    "Roadmapping",
    "Stakeholder Communication"
  ],
  "Cybersecurity Engineer": [
    "Network Security Basics",
    "OWASP Top 10",
    "Threat Modeling",
    "Linux and Scripting",
    "Security Monitoring"
  ],
};

function formatSkills(skillsText) {
  return skillsText
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(", ");
}

function buildPrompt(student) {
  return `Create a personalized career roadmap for this student profile.

Student Data:
- Name: ${student.name}
- Branch: ${student.branch}
- Year: ${student.year}
- Target Role: ${student.targetRole}
- Target Company: ${student.targetCompany}
- Current Skills: ${formatSkills(student.currentSkills)}
- Experience Level: ${student.experienceLevel}

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown, code fences, or explanation text.
3. Keep content practical and student-friendly.
4. Include exactly these keys: skills, projects, certifications, interview_prep, timeline.
5. Every key must map to an array of concise strings.
6. Timeline must represent a 6-month plan in ordered actionable points.

JSON format:
{
  "skills": [],
  "projects": [],
  "certifications": [],
  "interview_prep": [],
  "timeline": []
}`;
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

function normalizeRoadmap(data) {
  // Normalize model output to predictable arrays for every section.
  return {
    skills: toStringArray(data.skills),
    projects: toStringArray(data.projects),
    certifications: toStringArray(data.certifications),
    interview_prep: toStringArray(data.interview_prep),
    timeline: toStringArray(data.timeline),
  };
}

function hasValidApiKey(apiKey) {
  if (!apiKey) {
    return false;
  }

  if (
    apiKey.includes("your_openai") ||
    apiKey === "sk-..." ||
    apiKey === "sk-REPLACE_WITH_REAL_KEY" ||
    apiKey.endsWith("...")
  ) {
    return false;
  }

  return apiKey.startsWith("sk-");
}

function normalizeInputSkills(skillsText) {
  return String(skillsText || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function uniqueByLowerCase(values) {
  const seen = new Set();
  const output = [];

  values.forEach((value) => {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  });

  return output;
}

function buildLocalRoadmap(student) {
  const currentSkills = normalizeInputSkills(student.currentSkills);
  const skillSet = new Set(currentSkills.map((skill) => skill.toLowerCase()));
  const roleSkills = ROLE_SKILL_MAP[student.targetRole] || ROLE_SKILL_MAP["Software Engineer"];

  const suggestedSkills = roleSkills.filter((skill) => !skillSet.has(skill.toLowerCase()));
  const finalSkills = uniqueByLowerCase([
    ...suggestedSkills,
    "Communication and teamwork",
    "Resume and LinkedIn optimization",
  ]).slice(0, 6);

  const projects = [
    `Build one ${student.targetRole} portfolio project aligned to ${student.targetCompany} style interviews.`,
    `Create a branch-focused project (${student.branch}) and deploy it publicly with documentation.`,
    "Publish 2 mini-projects with clean README, screenshots, and architecture notes.",
    "Add tests, CI checks, and versioned releases to one capstone project.",
  ];

  const certifications = [
    "Google Career Certificate (role relevant track)",
    "Coursera or edX specialization matching your target role",
    "One cloud fundamentals certificate (AWS/Azure/GCP)",
  ];

  const interviewPrep = [
    "Practice 4-5 DSA/interview questions weekly and track weak topics.",
    "Do 1 mock interview every week (peer or platform-based).",
    "Prepare concise stories for projects, challenges, and impact.",
    `Create a target-company prep sheet for ${student.targetCompany}: rounds, topics, and timelines.`,
  ];

  const timeline = [
    "Month 1: Strengthen fundamentals and complete one guided course.",
    "Month 2: Build Project 1 and publish with clean documentation.",
    "Month 3: Build Project 2 and start mock interview practice.",
    "Month 4: Complete certification and refine resume/GitHub profile.",
    "Month 5: Intensive interview prep with role-focused problem sets.",
    `Month 6: Apply strategically to internships/jobs at ${student.targetCompany} and similar companies.`,
  ];

  return {
    skills: finalSkills,
    projects,
    certifications,
    interview_prep: interviewPrep,
    timeline,
  };
}

function parseRoadmapJson(rawContent) {
  try {
    return JSON.parse(rawContent);
  } catch (error) {
    // Fallback: recover first JSON object if model prepends text unexpectedly.
    const objectMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error("OpenAI returned malformed JSON");
    }

    return JSON.parse(objectMatch[0]);
  }
}

async function buildRoadmap(studentData) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();

  if (!hasValidApiKey(apiKey)) {
    console.warn("Using local roadmap fallback (missing/invalid OPENAI_API_KEY).");
    return buildLocalRoadmap(studentData);
  }

  const systemPrompt =
    "You are an expert career mentor and technical roadmap planner for engineering students.";

  try {
    // Force JSON output so frontend can directly render roadmap sections.
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildPrompt(studentData) },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = parseRoadmapJson(rawContent);

    return normalizeRoadmap(parsed);
  } catch (error) {
    console.error(`OpenAI roadmap generation failed (${error.message}). Using local fallback.`);
    return buildLocalRoadmap(studentData);
  }
}

module.exports = { buildRoadmap };
