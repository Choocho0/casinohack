/**
 * 게임 추천 탭 (CLAUDE.md §6-2)
 * - games.json(실데이터: 게임명·대수) 기반 카드 리스트, 좌석 규모 내림차순
 * - 하단 "방문 플래너 팁": 노쇼율 실데이터 (snapshot_noshow.json)
 */
import GameList, { type GameGuide } from "@/components/GameCard";
import guidesJson from "../../../data/game_guides.json";
import { games, getNoshowStats } from "@/lib/data";

export default function GamesPage() {
  const guides = (guidesJson as { guides: Record<string, GameGuide> }).guides;
  const ns = getNoshowStats();

  return (
    <div className="space-y-4">
      <section>
        <p className="text-sm font-semibold">
          초보자가 앉기 쉬운 순<span className="text-gold"> · 좌석 규모</span>
        </p>
        <p className="mt-1 text-[11px] text-text-sub">
          {games[0]?.year}년 카지노게임현황 기준 · 카드를 탭하면 진행 방법을 볼 수 있어요
        </p>
      </section>

      <GameList games={games} guides={guides} />

      {/* ── 방문 플래너 팁 (§5-4 노쇼율) ── */}
      <section className="rounded-2xl border border-gold/20 bg-bg-card p-5">
        <p className="text-xs font-semibold text-gold">방문 플래너 팁</p>
        <p className="mt-2 text-[13px] leading-relaxed">
          최근 한 달({ns.period}) 내국인 입장권{" "}
          <span className="font-semibold text-gold">
            {ns.domestic.issued.toLocaleString("ko-KR")}장
          </span>{" "}
          중 미입장은{" "}
          <span className="font-semibold text-gold">
            {ns.domestic.noshow.toLocaleString("ko-KR")}장 (
            {ns.domestic.ratePct.toFixed(2)}%)
          </span>
          . 발행된 표는 사실상 전원 입장하므로, 빈자리를 기대하기보다{" "}
          <span className="font-semibold">혼잡 예보에서 여유일을 골라 방문</span>하는
          것이 대기를 줄이는 가장 확실한 방법입니다.
        </p>
        <p className="mt-2.5 text-[10px] text-text-sub">
          근거: 입장권 발행 대비 실입장 데이터 (내국인 {ns.domestic.ratePct.toFixed(2)}% ·
          외국인 {ns.foreign.ratePct.toFixed(2)}% 미입장)
        </p>
      </section>
    </div>
  );
}
