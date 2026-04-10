/**
 * GET /api/download?url=<youtube_url>&format_id=<id>&type=video|audio&title=<filename>
 * Streams the file directly to the browser — nothing is stored on the server.
 */

const router = require("express").Router();
const { spawnYtDlp } = require("../utils/ytdlp");
const { validateYouTubeUrl } = require("../utils/validate");

router.get("/", async (req, res, next) => {
  try {
    const { url, format_id, type, title = "download" } = req.query;

    if (!url || !format_id || !type)
      return res.status(400).json({ error: "Missing required parameters." });
    if (!validateYouTubeUrl(url))
      return res.status(400).json({ error: "Invalid YouTube URL." });

    // Sanitise filename
    const safeTitle = title.replace(/[^\w\s\-().]/g, "").trim() || "download";

    let args;

    if (type === "audio") {
      // Extract best audio, convert to MP3
      args = [
        "-f", format_id,
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--no-warnings",
        "-o", "-",   // Output to stdout
        url,
      ];
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp3"`);
      res.setHeader("Content-Type", "audio/mpeg");
    } else {
      // Video: if it's a video-only format, merge with best audio
      const isVideoOnly = req.query.videoOnly === "true";
      const formatStr = isVideoOnly ? `${format_id}+bestaudio` : format_id;

      args = [
        "-f", formatStr,
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--no-warnings",
        "-o", "-",
        url,
      ];
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
      res.setHeader("Content-Type", "video/mp4");
    }

    // Spawn yt-dlp and pipe stdout → HTTP response
    const proc = spawnYtDlp(args);

    proc.stdout.pipe(res);

    proc.stderr.on("data", (d) => {
      // Log progress lines but don't crash
      const line = d.toString().trim();
      if (line) console.log("[yt-dlp]", line);
    });

    proc.on("error", (err) => {
      console.error("[spawn error]", err);
      if (!res.headersSent) next(err);
    });

    proc.on("close", (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: "Download failed. Please try again." });
      }
    });

    // If client disconnects, kill yt-dlp to avoid zombie processes
    req.on("close", () => proc.kill());

  } catch (err) {
    next(err);
  }
});

module.exports = router;
