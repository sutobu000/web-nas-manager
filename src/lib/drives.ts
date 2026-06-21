// サーバー専用モジュール: ドライブ設定をファイルシステムから読む。
// Client Componentからimportするとfsの解決に失敗してビルドが落ちる。これは
// 意図したガードで、ドライブはサーバーで読み込みAPI/props経由でクライアントへ渡す。
import fs from "fs";
import type { StorageDrive } from "@/types/files";

/**
 * Path to the external drives configuration file.
 * Override with DRIVES_CONFIG_PATH. In Docker, mount your file to this path.
 */
const CONFIG_PATH = process.env.DRIVES_CONFIG_PATH || "/config/drives.json";

// idはURLのパスセグメント(/files/<id>)とマウント先ディレクトリ名(/data/<id>)を
// 兼ねるため、パス区切りやトラバーサル文字を含まない安全な文字種だけを許可する。
const ID_PATTERN = /^[A-Za-z0-9._-]+$/;

// 有効なドライブが1つも設定されていないときのフォールバック。
// データルート全体を単一ドライブとして見せる。空idは/files(データルート)にリンクする。
const DEFAULT_DRIVES: StorageDrive[] = [
  { id: "", name: "Data", icon: "hdd", description: "All storage" },
];

let cached: StorageDrive[] | null = null;

/**
 * Validate and normalize a single raw entry. Returns null when invalid.
 */
function parseDrive(raw: unknown): StorageDrive | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // idとnameは必須。idは安全なパスセグメントであること。
  if (typeof r.id !== "string" || !ID_PATTERN.test(r.id)) return null;
  if (typeof r.name !== "string" || r.name.length === 0) return null;

  return {
    id: r.id,
    name: r.name,
    icon: typeof r.icon === "string" ? r.icon : "hdd",
    description: typeof r.description === "string" ? r.description : undefined,
  };
}

/**
 * Parse an already-JSON-parsed value into a list of drives.
 * Falls back to the default drive when nothing valid is found.
 * Exported so the parsing logic can be unit-tested in isolation.
 */
export function parseDrivesConfig(data: unknown): StorageDrive[] {
  if (!Array.isArray(data)) return DEFAULT_DRIVES;
  const drives = data
    .map(parseDrive)
    .filter((d): d is StorageDrive => d !== null);
  return drives.length > 0 ? drives : DEFAULT_DRIVES;
}

/**
 * Load the configured storage drives.
 * Resolution order: STORAGE_DRIVES_JSON env > config file > default.
 * Cached for the lifetime of the server process.
 */
export function loadDrives(): StorageDrive[] {
  // 開発時は設定ファイルやenvの変更を即反映するためキャッシュを使わない。
  if (cached && process.env.NODE_ENV !== "development") return cached;

  // 1) 環境変数によるインラインJSON（単純なデプロイ向け）。
  const inline = process.env.STORAGE_DRIVES_JSON;
  if (inline) {
    try {
      cached = parseDrivesConfig(JSON.parse(inline));
      return cached;
    } catch {
      console.error("[drives] STORAGE_DRIVES_JSON is not valid JSON; ignoring it.");
    }
  }

  // 2) 外部設定ファイル。
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const text = fs.readFileSync(CONFIG_PATH, "utf8");
      cached = parseDrivesConfig(JSON.parse(text));
      return cached;
    }
  } catch (err) {
    console.error(`[drives] Failed to read ${CONFIG_PATH}:`, err);
  }

  // 3) デフォルト: データルート全体を1ドライブとして返す。
  cached = DEFAULT_DRIVES;
  return cached;
}
