/**
 * data.ts — 스냅샷 로드 + 파생 통계 (CLAUDE.md §5-2, §5-4)
 * 모든 화면은 이 모듈(=커밋된 스냅샷)만으로 동작해야 한다 (절대 규칙 3).
 * API 최신분 병합은 M5에서 /api/forecast 라우트가 담당.
 */
import entryJson from "../../data/snapshot_entry.json";
import noshowJson from "../../data/snapshot_noshow.json";
import gamesJson from "../../data/games.json";
import { buildModel, type DailyEntry, type ForecastModel } from "./forecast";

export interface NoshowRow {
  date: string;
  issued: number;
  entered: number;
  noshow: number;
}

export interface Game {
  year: number;
  name: string;
  units: number;
  difficulty: "입문" | "쉬움" | "보통";
  blurb: string;
}

export const entries: DailyEntry[] = entryJson as DailyEntry[];
export const noshow: { domestic: NoshowRow[]; foreign: NoshowRow[] } =
  noshowJson as { domestic: NoshowRow[]; foreign: NoshowRow[] };
export const games: Game[] = gamesJson as Game[];

/** 데이터 기준일 = 스냅샷 마지막 날짜 (헤더 표시용) */
export function getDataBaseDate(): string {
  return entries.length ? entries[entries.length - 1].date : "-";
}

let _model: ForecastModel | null = null;
export function getModel(): ForecastModel {
  if (!_model) _model = buildModel(entries);
  return _model;
}

/** 노쇼율(%) = 미입장 ÷ 발행 (내국인 기준 메인 — §5-4) */
export function getNoshowStats() {
  const sum = (rows: NoshowRow[], k: keyof NoshowRow) =>
    rows.reduce((s, r) => s + (r[k] as number), 0);
  const dIssued = sum(noshow.domestic, "issued");
  const dNoshow = sum(noshow.domestic, "noshow");
  const fIssued = sum(noshow.foreign, "issued");
  const fNoshow = sum(noshow.foreign, "noshow");
  const period =
    noshow.domestic.length > 0
      ? `${noshow.domestic[0].date} ~ ${noshow.domestic[noshow.domestic.length - 1].date}`
      : "-";
  return {
    period,
    domestic: {
      issued: dIssued,
      noshow: dNoshow,
      ratePct: dIssued ? (dNoshow / dIssued) * 100 : 0,
    },
    foreign: {
      issued: fIssued,
      noshow: fNoshow,
      ratePct: fIssued ? (fNoshow / fIssued) * 100 : 0,
    },
  };
}
