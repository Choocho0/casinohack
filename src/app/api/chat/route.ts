/**
 * /api/chat — Anthropic 프록시 (CLAUDE.md §6-3)
 * - ANTHROPIC_API_KEY 있으면 claude-sonnet-4-6 스트리밍
 * - 키 없음/호출 실패 시 스냅샷 기반 로컬 안내로 폴백 (절대 규칙 3)
 * - 키는 환경변수로만 관리 (절대 규칙 2)
 */
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, localAnswer } from "@/lib/chatContext";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function textStream(text: string): Response {
  // 로컬 폴백도 동일하게 스트리밍 형태로 반환 (타이핑 효과 유지)
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,8}/g) ?? [];
  const stream = new ReadableStream({
    async start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Mode": "local" },
  });
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = (body?.messages ?? []).filter(
      (m: ChatMessage) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0
    );
  } catch {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }
  if (!messages.length) return new Response("메시지가 없습니다.", { status: 400 });

  const today = todayKST();
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 키 미설정 → 로컬 안내 모드
  if (!apiKey) {
    return textStream(localAnswer(lastUser?.content ?? "", today));
  }

  try {
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: buildSystemPrompt(today),
      messages: messages.slice(-12),
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode("\n\n(연결이 잠시 불안정했어요. 다시 시도해 주세요.)")
          );
        }
        controller.close();
      },
    });
    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Mode": "ai" },
    });
  } catch {
    // API 실패 시에도 화면 오류 없이 로컬 안내로 폴백
    return textStream(localAnswer(lastUser?.content ?? "", today));
  }
}
