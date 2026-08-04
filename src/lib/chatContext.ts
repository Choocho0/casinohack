/**
 * chatContext.ts — 챗봇 컨텍스트/시스템 프롬프트 구성 (CLAUDE.md §6-3)
 * 예보·게임·규칙 요약은 전부 스냅샷 데이터에서 생성 → 지어내기 방지의 근거.
 */
import { games, getModel, getDataBaseDate } from "./data";
import { forecastRange } from "./forecast";
import { LEVEL_LABEL } from "@/components/ForecastBadge";
import guidesJson from "../../data/game_guides.json";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export interface GameGuideEntry {
  summary: string;
  steps: string[];
}

export const guides: Record<string, GameGuideEntry> = (
  guidesJson as { guides: Record<string, GameGuideEntry> }
).guides;

/** 오늘부터 14일 예보 요약 (서버 기준 KST) */
export function forecastSummary(todayISO: string): string {
  const model = getModel();
  const end = new Date(`${todayISO}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 13);
  const cells = forecastRange(model, todayISO, end.toISOString().slice(0, 10));
  return cells
    .map((c) => {
      const d = new Date(`${c.date}T00:00:00Z`).getUTCDay();
      const hol = c.holidayName ? ` ${c.holidayName}` : "";
      return `${c.date}(${WEEKDAY_KO[d]})${hol}: ${LEVEL_LABEL[c.level]}${
        c.predicted ? "(예측)" : ""
      } 예상 ${c.expected.toLocaleString("ko-KR")}명 — ${c.basis}`;
    })
    .join("\n");
}

export function gamesSummary(): string {
  return games
    .map((g) => `${g.name}: ${g.units}대, 난이도 ${g.difficulty} — ${g.blurb}`)
    .join("\n");
}

export function guidesSummary(): string {
  return Object.entries(guides)
    .map(([name, g]) => `[${name}] ${g.summary} 진행: ${g.steps.join(" → ")}`)
    .join("\n");
}

export function buildSystemPrompt(todayISO: string): string {
  return `너는 강원랜드 카지노 첫 방문자를 돕는 안내 도우미 "Nowcast AI"다.
오늘 날짜: ${todayISO} / 데이터 기준일: ${getDataBaseDate()}

[컨텍스트]
1. 향후 2주 혼잡 예보:
${forecastSummary(todayISO)}

2. 게임별 좌석 규모 (카지노게임현황 데이터):
${gamesSummary()}

3. 게임 규칙 요약 (팀 편집본):
${guidesSummary()}

4. 이용 절차: 신분증 지참 → 입장권 구매 → 환전소 칩 교환 → 게임 (하이원 공식 초보자 안내 기준)

[규칙]
- 답변 근거가 위 컨텍스트에 있으면 마지막 줄에 "근거: ..." 표기
- 컨텍스트에 없는 내용은 모른다고 답한다 (지어내기 금지)
- 미래 날짜의 혼잡 정보를 말할 때는 반드시 "예측"임을 밝힌다
- 승률·배팅 전략·필승법 질문은 정중히 거절하고 건전한 이용을 안내한다
- 미성년자 관련 질문에는 출입 불가(만 19세 이상)를 안내한다
- 게임을 더 하도록 부추기는 표현 금지. 헛걸음 방지·대기 단축·계획적 방문 관점 유지
- 존댓말, 3~6문장, 처음 방문자 눈높이`;
}

/* ─────────── 로컬 폴백 (ANTHROPIC_API_KEY 미설정/호출 실패 시) ─────────── */

export function localAnswer(question: string, todayISO: string): string {
  const q = question.toLowerCase();

  // 금지 주제 우선 처리
  if (/승률|필승|전략|배팅법|돈.*따|이기는\s*법/.test(q)) {
    return "죄송하지만 승률이나 배팅 전략에 대한 안내는 드리지 않아요. 카지노 게임의 결과는 예측할 수 없으며, 정해진 예산 안에서 여가로 즐기시는 것이 가장 좋습니다. 대신 혼잡이 덜한 방문일이나 게임 진행 방법은 얼마든지 알려드릴게요.";
  }
  if (/미성년|나이\s*제한|몇\s*살|만\s*19|학생/.test(q)) {
    return "강원랜드 카지노는 만 19세 이상만 출입할 수 있어요. 신분증을 반드시 지참하셔야 입장권 구매가 가능합니다.\n근거: 이용 절차 안내";
  }

  // 게임 규칙 질문
  for (const [name, g] of Object.entries(guides)) {
    const short = name.replace(/전자게임\(|\)/g, "");
    if (q.includes(name.toLowerCase()) || (short.length >= 2 && q.includes(short.toLowerCase()))) {
      const steps = g.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
      return `${name} 진행 방법을 알려드릴게요.\n\n${g.summary}\n\n${steps}\n\n근거: 게임 규칙 요약 (팀 편집본)`;
    }
  }

  // 혼잡/방문 시점 질문
  if (/주말|붐비|혼잡|언제|한산|여유|사람\s*많/.test(q)) {
    const model = getModel();
    const end = new Date(`${todayISO}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 6);
    const cells = forecastRange(model, todayISO, end.toISOString().slice(0, 10));
    const lines = cells
      .map((c) => {
        const d = new Date(`${c.date}T00:00:00Z`).getUTCDay();
        return `· ${Number(c.date.slice(5, 7))}/${Number(c.date.slice(8, 10))}(${WEEKDAY_KO[d]}) ${LEVEL_LABEL[c.level]}${c.predicted ? "(예측)" : ""} 예상 ${c.expected.toLocaleString("ko-KR")}명`;
      })
      .join("\n");
    const best = cells.reduce((a, b) => (b.expected < a.expected ? b : a));
    const bd = new Date(`${best.date}T00:00:00Z`).getUTCDay();
    return `이번 주 혼잡 예보(예측)입니다.\n\n${lines}\n\n가장 여유로운 날은 ${Number(best.date.slice(5, 7))}/${Number(best.date.slice(8, 10))}(${WEEKDAY_KO[bd]})로 예상돼요. 주말(금·토)은 혼잡 예측이 많으니 여유 있게 즐기시려면 평일 방문을 추천드립니다.\n\n근거: ${best.basis}`;
  }

  // 처음 방문/절차 질문
  if (/처음|뭐부터|절차|어떻게|입장|준비물|신분증/.test(q)) {
    const easy = games
      .filter((g) => g.difficulty === "입문")
      .slice(0, 3)
      .map((g) => `${g.name}(${g.units}대)`)
      .join(", ");
    return `처음 방문이시라면 이 순서로 진행하시면 됩니다.\n\n1. 신분증 지참 (만 19세 이상)\n2. 입장권 구매\n3. 환전소에서 현금을 칩으로 교환\n4. 게임 참여\n\n처음에는 좌석이 많고 규칙이 단순한 ${easy} 같은 입문 게임부터 시작하시는 걸 추천드려요. 게임 탭에서 각 게임의 진행 방법도 확인할 수 있습니다.\n근거: 이용 절차 안내, 카지노게임현황 데이터`;
  }

  return `안내 도우미 Nowcast AI입니다. 지금은 간단 안내 모드로 동작하고 있어요. 이런 질문에 답할 수 있습니다:\n\n· "이번 주말 붐비나요?" — 혼잡 예보 안내\n· "처음인데 뭐부터 해요?" — 이용 절차와 입문 게임\n· "블랙잭 규칙 알려줘" — 게임별 진행 방법\n\n위 주제 외의 내용은 제가 가진 데이터에 없어 정확히 답변드리기 어려워요.`;
}
