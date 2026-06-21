/**
 * Base path for all data volumes.
 * ローカル開発時はDATA_ROOT環境変数で上書き可能。
 */
export const DATA_ROOT = process.env.DATA_ROOT || "/data";

/**
 * Thumbnail cache directory.
 */
export const THUMBNAIL_CACHE_DIR = process.env.THUMBNAIL_CACHE_DIR || "/cache/thumbnails";

/**
 * Maximum upload file size (2GB).
 */
export const MAX_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024;

/**
 * Image file extensions that support thumbnails.
 */
export const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico", ".avif",
  ".heic", ".heif", ".tiff", ".tif",
]);

/**
 * RAW image file extensions.
 * サムネイルは埋め込みJPEG抽出で対応。
 */
export const RAW_EXTENSIONS = new Set([
  ".raf",  // FUJIFILM
  ".cr2", ".cr3",  // Canon
  ".nef", ".nrw",  // Nikon
  ".arw", ".srf", ".sr2",  // Sony
  ".dng",  // Adobe / Leica / etc
  ".orf",  // Olympus
  ".rw2",  // Panasonic
  ".pef",  // Pentax
  ".x3f",  // Sigma
]);

/**
 * Video file extensions.
 */
export const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv",
]);
