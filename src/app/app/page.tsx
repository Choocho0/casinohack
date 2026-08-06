/**
 * 앱 화면 홈 — 실시간 예약 현황 캘린더
 * 6/1~8/10 이용자 현황 + 8/11~10/11 예약자 현황 (data/live_status.json)
 */
import CalendarHeatmap from "@/components/CalendarHeatmap";
import ForeignLive from "@/components/ForeignLive";
import { statusCells } from "@/lib/status";

export default function AppHomePage() {
  return (
    <div className="space-y-4">
      <ForeignLive />
      <CalendarHeatmap cells={statusCells} />
    </div>
  );
}
