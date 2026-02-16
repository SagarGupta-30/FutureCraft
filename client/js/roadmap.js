const roadmapGrid = document.getElementById("roadmapGrid");
const studentSummary = document.getElementById("studentSummary");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const roadmapNotice = document.getElementById("roadmapNotice");

const CARD_SECTIONS = [
  { key: "skills", title: "Skills to Learn" },
  { key: "projects", title: "Projects to Build" },
  { key: "certifications", title: "Certifications" },
  { key: "interview_prep", title: "Interview Preparation Plan" },
  { key: "timeline", title: "6-Month Timeline" },
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readSessionData() {
  const user = JSON.parse(sessionStorage.getItem("skillsprintUser") || "null");
  const roadmap = JSON.parse(sessionStorage.getItem("skillsprintRoadmap") || "null");
  const source = sessionStorage.getItem("skillsprintSource") || "";
  const warning = sessionStorage.getItem("skillsprintWarning") || "";
  return { user, roadmap, source, warning };
}

function createListMarkup(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>No data available.</p>";
  }

  const listItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<ul>${listItems}</ul>`;
}

function renderRoadmap(roadmap) {
  roadmapGrid.innerHTML = CARD_SECTIONS.map((section, index) => {
    const items = roadmap[section.key] || [];
    return `
      <article class="roadmap-card" style="animation-delay: ${index * 80}ms;">
        <h2>${section.title}</h2>
        ${createListMarkup(items)}
      </article>
    `;
  }).join("");
}

function renderSummary(user) {
  studentSummary.textContent = `${user.name} | ${user.branch}, ${user.year} | Target: ${user.targetRole} at ${user.targetCompany}`;
}

function addPdfSection(doc, title, items, yPosition) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let y = yPosition;

  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);

  items.forEach((item) => {
    const line = `- ${item}`;
    const lines = doc.splitTextToSize(line, 180);

    if (y + lines.length * 6 > pageHeight - 16) {
      // Create a new PDF page when content would overflow.
      doc.addPage();
      y = 20;
    }

    doc.text(lines, marginX, y);
    y += lines.length * 6;
  });

  return y + 6;
}

function downloadPdf(user, roadmap) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(11, 95, 255);
  doc.text("SkillSprint - AI Career Roadmap", 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${user.name} | ${user.targetRole} at ${user.targetCompany}`, 14, 28);

  let y = 38;

  CARD_SECTIONS.forEach((section) => {
    const items = Array.isArray(roadmap[section.key]) ? roadmap[section.key] : [];
    y = addPdfSection(doc, section.title, items, y);
  });

  const safeName = user.name.toLowerCase().replace(/\s+/g, "-");
  doc.save(`skillsprint-roadmap-${safeName}.pdf`);
}

(function init() {
  const { user, roadmap, source, warning } = readSessionData();

  if (!user || !roadmap) {
    roadmapGrid.innerHTML = `
      <article class="roadmap-card">
        <h2>No Roadmap Data Found</h2>
        <p>Please generate a roadmap from the dashboard first.</p>
      </article>
    `;
    studentSummary.textContent = "No student profile found in this session.";
    downloadPdfBtn.disabled = true;
    return;
  }

  renderSummary(user);
  renderRoadmap(roadmap);

  if (source === "local" && warning) {
    roadmapNotice.textContent = warning;
    roadmapNotice.classList.remove("hidden");
  }

  downloadPdfBtn.addEventListener("click", () => downloadPdf(user, roadmap));
})();
