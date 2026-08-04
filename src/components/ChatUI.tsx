"use client";

/**
 * AI 가이드 채팅 UI (CLAUDE.md §6-3)
 * 말풍선 + 스트리밍 타이핑 + 추천 질문 칩 3개
 */
import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const CHIPS = [
  "처음인데 뭐부터 해요?",
  "이번 주말 붐비나요?",
  "블랙잭 규칙 알려줘",
];

const WELCOME =
  "안녕하세요, 강원랜드 첫 방문을 돕는 Nowcast AI예요. 혼잡 예보, 게임 진행 방법, 이용 절차를 안내해 드립니다. 아래 추천 질문을 눌러보세요!";

export default function ChatUI() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    const history: Msg[] = [...msgs.filter((m) => m.content !== WELCOME), { role: "user", content: q }];
    setMsgs((cur) => [...cur, { role: "user", content: q }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMsgs((cur) => {
          const next = [...cur];
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }
    } catch {
      setMsgs((cur) => {
        const next = [...cur];
        next[next.length - 1] = {
          role: "assistant",
          content: "죄송해요, 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-235px)] flex-col">
      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-gold/90 text-[#14161C]"
                  : "rounded-bl-md bg-bg-card"
              }`}
            >
              {m.content ||
                (busy && i === msgs.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <Dot d="0ms" />
                    <Dot d="150ms" />
                    <Dot d="300ms" />
                  </span>
                ) : (
                  ""
                ))}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* 추천 질문 칩 */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            disabled={busy}
            className="shrink-0 rounded-full border border-gold/30 px-3 py-1.5 text-[11px] text-gold disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      {/* 입력창 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 pt-1"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="궁금한 점을 물어보세요"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-bg-card px-3.5 py-3 text-[13px] outline-none placeholder:text-text-sub/60 focus:border-gold/50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-gold px-4 text-sm font-semibold text-[#14161C] disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </div>
  );
}

function Dot({ d }: { d: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-sub"
      style={{ animationDelay: d }}
    />
  );
}
