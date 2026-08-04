/**
 * verify_forecast.ts — M1 검증: 등급 분포·공휴일 가중·basis 콘솔 확인
 * 실행: npm run verify
 */
import entryJson from "../data/snapshot_entry.json";
import { buildModel, forecastRange, type DailyEntry } from "../src/lib/forecast";

const entries = entryJson as DailyEntry[];
const model = buildModel(entries);

console.log("── 모델 요약 ──────────────────────────");
console.log(`데이터 기간      : ${entries[0].date} ~ ${entries.at(-1)!.date} (${entries.length}일)`);
console.log(`평균 방식        : ${model.useMonth ? "월×요일" : "요일 (자동 강등 — 데이터 4개월 미만)"}`);
console.log(`등급 임계값      : ok ≤ ${model.thresholds.ok.toLocaleString()} / busy ≥ ${model.thresholds.busy.toLocaleString()}`);
console.log(`공휴일 가중      : ×${model.holidayWeight.toFixed(3)} (표본 ${model.holidaySamples}일)`);

console.log("\n── 실측 등급 분포 (스냅샷 기간) ──────────");
const past = forecastRange(model, entries[0].date, entries.at(-1)!.date);
const dist = (cells: typeof past) =>
  ["ok", "mid", "busy"]
    .map((l) => `${l}: ${cells.filter((c) => c.level === l).length}일`)
    .join(" / ");
console.log(dist(past));

console.log("\n── 예측 등급 분포 (향후 8주) ─────────────");
const future = forecastRange(model, "2026-08-04", "2026-09-28");
console.log(dist(future));

console.log("\n── 이번 주 예보 샘플 ─────────────────────");
for (const c of forecastRange(model, "2026-08-04", "2026-08-10")) {
  console.log(
    `${c.date} [${c.level.padEnd(4)}] ${c.expected.toLocaleString().padStart(6)}명 ${c.predicted ? "(예측)" : "(실측)"} — ${c.basis}`
  );
}

console.log("\n── 공휴일 케이스 (광복절 연휴) ────────────");
for (const c of forecastRange(model, "2026-08-14", "2026-08-17")) {
  console.log(`${c.date} [${c.level.padEnd(4)}] ${c.expected.toLocaleString().padStart(6)}명 — ${c.basis}`);
}
