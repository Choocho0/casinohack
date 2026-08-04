"use client";

/**
 * 실시간 외국인 입장 위젯 (CLAUDE.md §6-1 선택 항목)
 * API 성공 시에만 표시. 실패/키 없음 → 아무것도 렌더하지 않음 (절대 규칙 1·3).
 */
import { useEffect, useState } from "react";

interface ForeignLiveData {
  date: string;
  total: number;
}

export default function ForeignLive() {
  const [data, setData] = useState<ForeignLiveData | null>(null);

  useEffect(() => {
    fetch("/api/forecast?meta=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.foreign?.date && typeof j.foreign.total === "number") {
          setData(j.foreign);
        }
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <section className="flex items-center justify-between rounded-2xl bg-bg-card px-5 py-3.5">
      <p className="text-xs text-text-sub">
        외국인 입장{" "}
        <span className="text-[10px]">({data.date} 기준 · 실시간 API)</span>
      </p>
      <p className="text-lg font-semibold text-gold">
        {data.total.toLocaleString("ko-KR")}
        <span className="ml-0.5 text-[11px] font-normal text-text-sub">명</span>
      </p>
    </section>
  );
}
