/**
 * Validate that a URL looks like a YouTube video or shorts link.
 * This is a basic safeguard — yt-dlp will further validate the URL.
 */
function validateYouTubeUrl(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, "");
    const isYT = hostname === "youtube.com" || hostname === "youtu.be";
    if (!isYT) return false;
    // Must have a video ID
    const hasV = u.searchParams.has("v") || u.pathname.startsWith("/shorts/");
    const isShort = hostname === "youtu.be" && u.pathname.length > 1;
    return hasV || isShort;
  } catch {
    return false;
  }
}

module.exports = { validateYouTubeUrl };
