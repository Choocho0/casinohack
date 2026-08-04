/**
 * forecast.ts — 혼잡 등급 계산 (CLAUDE.md §5-3)
 *
 * 알고리즘:
 *  1) 과거 일자별 총입장객으로 (월×요일) 조합 평균 계산
 *     — 데이터가 4개월 미만이면 (요일) 평균으로 자동 강등 (§5-3 "SHIFT 자동 강등"과 동일한 원칙)
 *  2) 공휴일 가중: 공휴일 평균 ÷ 평일(월–금, 비공휴일) 평균 비율
 *  3) 미래 날짜 예상치 = 해당 조합 평균 × (공휴일이면 가중)
 *  4) 과거 실측 분포의 30/70 분위 → ok / mid / busy
 *  5) basis: 근거 문자열 (상세 패널·챗봇이 그대로 인용)
 */
import { getHoliday } from "./holidays";

export type CongestionLevel = "ok" | "mid" | "busy";

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  domestic: number;
  foreign: number;
  total: number;
}

export interface ForecastCell {
  date: string;
  level: CongestionLevel;
  /** 예측이면 예상 입장객, 실측이면 실제 입장객 */
  expected: number;
  basis: string;
  /** true = 예측(미래·데이터 없음), false = 실측 */
  predicted: boolean;
  holidayName?: string;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function dow(date: string): number {
  // UTC 고정으로 타임존 무관하게 요일 계산
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function fmtDateRange(entries: DailyEntry[]): string {
  if (!entries.length) return "";
  const f = entries[0].date;
  const l = entries[entries.length - 1].date;
  const [fy, fm] = f.split("-");
  const [ly, lm] = l.split("-");
  return fy === ly && fm === lm ? `${fy}년 ${Number(fm)}월` : `${fy}.${fm}~${ly}.${lm}`;
}

function quantile(sortedAsc: number[], q: number): number {
  if (!sortedAsc.length) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo));
}

export interface ForecastModel {
  /** 등급 임계값 (실측 분포 30/70 분위) */
  thresholds: { ok: number; busy: number };
  /** (월×요일) 또는 (요일) 평균 */
  avg: Map<string, { mean: number; count: number }>;
  /** 월 단위 사용 여부 (false = 요일 평균으로 강등) */
  useMonth: boolean;
  holidayWeight: number;
  holidaySamples: number;
  rangeLabel: string;
  byDate: Map<string, DailyEntry>;
  overallMean: number;
}

export function buildModel(entries: DailyEntry[]): ForecastModel {
  const byDate = new Map(entries.map((e) => [e.date, e]));

  // 데이터가 4개월 이상 걸쳐 있으면 (월×요일), 아니면 (요일)로 강등
  const months = new Set(entries.map((e) => e.date.slice(0, 7)));
  const useMonth = months.size >= 4;

  const avg = new Map<string, { mean: number; count: number }>();
  const add = (key: string, v: number) => {
    const cur = avg.get(key) ?? { mean: 0, count: 0 };
    cur.mean = (cur.mean * cur.count + v) / (cur.count + 1);
    cur.count += 1;
    avg.set(key, cur);
  };
  for (const e of entries) {
    const d = dow(e.date);
    add(useMonth ? `${Number(e.date.slice(5, 7))}-${d}` : `${d}`, e.total);
  }

  // 공휴일 가중: 공휴일 평균 ÷ 평일(월–금, 비공휴일) 평균
  const holidayTotals: number[] = [];
  const weekdayTotals: number[] = [];
  for (const e of entries) {
    const d = dow(e.date);
    if (getHoliday(e.date)) holidayTotals.push(e.total);
    else if (d >= 1 && d <= 5) weekdayTotals.push(e.total);
  }
  const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  let holidayWeight = 1;
  if (holidayTotals.length >= 1 && weekdayTotals.length >= 3) {
    holidayWeight = mean(holidayTotals) / mean(weekdayTotals);
    holidayWeight = Math.min(2.5, Math.max(0.8, holidayWeight)); // 이상치 방어
  }

  const sorted = entries.map((e) => e.total).sort((a, b) => a - b);
  return {
    thresholds: { ok: quantile(sorted, 0.3), busy: quantile(sorted, 0.7) },
    avg,
    useMonth,
    holidayWeight,
    holidaySamples: holidayTotals.length,
    rangeLabel: fmtDateRange(entries),
    byDate,
    overallMean: Math.round(mean(sorted)),
  };
}

function levelOf(v: number, t: ForecastModel["thresholds"]): CongestionLevel {
  if (v <= t.ok) return "ok";
  if (v >= t.busy) return "busy";
  return "mid";
}

/** 단일 날짜 예보 (실측 있으면 실측, 없으면 예측) */
export function forecastDate(model: ForecastModel, date: string): ForecastCell {
  const holidayName = getHoliday(date);
  const actual = model.byDate.get(date);

  if (actual) {
    return {
      date,
      level: levelOf(actual.total, model.thresholds),
      expected: actual.total,
      basis: `실측: ${date} 총 입장객 ${actual.total.toLocaleString("ko-KR")}명`,
      predicted: false,
      holidayName,
    };
  }

  const d = dow(date);
  const key = model.useMonth ? `${Number(date.slice(5, 7))}-${d}` : `${d}`;
  const stat = model.avg.get(key);
  const base = stat?.mean ?? model.overallMean;
  const weighted = holidayName ? base * model.holidayWeight : base;
  const expected = Math.round(weighted);

  const monthPart = model.useMonth ? `${Number(date.slice(5, 7))}월 ` : "";
  let basis = `${model.rangeLabel} ${monthPart}${WEEKDAY_KO[d]}요일 평균 ${Math.round(base).toLocaleString("ko-KR")}명`;
  if (holidayName && model.holidayWeight !== 1) {
    basis += ` × 공휴일 가중 ${model.holidayWeight.toFixed(2)} (${holidayName})`;
  }

  return {
    date,
    level: levelOf(expected, model.thresholds),
    expected,
    basis,
    predicted: true,
    holidayName,
  };
}

/** 기간 예보 (캘린더용) */
export function forecastRange(model: ForecastModel, from: string, to: string): ForecastCell[] {
  const out: ForecastCell[] = [];
  const cur = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cur <= end) {
    out.push(forecastDate(model, cur.toISOString().slice(0, 10)));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
