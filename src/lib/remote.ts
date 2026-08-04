/**
 * remote.ts — 공공데이터포털 API 최신분 병합 (CLAUDE.md §5-2 하이브리드 전략)
 *
 * - DATA_GO_KR_API_KEY + DATA_GO_KR_API_URL(odcloud 요청주소)이 설정된 경우에만 호출
 * - 성공 시 스냅샷 이후 날짜의 입장객을 병합, 24시간 메모리 캐시
 * - 실패/미설정 시 조용히 스냅샷만 사용 (절대 규칙 3 — 화면 오류 금지)
 */
import { entries as snapshotEntries } from "./data";
import { buildModel, type DailyEntry, type ForecastModel } from "./forecast";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** odcloud 응답 행에서 날짜/인원 컬럼을 유연하게 탐색 (데이터셋별 컬럼명 차이 대응) */
const DATE_KEYS = ["입장일자", "기준일자", "일자", "날짜"];
const COUNT_KEYS = [
  "내국인 실제 입장인원수",
  "총 입장객",
  "입장객수",
  "입장객 수",
  "내국인 입장객",
  "외국인 입장객 수",
];

interface CacheBox {
  at: number;
  merged: DailyEntry[];
  model: ForecastModel;
  updated: boolean; // API 병합 성공 여부
}

let cache: CacheBox | null = null;

/** 포털의 Encoding 키(%포함)는 그대로, Decoding 키는 인코딩해서 사용 (이중 인코딩 방지) */
function keyParam(key: string): string {
  return key.includes("%") ? key : encodeURIComponent(key);
}

function pick(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    if (row[k] != null && row[k] !== "") return String(row[k]);
  }
  return null;
}

async function fetchRemoteRows(): Promise<DailyEntry[] | null> {
  const key = process.env.DATA_GO_KR_API_KEY;
  const url = process.env.DATA_GO_KR_API_URL;
  if (!key || !url) return null;

  try {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(
      `${url}${sep}page=1&perPage=1000&serviceKey=${keyParam(key)}`,
      { signal: AbortSignal.timeout(5000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Record<string, unknown>[] };
    if (!Array.isArray(json.data)) return null;

    const byDate = new Map<string, number>();
    for (const row of json.data) {
      const rawDate = pick(row, DATE_KEYS);
      const rawCount = pick(row, COUNT_KEYS);
      if (!rawDate || rawCount == null) continue;
      const date = rawDate.slice(0, 10).replace(/[./]/g, "-");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const n = Number(String(rawCount).replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(n)) continue;
      // 국가별 등 다행 구조면 일자별 합산
      byDate.set(date, (byDate.get(date) ?? 0) + n);
    }
    if (!byDate.size) return null;

    return Array.from(byDate.entries())
      .map(([date, total]) => ({ date, domestic: total, foreign: 0, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null; // 네트워크/타임아웃/파싱 실패 → 폴백
  }
}

/** 스냅샷 + API 최신분 병합 결과 (24h 캐시) */
export async function getMerged(): Promise<CacheBox> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;

  const remote = await fetchRemoteRows();
  let merged = snapshotEntries;
  let updated = false;

  if (remote) {
    const lastSnapshot = snapshotEntries[snapshotEntries.length - 1]?.date ?? "";
    const fresh = remote.filter((r) => r.date > lastSnapshot);
    if (fresh.length) {
      merged = [...snapshotEntries, ...fresh];
      updated = true;
    }
  }

  cache = { at: Date.now(), merged, model: buildModel(merged), updated };
  return cache;
}

/** 병합 기준 데이터 기준일 */
export async function getMergedDataDate(): Promise<string> {
  const { merged } = await getMerged();
  return merged[merged.length - 1]?.date ?? "-";
}

/* ───────── 실시간 외국인 입장 위젯 (§6-1 선택) ─────────
 * apis.data.go.kr/B552525/DailFgnCustCntService (JSON)
 * 엔드포인트는 공개 주소라 상수, 인증키는 환경변수만 사용 (절대 규칙 2).
 * 운영(오퍼레이션)명이 계정별 문서에 따라 다를 수 있어 후보를 순차 시도 후 캐시.
 */
const FGN_ENDPOINT =
  process.env.DATA_GO_KR_FGN_ENDPOINT ??
  "https://apis.data.go.kr/B552525/DailFgnCustCntService";
const FGN_OPS = ["", "/getDailFgnCustCnt", "/getDailFgnCustCntList"];
const FGN_TTL_MS = 10 * 60 * 1000;

export interface ForeignLiveData {
  date: string;
  total: number;
}

let fgnCache: { at: number; data: ForeignLiveData | null } | null = null;
let fgnOpFound: string | null = null;

function extractItems(json: unknown): Record<string, unknown>[] {
  const j = json as Record<string, any>;
  const cand =
    j?.response?.body?.items?.item ?? j?.response?.body?.items ?? j?.items ?? j?.data;
  if (Array.isArray(cand)) return cand;
  if (cand && typeof cand === "object") return [cand];
  return [];
}

export async function fetchForeignToday(): Promise<ForeignLiveData | null> {
  if (fgnCache && Date.now() - fgnCache.at < FGN_TTL_MS) return fgnCache.data;

  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) return null;

  let result: ForeignLiveData | null = null;
  const ops = fgnOpFound !== null ? [fgnOpFound] : FGN_OPS;

  for (const op of ops) {
    try {
      const res = await fetch(
        `${FGN_ENDPOINT}${op}?serviceKey=${keyParam(key)}&pageNo=1&numOfRows=500&_type=json`,
        { signal: AbortSignal.timeout(5000), cache: "no-store" }
      );
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) continue;
      const items = extractItems(JSON.parse(text));
      if (!items.length) continue;

      // 날짜/인원 필드를 유연하게 탐지 → 최신 일자 합계
      const byDate = new Map<string, number>();
      for (const it of items) {
        let date: string | null = null;
        let count: number | null = null;
        for (const [k, v] of Object.entries(it)) {
          const s = String(v ?? "");
          if (!date && /^(\d{4})[-./]?(\d{2})[-./]?(\d{2})$/.test(s.slice(0, 10).trim())) {
            const m = s.trim().match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
            if (m) date = `${m[1]}-${m[2]}-${m[3]}`;
          }
          if (count == null && /(cnt|수|인원)/i.test(k) && /^\d+$/.test(s.trim())) {
            count = Number(s.trim());
          }
        }
        if (date && count != null) byDate.set(date, (byDate.get(date) ?? 0) + count);
      }
      if (!byDate.size) continue;

      const latest = Array.from(byDate.keys()).sort().pop() as string;
      result = { date: latest, total: byDate.get(latest) as number };
      fgnOpFound = op;
      break;
    } catch {
      continue; // 다음 후보 시도
    }
  }

  fgnCache = { at: Date.now(), data: result };
  return result; // 전부 실패 → null (위젯 미표시, 절대 규칙 1·3)
}
