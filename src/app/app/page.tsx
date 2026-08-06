/**
 * 앱 화면 홈 — 혼잡 예보 캘린더 (CLAUDE.md §6-1)
 * 루트(/)는 웹 페이지 버전으로 리다이렉트되고, 앱 화면은 /app에서 서빙된다.
 */
import CalendarHeatmap from "@/components/CalendarHeatmap";
import ForeignLive from "@/components/ForeignLive";
import { entries, getModel } from "@/lib/data";
import { forecastRange } from "@/lib/forecast";

export default function AppHomePage() {
  const model = getModel();
  const from = entries[0]?.date ?? "2026-06-01";
  const cells = forecastRange(model, from, "2026-12-31");

  return (
    <div className="space-y-4">
      <ForeignLive />
      <CalendarHeatmap cells={cells} />
    </div>
  );
}
