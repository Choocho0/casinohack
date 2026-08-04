"use client";

/**
 * 게임 탭 (CLAUDE.md §6-2)
 * - 게임 카드 리스트 (좌석 규모 내림차순 = 초보자가 앉기 쉬운 순)
 * - 카드 탭 → 규칙 요약 모달 (game_guides.json — 팀 편집본)
 */
import { useState } from "react";
import type { Game } from "@/lib/data";

export interface GameGuide {
  summary: string;
  steps: string[];
}

const DIFF_STYLE: Record<Game["difficulty"], string> = {
  입문: "bg-ok/15 text-ok",
  쉬움: "bg-mid/15 text-mid",
  보통: "bg-busy/15 text-busy",
};

export default function GameList({
  games,
  guides,
}: {
  games: Game[];
  guides: Record<string, GameGuide>;
}) {
  const [open, setOpen] = useState<Game | null>(null);
  const maxUnits = Math.max(...games.map((g) => g.units));

  return (
    <div className="space-y-2.5">
      {games.map((g) => (
        <button
          key={g.name}
          onClick={() => setOpen(g)}
          className="w-full rounded-2xl bg-bg-card p-4 text-left transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{g.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFF_STYLE[g.difficulty]}`}
              >
                {g.difficulty}
              </span>
            </div>
            <span className="text-base font-semibold text-gold">
              {g.units.toLocaleString("ko-KR")}
              <span className="ml-0.5 text-[11px] font-normal text-text-sub">대</span>
            </span>
          </div>
          {/* 좌석 규모 게이지 (√ 스케일 — 최대 대수 대비) */}
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-burgundy to-gold"
              style={{
                width: `${Math.max(5, Math.sqrt(g.units / maxUnits) * 100)}%`,
              }}
            />
          </div>
          {g.blurb && (
            <p className="mt-2 text-[11px] leading-relaxed text-text-sub">{g.blurb}</p>
          )}
        </button>
      ))}

      {open && (
        <GuideModal game={open} guide={guides[open.name]} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function GuideModal({
  game,
  guide,
  onClose,
}: {
  game: Game;
  guide?: GameGuide;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 mx-auto flex max-w-[390px] items-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-bg-card p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold">{game.name}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFF_STYLE[game.difficulty]}`}
            >
              {game.difficulty}
            </span>
            <span className="text-xs text-text-sub">
              <span className="font-semibold text-gold">
                {game.units.toLocaleString("ko-KR")}
              </span>
              대 운영
            </span>
          </div>
        </div>

        {guide ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed">{guide.summary}</p>
            <p className="mt-4 text-[11px] font-semibold text-text-sub">진행 방법</p>
            <ol className="mt-2 space-y-2">
              {guide.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-semibold text-gold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-3 text-sm text-text-sub">규칙 요약이 준비되지 않았습니다.</p>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-text-sub/70">
          초보자 이해를 돕기 위한 진행 방법 요약입니다 (팀 편집본). 자세한 규칙은 현장
          안내를 따라주세요.
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-white/5 py-3 text-sm text-text-sub"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
