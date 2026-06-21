import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "web-nas-token";

// 認証不要なパス
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
];

// 常に許可するパスのプレフィックス
const ALWAYS_ALLOWED_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/manifest.json",
  "/icons/",
  "/sw.js",
];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // JWT_SECRETが未設定の場合は認証をスキップ（開発用）
    return new Uint8Array(0);
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 本番でJWT_SECRETが未設定なら、無認証での全公開を防ぐため全リクエストを停止する（fail-close）。
  // /loginや静的アセットも含めて503を返し、運用者にJWT_SECRETの設定を強制する。
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("[SECURITY] JWT_SECRET is not set. Refusing all requests. Set JWT_SECRET to enable authentication.");
    return serviceUnavailable(request);
  }

  // 認証不要なパスはそのまま通す
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 静的アセットは常に許可
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 開発時のみ: JWT_SECRET未設定なら認証をスキップ（本番は上で停止済み）。
  if (!process.env.JWT_SECRET) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return handleUnauthorized(request);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return handleUnauthorized(request);
  }
}

function handleUnauthorized(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // APIリクエストには401を返す
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  // ページリクエストはログインページにリダイレクト
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Fail-closed response used when the server is misconfigured
 * (JWT_SECRET missing in production). Returns 503 for every request.
 */
function serviceUnavailable(request: NextRequest): NextResponse {
  const message = "Server is not configured: JWT_SECRET is required.";
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE", message },
      { status: 503 }
    );
  }
  return new NextResponse(message, {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  matcher: [
    // 全ルートに適用（_nextの静的ファイルは除外）
    "/((?!_next/static|_next/image).*)",
  ],
};
