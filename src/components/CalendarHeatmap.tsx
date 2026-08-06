"use client";

/**
 * 홈 캘린더 (CLAUDE.md §6-1)
 * - 오늘의 예보 카드 + 월 네비게이션 히트맵 + 날짜 탭 하단 시트
 * - 서버(page.tsx)에서 계산한 ForecastCell[]을 받아 렌더만 담당
 */
import { useEffect, useMemo, useState } from "react";
import type { ForecastCell } from "@/lib/forecast";
import { LevelChip, PredBadge, LEVEL_LABEL } from "@/components/ForecastBadge";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

const CELL_BG: Record<string, string> = {
  ok: "bg-ok/80",
  mid: "bg-mid/80",
  busy: "bg-busy/80",
};

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function CalendarHeatmap({ cells }: { cells: ForecastCell[] }) {
  // 초기값 = 빌드 시 스냅샷 예보 → 마운트 후 /api/forecast(API 병합분)로 조용히 갱신.
  // 갱신 실패 시 스냅샷 그대로 유지 (절대 규칙 3).
  const [data, setData] = useState(cells);
  useEffect(() => {
    fetch("/api/forecast")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (Array.isArray(j?.cells) && j.cells.length) setData(j.cells);
      })
      .catch(() => {});
  }, []);

  const byDate = useMemo(() => new Map(data.map((c) => [c.date, c])), [data]);
  const months = useMemo(
    () => Array.from(new Set(data.map((c) => c.date.slice(0, 7)))).sort(),
    [data]
  );
  const today = todayStr();

  const initialMonth = months.includes(today.slice(0, 7))
    ? today.slice(0, 7)
    : months[0];
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const mi = months.indexOf(month);
  const [y, m] = month.split("-").map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

  const todayCell = byDate.get(today);
  const selCell = selected ? byDate.get(selected) : undefined;

  return (
    <div className="space-y-4">
      {/* ── 오늘의 예보 ── */}
      <section className="rounded-2xl bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-sub">
            오늘의 현황 · {Number(today.slice(5, 7))}월 {Number(today.slice(8, 10))}일 (
            {WEEKDAY_KO[new Date(`${today}T00:00:00`).getDay()]})
          </p>
          {todayCell?.predicted && <PredBadge />}
        </div>
        {todayCell ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gold">
                {LEVEL_LABEL[todayCell.level]}
              </span>
              <span className="text-sm text-text-sub">
                {todayCell.predicted ? "예약" : "이용자"}{" "}
                {todayCell.expected.toLocaleString("ko-KR")}명
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-sub">
              근거: {todayCell.basis}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-sub">
            오늘 날짜의 현황 데이터가 없습니다
          </p>
        )}
      </section>

      {/* ── 캘린더 히트맵 ── */}
      <section className="rounded-2xl bg-bg-card p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => mi > 0 && setMonth(months[mi - 1])}
            disabled={mi <= 0}
            className="rounded-lg px-2 py-1 text-text-sub disabled:opacity-25"
            aria-label="이전 달"
          >
            ◀
          </button>
          <p className="text-sm font-semibold">
            {y}년 {m}월
          </p>
          <button
            onClick={() => mi < months.length - 1 && setMonth(months[mi + 1])}
            disabled={mi >= months.length - 1}
            className="rounded-lg px-2 py-1 text-text-sub disabled:opacity-25"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[10px] text-text-sub">
          {WEEKDAY_KO.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            const cell = byDate.get(date);
            const isToday = date === today;
            return (
              <button
                key={date}
                onClick={() => cell && setSelected(date)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition-transform active:scale-95 ${
                  cell ? CELL_BG[cell.level] : "bg-white/5"
                } ${cell ? "text-[#14161C]" : "text-text-sub/40"} ${
                  isToday ? "ring-2 ring-gold" : ""
                }`}
              >
                {i + 1}
                {cell?.predicted && (
                  <span
                    className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[#14161C]/50"
                    aria-label="예약"
                  />
                )}
                {cell?.holidayName && (
                  <span className="text-[8px] leading-none">휴</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] text-text-sub">
          <div className="flex items-center gap-3">
            <Legend color="bg-ok" label="원활" />
            <Legend color="bg-mid" label="보통" />
            <Legend color="bg-busy" label="혼잡" />
          </div>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-white/50" /> 표시 = 예약 현황
          </span>
        </div>
      </section>

      {/* ── 하단 시트 ── */}
      {selCell && (
        <DateSheet
          cell={selCell}
          byDate={byDate}
          today={today}
          onClose={() => setSelected(null)}
        />
      )}
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

/** 날짜 상세 하단 시트: 등급·근거·이 주의 추천 방문일 */
function DateSheet({
  cell,
  byDate,
  today,
  onClose,
}: {
  cell: ForecastCell;
  byDate: Map<string, ForecastCell>;
  today: string;
  onClose: () => void;
}) {
  const d = new Date(`${cell.date}T00:00:00`);
  const dow = d.getDay();

  // 이 주(일~토)의 추천 방문일 = 오늘 이후 날짜 중 예상 입장객 최소일
  const week: ForecastCell[] = [];
  for (let i = 0; i < 7; i++) {
    const wd = new Date(d);
    wd.setDate(d.getDate() - dow + i);
    const p = (n: number) => String(n).padStart(2, "0");
    const key = `${wd.getFullYear()}-${p(wd.getMonth() + 1)}-${p(wd.getDate())}`;
    const c = byDate.get(key);
    if (c) week.push(c);
  }
  const candidates = week.filter((c) => c.date >= today);
  const best = (candidates.length ? candidates : week).reduce(
    (a, b) => (b.expected < a.expected ? b : a),
    (candidates.length ? candidates : week)[0]
  );

  return (
    <div
      className="fixed inset-0 z-40 mx-auto flex max-w-[390px] items-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl bg-bg-card p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            {Number(cell.date.slice(5, 7))}월 {Number(cell.date.slice(8, 10))}일 (
            {WEEKDAY_KO[dow]})
            {cell.holidayName && (
              <span className="ml-1.5 text-xs text-gold">{cell.holidayName}</span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <LevelChip level={cell.level} />
            {cell.predicted && <PredBadge />}
          </div>
        </div>

        <p className="mt-3 text-2xl font-semibold">
          {cell.predicted ? "예약 " : "이용자 "}
          <span className="text-gold">{cell.expected.toLocaleString("ko-KR")}</span>명
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-sub">
          근거: {cell.basis}
        </p>

        {best && best.date !== cell.date && (
          <div className="mt-4 rounded-xl bg-bg-base p-3.5">
            <p className="text-[11px] text-text-sub">이 주의 추천 방문일</p>
            <p className="mt-1 text-sm font-semibold">
              {Number(best.date.slice(5, 7))}월 {Number(best.date.slice(8, 10))}일 (
              {WEEKDAY_KO[new Date(`${best.date}T00:00:00`).getDay()]}) ·{" "}
              <span className="text-ok">{LEVEL_LABEL[best.level]}</span>
              <span className="ml-1 text-xs font-normal text-text-sub">
                {best.predicted ? "예약" : "이용자"}{" "}
                {best.expected.toLocaleString("ko-KR")}명
              </span>
              {best.predicted && <PredBadge className="ml-1.5" />}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/5 py-3 text-sm text-text-sub"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
