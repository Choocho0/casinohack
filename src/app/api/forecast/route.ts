/**
 * /api/forecast — 실시간 예약 현황 셀 제공
 * GET /api/forecast?from=YYYY-MM-DD&to=YYYY-MM-DD (기본: 전체)
 * ?meta=1 → 기준일 + 실시간 외국인 위젯 데이터
 */
import { NextRequest, NextResponse } from "next/server";
import { liveStatus } from "@/lib/status";
import { fetchForeignToday } from "@/lib/remote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("meta") === "1") {
    const foreign = await fetchForeignToday(); // 실패 시 null (폴백)
    return NextResponse.json({ dataDate: liveStatus.dataDate, foreign });
  }

  const from = DATE_RE.test(sp.get("from") ?? "") ? (sp.get("from") as string) : "0000";
  const to = DATE_RE.test(sp.get("to") ?? "") ? (sp.get("to") as string) : "9999";
  const cells = liveStatus.cells.filter((c) => c.date >= from && c.date <= to);

  return NextResponse.json({ dataDate: liveStatus.dataDate, cells });
}
