const roadmapForm = document.getElementById("roadmapForm");
const loadingOverlay = document.getElementById("loadingOverlay");
const generateBtn = document.getElementById("generateBtn");
const formError = document.getElementById("formError");

const ROLE_SKILL_MAP = {
  "Software Engineer": [
    "Data Structures and Algorithms",
    "System Design Basics",
    "Backend Development with Node.js",
    "SQL and Database Design",
    "Testing and Debugging",
  ],
  "Data Scientist": [
    "Python for Data Analysis",
    "Statistics and Probability",
    "Machine Learning Fundamentals",
    "SQL for Analytics",
    "Data Visualization",
  ],
  "AI/ML Engineer": [
    "Deep Learning Fundamentals",
    "Model Deployment",
    "Python and PyTorch/TensorFlow",
    "MLOps Basics",
    "Feature Engineering",
  ],
  "Product Manager": [
    "Product Thinking",
    "User Research",
    "Metrics and Analytics",
    "Roadmapping",
    "Stakeholder Communication",
  ],
  "Cybersecurity Engineer": [
    "Network Security Basics",
    "OWASP Top 10",
    "Threat Modeling",
    "Linux and Scripting",
    "Security Monitoring",
  ],
};

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return "";
  }
  return baseUrl.replace(/\/+$/, "");
}

function buildApiBaseCandidates() {
  const candidates = [];
  const explicitBase = normalizeBaseUrl(window.localStorage.getItem("SKILLSPRINT_API_BASE"));
  const isFileProtocol = window.location.protocol === "file:";

  if (explicitBase) {
    candidates.push(explicitBase);
  }

  if (!isFileProtocol) {
    candidates.push("");
  }

  candidates.push("http://localhost:5000");
  candidates.push("http://127.0.0.1:5000");
  candidates.push("http://localhost:5001");
  candidates.push("http://127.0.0.1:5001");
  candidates.push("http://localhost:5050");
  candidates.push("http://127.0.0.1:5050");
  candidates.push("http://localhost:5173");
  candidates.push("http://127.0.0.1:5173");
  candidates.push("http://localhost:8080");
  candidates.push("http://127.0.0.1:8080");
  candidates.push("http://localhost:3000");
  candidates.push("http://127.0.0.1:3000");
  candidates.push("http://localhost:3001");
  candidates.push("http://127.0.0.1:3001");

  return [...new Set(candidates)];
}

function setLoading(isLoading) {
  loadingOverlay.classList.toggle("hidden", !isLoading);
  generateBtn.disabled = isLoading;
}

function formDataToObject(formElement) {
  const formData = new FormData(formElement);
  return Object.fromEntries(formData.entries());
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
    const key = String(value).toLowerCase();
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

  const skills = uniqueByLowerCase([
    ...roleSkills.filter((skill) => !skillSet.has(skill.toLowerCase())),
    "Communication and teamwork",
    "Resume and LinkedIn optimization",
  ]).slice(0, 6);

  return {
    skills,
    projects: [
      `Build one ${student.targetRole} portfolio project aligned to ${student.targetCompany} style interviews.`,
      `Create a branch-focused project (${student.branch}) and deploy it publicly with documentation.`,
      "Publish 2 mini-projects with clean README and architecture notes.",
      "Add tests and CI to one capstone project.",
    ],
    certifications: [
      "Google Career Certificate (role-relevant track)",
      "Coursera or edX specialization matching your target role",
      "One cloud fundamentals certificate (AWS/Azure/GCP)",
    ],
    interview_prep: [
      "Practice 4-5 interview problems weekly and track weak topics.",
      "Do 1 mock interview every week.",
      "Prepare concise stories for projects, challenges, and impact.",
      `Create a target-company prep sheet for ${student.targetCompany}.`,
    ],
    timeline: [
      "Month 1: Strengthen fundamentals and complete one guided course.",
      "Month 2: Build Project 1 and publish with documentation.",
      "Month 3: Build Project 2 and start mock interviews.",
      "Month 4: Complete one certification and improve resume/GitHub.",
      "Month 5: Intensive interview prep with role-focused practice.",
      `Month 6: Apply strategically to ${student.targetCompany} and similar companies.`,
    ],
  };
}

async function generateRoadmap(payload) {
  const apiBaseCandidates = buildApiBaseCandidates();
  const attemptErrors = [];

  for (const base of apiBaseCandidates) {
    const endpoint = `${base}/api/roadmap`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const isJsonResponse = contentType.includes("application/json");

      if (!isJsonResponse) {
        attemptErrors.push(`Non-JSON response from ${endpoint}`);
        continue;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        attemptErrors.push(
          `${endpoint}: ${result.message || `Backend error (${response.status}).`}`
        );
        continue;
      }

      return { roadmap: result.roadmap, source: "api", warning: "" };
    } catch (error) {
      attemptErrors.push(`${endpoint}: ${error.message}`);
    }
  }

  console.warn("SkillSprint API unavailable. Using local fallback roadmap.", attemptErrors);
  return {
    roadmap: buildLocalRoadmap(payload),
    source: "local",
    warning:
      "Backend not reachable right now. Generated roadmap in offline mode (local fallback).",
  };
}

if (roadmapForm) {
  roadmapForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.textContent = "";

    const payload = formDataToObject(roadmapForm);

    setLoading(true);

    try {
      const { roadmap, source, warning } = await generateRoadmap(payload);

      // Persist profile + roadmap so the results page can render after redirect.
      sessionStorage.setItem("skillsprintUser", JSON.stringify(payload));
      sessionStorage.setItem("skillsprintRoadmap", JSON.stringify(roadmap));
      sessionStorage.setItem("skillsprintSource", source);
      sessionStorage.setItem("skillsprintWarning", warning || "");

      window.location.href = "./roadmap.html";
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      setLoading(false);
    }
  });
}
