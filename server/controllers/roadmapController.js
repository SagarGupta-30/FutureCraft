const { buildRoadmap } = require("../services/openaiService");

const REQUIRED_FIELDS = [
  "name",
  "branch",
  "year",
  "targetRole",
  "targetCompany",
  "currentSkills",
  "experienceLevel",
];

function findMissingFields(payload) {
  return REQUIRED_FIELDS.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

async function generateRoadmap(req, res) {
  try {
    const userData = req.body;
    const missingFields = findMissingFields(userData);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const roadmap = await buildRoadmap({
      name: String(userData.name).trim(),
      branch: String(userData.branch).trim(),
      year: String(userData.year).trim(),
      targetRole: String(userData.targetRole).trim(),
      targetCompany: String(userData.targetCompany).trim(),
      currentSkills: String(userData.currentSkills).trim(),
      experienceLevel: String(userData.experienceLevel).trim(),
    });

    return res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap generation failed:", error.message);
    const rawMessage = String(error.message || "");
    const isApiKeyConfigIssue = rawMessage.includes("OPENAI_API_KEY");
    const isOpenAiAuthIssue =
      rawMessage.includes("Incorrect API key") ||
      rawMessage.includes("401") ||
      rawMessage.toLowerCase().includes("invalid api key");

    return res.status(500).json({
      success: false,
      message:
        isApiKeyConfigIssue || isOpenAiAuthIssue
          ? "OPENAI_API_KEY in .env is invalid. Add a valid OpenAI key, then restart `npm run dev`."
          : "Failed to generate roadmap right now. Please try again.",
    });
  }
}

module.exports = { generateRoadmap };
