/**
 * build_snapshot.ts — 원본 CSV(공공데이터포털, CP949) → data/*.json 전처리
 *
 * 실행: npm run snapshot
 *
 * ⚠️ CLAUDE.md §5-1: 컬럼명은 실제 CSV 헤더 기준. 아래 매핑 상수만 고치면
 *    다른 기간/포맷의 CSV(예: 다년치 일자별 입장객 현황)로 교체 가능.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RAW_DIR = join(process.cwd(), "data_raw");
const OUT_DIR = join(process.cwd(), "data");

/* ──────────────────────── 매핑 상수 (실제 CSV 헤더) ──────────────────────── */

// (주)강원랜드_내국인 카지노 입장권 발행대비 출입현황
const NOSHOW_DOM = {
  file: "noshow_domestic.csv",
  date: "입장일자",
  issued: "내국인 입장권 발행수",
  entered: "내국인 실제 입장인원수",
  noshow: "내국인 미입장인원수",
};

// (주)강원랜드_외국인 카지노 입장권 발행대비 출입현황
const NOSHOW_FOR = {
  file: "noshow_foreign.csv",
  date: "입장일자",
  issued: "외국인 입장권 발행수",
  entered: "외국인 실제 입장인원수",
  noshow: "외국인 미입장인원수",
};

// (주)강원랜드_외국인 국가별 일일 카지노 입장현황
const ENTRY_FOR = {
  file: "entry_foreign_daily.csv",
  date: "입장일자",
  country: "국가명",
  count: "외국인 입장객 수",
};

// (주)강원랜드_카지노게임현황
const GAMES = {
  file: "games.csv",
  year: "연도",
  name: "게임명",
  units: "대수",
};

/* ──────────────── 게임별 편집 메타 (난이도·한줄설명 — CLAUDE.md §6-2) ──────────────── */

const GAME_META: Record<string, { difficulty: "입문" | "쉬움" | "보통"; blurb: string }> = {
  비디오게임: { difficulty: "입문", blurb: "버튼 몇 번이면 시작 — 좌석이 가장 많아 기다림이 적어요" },
  슬롯머신: { difficulty: "입문", blurb: "레버/버튼만 누르면 되는 대표 입문 기기" },
  빅휠: { difficulty: "입문", blurb: "돌아가는 휠의 숫자를 고르는 가장 단순한 테이블 게임" },
  카지노워: { difficulty: "입문", blurb: "딜러와 카드 한 장씩, 높은 쪽이 이기는 초간단 룰" },
  바카라: { difficulty: "쉬움", blurb: "플레이어/뱅커 중 한쪽을 고르는 인기 테이블 게임" },
  룰렛: { difficulty: "쉬움", blurb: "구슬이 멈출 숫자·색을 예상하는 클래식 게임" },
  다이사이: { difficulty: "쉬움", blurb: "주사위 3개의 합을 맞히는 직관적인 게임" },
  "전자게임(바카라)": { difficulty: "쉬움", blurb: "화면으로 즐기는 바카라 — 딜러 대면이 부담될 때" },
  "전자게임(블랙잭)": { difficulty: "쉬움", blurb: "화면으로 즐기는 블랙잭 — 천천히 연습하기 좋아요" },
  "전자게임(룰렛)": { difficulty: "쉬움", blurb: "화면으로 즐기는 룰렛 — 자기 페이스로 진행" },
  "전자게임(다이사이)": { difficulty: "쉬움", blurb: "화면으로 즐기는 다이사이" },
  블랙잭: { difficulty: "보통", blurb: "21에 가깝게 만드는 게임 — 기본 규칙 숙지 후 추천" },
  쓰리카드: { difficulty: "보통", blurb: "카드 3장으로 딜러와 겨루는 포커류 게임" },
  캐리비안스터드: { difficulty: "보통", blurb: "5장 포커 족보로 딜러와 겨루는 게임" },
  텍사스홀덤: { difficulty: "보통", blurb: "공유 카드로 최고의 패를 만드는 포커 — 규칙 학습 필요" },
};

