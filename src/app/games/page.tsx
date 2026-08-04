/**
 * 게임 추천 탭 (M3에서 완성)
 * M0: 스텁 — games.json 연결 전이므로 데이터 표시 없음 (절대 규칙 1).
 */
export default function GamesPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-bg-card p-5">
        <p className="text-sm font-semibold">게임 추천</p>
        <p className="mt-2 text-xs text-text-sub">
          카지노게임현황 데이터(games.json) 연결 후 게임 카드가 표시됩니다 (M3)
        </p>
      </section>
    </div>
  );
}
