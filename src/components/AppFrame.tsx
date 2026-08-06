import TabBar from "@/components/TabBar";

/**
 * 모바일 앱 프레임
 * - max-w-[390px] 중앙 정렬, 하단 고정 탭바
 * - 헤더: 강원랜드 로고 + Nowcast + 태그라인
 * - 앱↔웹 전환 토글은 프레임 바깥 우측 상단에 고정
 */
export default function AppFrame({
  children,
}: {
  children: React.ReactNode;
  dataDate?: string;
}) {
  return (
    <>
      {/* 화면 전환 토글 — 앱 프레임 바깥 우측 상단 고정 */}
      <div className="fixed right-4 top-3 z-50 flex overflow-hidden rounded-xl border border-white/15 bg-bg-card/95 text-[13px] leading-none shadow-lg backdrop-blur">
        <a
          href="/web"
          className="px-3.5 py-2.5 font-semibold text-text-sub transition-colors hover:text-gold"
        >
          웹 페이지
        </a>
        <span className="bg-gold px-3.5 py-2.5 font-bold text-[#14161C]">앱 화면</span>
      </div>

      <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-bg-base">
        <header className="sticky top-0 z-20 bg-gradient-to-r from-bg-base via-bg-base to-burgundy/30 px-5 pb-3 pt-5 backdrop-blur">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kangwonland.png"
              alt="KANGWON LAND"
              className="h-[18px] w-auto"
            />
            <h1 className="text-lg font-bold tracking-tight">
              Nowcast<span className="text-gold">.</span>
            </h1>
            <span className="text-[10px] leading-tight text-text-sub">
              - 카지노 혼잡 예보·AI 가이드 서비스
            </span>
          </div>
        </header>

        <main className="flex-1 px-5 pb-24 pt-2">{children}</main>

        <TabBar />
      </div>
    </>
  );
}
