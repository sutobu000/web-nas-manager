import { NextResponse } from "next/server";
import { loadDrives } from "@/lib/drives";

// ドライブ設定はファイル/環境変数を実行時に読むため、静的化を無効化する。
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadDrives());
}
