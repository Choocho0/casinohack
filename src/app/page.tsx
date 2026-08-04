/**
 * 홈 — 혼잡 예보 캘린더 (M2에서 완성)
 * M0: 레이아웃 자리만 잡아둔 스텁. 실데이터가 없으므로 어떤 수치도 표시하지 않는다 (절대 규칙 1).
 */
export default function HomePage() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-bg-card p-5">
        <p className="text-xs text-text-sub">오늘의 예보</p>
        <p className="mt-2 text-2xl font-semibold text-text-main">
          준비 중<span className="text-gold">…</span>
        </p>
        <p className="mt-1 text-xs text-text-sub">
          입장객 스냅샷 데이터 연결 후 표시됩니다 (M1–M2)
        </p>
      </section>

      <section className="rounded-2xl bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">혼잡 예보 캘린더</p>
          <div className="flex items-center gap-3 text-[10px] text-text-sub">
            <Legend color="bg-ok" label="원활" />
            <Legend color="bg-mid" label="보통" />
            <Legend color="bg-busy" label="혼잡" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-white/5"
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-text-sub">
          캘린더 히트맵은 M2에서 데이터와 함께 채워집니다
        </p>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
