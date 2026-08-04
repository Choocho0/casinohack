/**
 * AI 가이드 챗봇 탭 (CLAUDE.md §6-3)
 */
import ChatUI from "@/components/ChatUI";

export default function GuidePage() {
  return (
    <div>
      <p className="text-sm font-semibold">
        Nowcast AI<span className="text-gold"> 가이드</span>
      </p>
      <p className="mb-2 mt-1 text-[11px] text-text-sub">
        혼잡 예보·게임 방법·이용 절차를 데이터 근거와 함께 안내해요
      </p>
      <ChatUI />
    </div>
  );
}
