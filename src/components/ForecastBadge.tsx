import type { CongestionLevel } from "@/lib/forecast";

export const LEVEL_LABEL: Record<CongestionLevel, string> = {
  ok: "원활",
  mid: "보통",
  busy: "혼잡",
};

const LEVEL_CHIP: Record<CongestionLevel, string> = {
  ok: "bg-ok/15 text-ok",
  mid: "bg-mid/15 text-mid",
  busy: "bg-busy/15 text-busy",
};

/** 혼잡 등급 칩 */
export function LevelChip({
  level,
  className = "",
}: {
  level: CongestionLevel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_CHIP[level]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          level === "ok" ? "bg-ok" : level === "mid" ? "bg-mid" : "bg-busy"
        }`}
      />
      {LEVEL_LABEL[level]}
    </span>
  );
}

/** 예측 뱃지 (절대 규칙 1: 미래 등급은 반드시 예측 라벨) */
export function PredBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border border-gold/40 px-1 py-px text-[9px] font-medium leading-none text-gold ${className}`}
    >
      예측
    </span>
  );
}