/* ──────────────────────────── 유틸 ──────────────────────────── */

function readCsv(name: string): Record<string, string>[] {
  const buf = readFileSync(join(RAW_DIR, name));
  // 공공데이터포털 CSV는 CP949(EUC-KR 계열) — Node 내장 TextDecoder 사용
  const text = new TextDecoder("euc-kr").decode(buf);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

const num = (v: string) => Number(String(v).replace(/[^0-9.-]/g, "")) || 0;

/* ──────────────────────────── 빌드 ──────────────────────────── */

function main() {
  if (!existsSync(RAW_DIR)) {
    console.error(`❌ ${RAW_DIR} 폴더가 없습니다. 원본 CSV를 data_raw/에 넣어주세요.`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  // 1) 일자별 입장객: 내국인 실입장 + 외국인 일별 합계 → 총 입장객
  //    ※ 현재 확보 데이터 기준. 다년치 "일자별 카지노 입장객 현황" CSV 확보 시
  //      매핑 상수만 추가해 동일 스키마로 확장한다.
  const domRows = readCsv(NOSHOW_DOM.file);
  const forRows = readCsv(ENTRY_FOR.file);

  const foreignByDate = new Map<string, number>();
  for (const r of forRows) {
    const d = r[ENTRY_FOR.date];
    foreignByDate.set(d, (foreignByDate.get(d) ?? 0) + num(r[ENTRY_FOR.count]));
  }

  const entry = domRows
    .map((r) => {
      const date = r[NOSHOW_DOM.date];
      const domestic = num(r[NOSHOW_DOM.entered]);
      const foreign = foreignByDate.get(date) ?? 0;
      return { date, domestic, foreign, total: domestic + foreign };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  writeFileSync(join(OUT_DIR, "snapshot_entry.json"), JSON.stringify(entry, null, 2));

  // 2) 노쇼: 내국인/외국인 발행 대비 실입장
  const noshow = {
    domestic: domRows.map((r) => ({
      date: r[NOSHOW_DOM.date],
      issued: num(r[NOSHOW_DOM.issued]),
      entered: num(r[NOSHOW_DOM.entered]),
      noshow: num(r[NOSHOW_DOM.noshow]),
    })),
    foreign: readCsv(NOSHOW_FOR.file).map((r) => ({
      date: r[NOSHOW_FOR.date],
      issued: num(r[NOSHOW_FOR.issued]),
      entered: num(r[NOSHOW_FOR.entered]),
      noshow: num(r[NOSHOW_FOR.noshow]),
    })),
  };
  writeFileSync(join(OUT_DIR, "snapshot_noshow.json"), JSON.stringify(noshow, null, 2));

  // 3) 게임현황 + 편집 메타
  const games = readCsv(GAMES.file)
    .map((r) => {
      const name = r[GAMES.name];
      const meta = GAME_META[name];
      return {
        year: num(r[GAMES.year]),
        name,
        units: num(r[GAMES.units]),
        difficulty: meta?.difficulty ?? "보통",
        blurb: meta?.blurb ?? "",
      };
    })
    // 좌석 규모 내림차순, 단 전자게임 시리즈는 맨 뒤에 한 묶음으로
    .sort((a, b) => {
      const ea = a.name.startsWith("전자게임") ? 1 : 0;
      const eb = b.name.startsWith("전자게임") ? 1 : 0;
      return ea !== eb ? ea - eb : b.units - a.units;
    });
  writeFileSync(join(OUT_DIR, "games.json"), JSON.stringify(games, null, 2));

  console.log(`✅ snapshot_entry.json  : ${entry.length}일 (${entry[0]?.date} ~ ${entry.at(-1)?.date})`);
  console.log(`✅ snapshot_noshow.json : 내국인 ${noshow.domestic.length}일 / 외국인 ${noshow.foreign.length}일`);
  console.log(`✅ games.json           : ${games.length}종`);
}

main();
