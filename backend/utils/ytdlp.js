/**
 * Thin wrappers around the yt-dlp CLI binary.
 * yt-dlp must be installed: pip install yt-dlp  OR  brew install yt-dlp
 */

const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// Path to yt-dlp binary (override via env var for Docker/cloud deployments)
const YTDLP_BIN = process.env.YTDLP_BIN || "yt-dlp";

/**
 * Run yt-dlp and collect full stdout output.
 * Used for --dump-json metadata fetching.
 * @param {string[]} args
 * @returns {Promise<string>} raw stdout
 */
async function execYtDlp(args) {
  const { stdout, stderr } = await execFileAsync(YTDLP_BIN, args, {
    maxBuffer: 10 * 1024 * 1024, // 10 MB for metadata JSON
    timeout: 30_000,             // 30s timeout for info fetching
  });
  if (stderr && stderr.includes("ERROR")) {
    throw new Error(stderr);
  }
  return stdout;
}

/**
 * Spawn yt-dlp as a streaming child process.
 * Stdout is left open for piping to HTTP response.
 * @param {string[]} args
 * @returns {ChildProcess}
 */
function spawnYtDlp(args) {
  return spawn(YTDLP_BIN, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

module.exports = { execYtDlp, spawnYtDlp };
