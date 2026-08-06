/**
 * status.ts — "실시간 예약 현황" 데이터 로드
 * 6/1~8/10 = 이용자 현황(predicted=false), 8/11~10/11 = 예약자 현황(predicted=true)
 */
import statusJson from "../../data/live_status.json";
import type { ForecastCell } from "./forecast";

export interface LiveStatus {
  dataDate: string;
  usageThresholds: { ok: number; busy: number };
  resvThresholds: { ok: number; busy: number };
  cells: ForecastCell[];
}

export const liveStatus = statusJson as unknown as LiveStatus;
export const statusCells: ForecastCell[] = liveStatus.cells;
