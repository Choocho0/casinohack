/**
 * /api/forecast — 스냅샷 + 공공데이터 API 병합 → 예보 JSON (CLAUDE.md §5-2)
 * GET /api/forecast?from=YYYY-MM-DD&to=YYYY-MM-DD
 * API 실패/키 미설정 시 스냅샷만으로 응답 (폴백).
 */
import { NextRequest, NextResponse } from "next/server";
import { forecastRange } from "@/lib/forecast";
import { getMerged, fetchForeignToday } from "@/lib/remote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { merged, model, updated } = await getMerged();

  const sp = req.nextUrl.searchParams;

  // 메타만 필요할 때 (헤더 데이터 기준일 갱신 + 실시간 외국인 위젯)
  if (sp.get("meta") === "1") {
    const foreign = await fetchForeignToday(); // 실패 시 null
    return NextResponse.json({
      dataDate: merged[merged.length - 1]?.date ?? "-",
      updated,
      foreign,
    });
  }

  const from = DATE_RE.test(sp.get("from") ?? "")
    ? (sp.get("from") as string)
    : merged[0]?.date ?? "2026-06-01";
  const to = DATE_RE.test(sp.get("to") ?? "") ? (sp.get("to") as string) : "2026-12-31";

  const cells = forecastRange(model, from, to);

  return NextResponse.json({
    dataDate: merged[merged.length - 1]?.date ?? "-",
    updated, // true = 공공데이터 API 최신분 병합됨, false = 스냅샷만
    thresholds: model.thresholds,
    cells,
  });
}
