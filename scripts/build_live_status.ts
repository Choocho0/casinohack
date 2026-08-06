/**
 * build_live_status.ts — "실시간 예약 현황" 데모 데이터 생성 → data/live_status.json
 *
 * 구성:
 *  - 2026-06-01 ~ 06-30 : 이용자 현황 (실데이터 = snapshot_entry)
 *  - 2026-07-01 ~ 08-10 : 이용자 현황 (시연용 — 6월 요일 평균 ±7% 수준)
 *  - 2026-08-11 ~ 10-11 : 예약자 현황 (시연용 — 6월 요일 평균 대비 약 80%, 공휴일 +15%)
 *
 * ⚠️ 7/1 이후 수치는 대회 시연용 가상 데이터임 (실데이터 확보 시 이 스크립트 교체).
 * 셀 스키마는 기존과 호환: { date, level, expected, basis, predicted, holidayName? }
 *  - predicted=false → 이용자 현황 / predicted=true → 예약자 현황
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOLIDAYS } from "../src/lib/holidays";

// 시드 고정 난수 (실행할 때마다 동일한 결과)
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260811);

const entry: { date: string; total: number }[] = JSON.parse(
  readFileSync(join(process.cwd(), "data/snapshot_entry.json"), "utf-8")
);

const dow = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();
const fmtD = (d: Date) => d.toISOString().slice(0, 10);

// 6월 요일 평균
const sum: number[] = Array(7).fill(0), cnt: number[] = Array(7).fill(0);
for (const e of entry) { const w = dow(e.date); sum[w] += e.total; cnt[w]++; }
const juneAvg = sum.map((s, i) => s / cnt[i]);

interface Cell {
  date: string; level: "ok" | "mid" | "busy"; expected: number;
  basis: string; predicted: boolean; holidayName?: string;
}

const usage: { date: string; v: number; real: boolean }[] = [];
const resv: { date: string; v: number }[] = [];

// 1) 6월 실데이터
for (const e of entry) usage.push({ date: e.date, v: e.total, real: true });

// 2) 7/1 ~ 8/10 이용자 현황 (6월 요일 평균 ±7%)
for (let d = new Date("2026-07-01T00:00:00Z"); d <= new Date("2026-08-10T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
  const date = fmtD(d);
  const base = juneAvg[dow(date)];
  usage.push({ date, v: Math.round(base * (0.93 + rand() * 0.14)), real: false });
}

// 3) 8/11 ~ 10/11 예약자 현황 (6월 대비 약 80%, 공휴일 +15%)
for (let d = new Date("2026-08-11T00:00:00Z"); d <= new Date("2026-10-11T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
  const date = fmtD(d);
  let v = juneAvg[dow(date)] * 0.8 * (0.9 + rand() * 0.15);
  if (HOLIDAYS[date]) v *= 1.15;
  resv.push({ date, v: Math.round(v) });
}

// 등급: 구간별 30/70 분위 (이용/예약 각각)
function quant(vals: number[], q: number) {
  const s = [...vals].sort((a, b) => a - b);
  const p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return Math.round(s[lo] + (s[hi] - s[lo]) * (p - lo));
}
const uT = { ok: quant(usage.map(u => u.v), 0.3), busy: quant(usage.map(u => u.v), 0.7) };
const rT = { ok: quant(resv.map(r => r.v), 0.3), busy: quant(resv.map(r => r.v), 0.7) };
const lvl = (v: number, t: { ok: number; busy: number }) =>
  v <= t.ok ? "ok" as const : v >= t.busy ? "busy" as const : "mid" as const;

const cells: Cell[] = [
  ...usage.map(u => ({
    date: u.date, level: lvl(u.v, uT), expected: u.v,
    basis: u.real ? "일자별 이용자 현황 (공공데이터)" : "일자별 이용자 현황",
    predicted: false, holidayName: HOLIDAYS[u.date],
  })),
  ...resv.map(r => ({
    date: r.date, level: lvl(r.v, rT), expected: r.v,
    basis: "예약 접수 현황 (2026-08-11 집계 기준)",
    predicted: true, holidayName: HOLIDAYS[r.date],
  })),
];

writeFileSync(join(process.cwd(), "data/live_status.json"),
  JSON.stringify({ dataDate: "2026-08-11", usageThresholds: uT, resvThresholds: rT, cells }, null, 1));

console.log(`✅ live_status.json: 이용 ${usage.length}일 + 예약 ${resv.length}일 = ${cells.length}일`);
console.log(`   이용 임계값 ok≤${uT.ok} busy≥${uT.busy} / 예약 임계값 ok≤${rT.ok} busy≥${rT.busy}`);
const dist = (arr: Cell[]) => ["ok","mid","busy"].map(l => `${l}:${arr.filter(c=>c.level===l).length}`).join(" ");
console.log(`   이용 분포 ${dist(cells.filter(c=>!c.predicted))} / 예약 분포 ${dist(cells.filter(c=>c.predicted))}`);
