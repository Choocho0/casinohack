/**
 * 홈 — 혼잡 예보 캘린더 (CLAUDE.md §6-1)
 * 서버 컴포넌트: 스냅샷 → 예보 계산 → 클라이언트 캘린더에 전달.
 * 스냅샷만으로 동작 (절대 규칙 3). API 병합은 M5에서 추가.
 */
import CalendarHeatmap from "@/components/CalendarHeatmap";
import ForeignLive from "@/components/ForeignLive";
import { entries, getModel } from "@/lib/data";
import { forecastRange } from "@/lib/forecast";

export default function HomePage() {
  const model = getModel();
  // 캘린더 범위: 스냅샷 시작 ~ 2026-12-31 (과거 = 실측, 이후 = 예측)
  const from = entries[0]?.date ?? "2026-06-01";
  const cells = forecastRange(model, from, "2026-12-31");

  return (
    <div className="space-y-4">
      <ForeignLive />
      <CalendarHeatmap cells={cells} />
    </div>
  );
}
