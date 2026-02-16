const express = require("express");
const path = require("path");
require("dotenv").config();

const roadmapRoutes = require("./routes/roadmapRoutes");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Lightweight CORS support without external dependency.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use("/api/roadmap", roadmapRoutes);

// Serve static frontend files.
app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dashboard.html"));
});

app.get("/roadmap", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "roadmap.html"));
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", app: "SkillSprint" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Unexpected server error. Please try again.",
  });
});

function uniquePortList(ports) {
  return [...new Set(ports.filter((port) => Number.isInteger(port) && port > 0))];
}

function startServer(portCandidates) {
  const [currentPort, ...nextPorts] = portCandidates;

  const server = app.listen(currentPort, () => {
    console.log(`SkillSprint server running at http://localhost:${currentPort}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && nextPorts.length > 0) {
      console.warn(`Port ${currentPort} is busy. Trying port ${nextPorts[0]}...`);
      startServer(nextPorts);
      return;
    }

    console.error("Server failed to start:", error.message);
    process.exit(1);
  });
}

startServer(uniquePortList([DEFAULT_PORT, 5001, 5050, 5173, 8080, 3000, 3001]));
