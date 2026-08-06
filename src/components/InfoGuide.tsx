"use client";

/**
 * 이용 안내 탭 (웹 페이지의 이용 안내 섹션과 동일 구성)
 * - 카지노 시설 안내도 (탭 → 라이트박스로 크게 보기)
 * - ARS 입장순서 신청
 * - 처음 방문 절차 4단계
 */
import { useState } from "react";

const STEPS = [
  { t: "신분증 지참", s: "만 19세 이상 출입 가능" },
  { t: "입장권 구매", s: "" },
  { t: "환전소에서 칩 교환", s: "" },
  { t: "게임 참여", s: "입문 게임부터 천천히 — 게임 탭 참고" },
];

export default function InfoGuide() {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* 시설 안내도 */}
      <button
        onClick={() => setMapOpen(true)}
        className="w-full rounded-2xl bg-bg-card p-5 text-left transition-transform active:scale-[0.98]"
      >
        <p className="text-xs font-semibold text-gold">카지노 시설 안내도</p>
        <div className="mt-3 h-40 overflow-hidden rounded-xl bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/casino_map.png" alt="카지노 시설 안내도" className="w-full" />
        </div>
        <p className="mt-2.5 text-[12px] text-text-sub">
          게임 존 · 편의시설 위치를 한눈에 —{" "}
          <span className="font-semibold text-text-main">탭하면 크게 볼 수 있어요</span>
        </p>
      </button>

      {/* ARS */}
      <section className="rounded-2xl border border-gold/20 bg-bg-card p-5">
        <p className="text-xs font-semibold text-gold">ARS 입장순서 신청</p>
        <a
          href="tel:0335907400"
          className="mt-2 block text-[26px] font-bold tracking-wide text-gold"
        >
          033-590-7400
        </a>
        <p className="mt-1 text-[12px] text-text-sub">
          전화 한 통으로 입장 순서를 미리 신청할 수 있어요
        </p>
      </section>

      {/* 처음 방문 절차 */}
      <section className="rounded-2xl bg-bg-card p-5">
        <p className="text-sm font-semibold">
          처음 방문 절차{" "}
          <span className="text-[10px] font-normal text-text-sub">
            — 하이원 공식 초보자 안내 기준
          </span>
        </p>
        <div className="mt-4 space-y-3.5">
          {STEPS.map((st, i) => (
            <div key={st.t} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[12px] font-bold text-gold">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="text-[13px] font-semibold">{st.t}</p>
                {st.s && <p className="text-[11px] text-text-sub">{st.s}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 지도 라이트박스 */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-[380px] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/casino_map.png" alt="카지노 시설 안내도" className="w-full" />
          </div>
          <button
            onClick={() => setMapOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-bg-card text-lg text-text-main"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
