/**
 * GET /api/info?url=<youtube_url>
 * Returns video metadata + available download formats.
 */

const router = require("express").Router();
const { execYtDlp } = require("../utils/ytdlp");
const { validateYouTubeUrl } = require("../utils/validate");

router.get("/", async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: "Missing url parameter." });
    if (!validateYouTubeUrl(url))
      return res.status(400).json({ error: "Invalid or unsupported YouTube URL." });

    // Fetch metadata as JSON from yt-dlp (no download)
    const raw = await execYtDlp([
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      url,
    ]);

    const data = JSON.parse(raw);

    // Build a clean format list grouped by type
    const videoFormats = [];
    const audioFormats = [];

    for (const f of data.formats || []) {
      // Video + audio combined streams
      if (f.vcodec !== "none" && f.acodec !== "none" && f.ext === "mp4") {
        videoFormats.push({
          format_id: f.format_id,
          label: `${f.height}p`,
          height: f.height,
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx || null,
          fps: f.fps,
          vcodec: f.vcodec,
        });
      }
      // Video-only (will be merged with best audio by yt-dlp)
      if (f.vcodec !== "none" && f.acodec === "none" && f.ext === "mp4") {
        videoFormats.push({
          format_id: f.format_id,
          label: `${f.height}p (HD)`,
          height: f.height,
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx || null,
          fps: f.fps,
          videoOnly: true,
        });
      }
      // Audio-only
      if (f.vcodec === "none" && f.acodec !== "none") {
        audioFormats.push({
          format_id: f.format_id,
          label: `${f.abr ? Math.round(f.abr) + "kbps" : "Audio"} ${f.ext.toUpperCase()}`,
          ext: f.ext,
          abr: f.abr,
          filesize: f.filesize || f.filesize_approx || null,
        });
      }
    }

    // De-duplicate by height, keep best per resolution
    const seen = new Set();
    const uniqueVideo = videoFormats
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .filter((f) => {
        const key = `${f.height}-${f.videoOnly ? "vo" : "av"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    res.json({
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,        // seconds
      duration_string: data.duration_string,
      uploader: data.uploader,
      view_count: data.view_count,
      formats: {
        video: uniqueVideo.slice(0, 6),
        audio: audioFormats.slice(0, 3),
      },
    });
  } catch (err) {
    // yt-dlp errors often contain useful messages
    if (err.message.includes("Private video") || err.message.includes("Sign in"))
      return res.status(403).json({ error: "This video is private or age-restricted." });
    if (err.message.includes("not available"))
      return res.status(404).json({ error: "Video not available in your region." });
    next(err);
  }
});

module.exports = router;
