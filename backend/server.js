/**
 * YouTube Downloader Backend
 * Uses yt-dlp under the hood for reliable, fast downloads.
 * Run: node server.js
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const infoRouter = require("./routes/info");
const downloadRouter = require("./routes/download");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Rate-limit: 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please slow down." },
});
app.use(limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/info", infoRouter);
app.use("/api/download", downloadRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅  YT-Downloader backend running on http://localhost:${PORT}`);
});
