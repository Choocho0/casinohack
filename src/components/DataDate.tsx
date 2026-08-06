"use client";

/**
 * 데이터 기준일 표시 (CLAUDE.md §5-2)
 * 초기값은 스냅샷 기준일 → 마운트 후 /api/forecast에서 병합 기준일로 조용히 갱신.
 * API 실패 시 아무 일도 일어나지 않음 (폴백).
 */
import { useEffect, useState } from "react";

export default function DataDate({ initial }: { initial: string }) {
  const [date, setDate] = useState(initial);

  useEffect(() => {
    fetch("/api/forecast?meta=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // API 병합분이 더 최신일 때만 갱신 (초기 표시일 유지)
        if (j?.dataDate && /^\d{4}-\d{2}-\d{2}$/.test(j.dataDate) && j.dataDate > initial)
          setDate(j.dataDate);
      })
      .catch(() => {});
  }, [initial]);

  return <span className="text-[11px] text-text-sub">데이터 기준일: {date}</span>;
}
