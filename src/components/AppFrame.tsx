import TabBar from "@/components/TabBar";
import DataDate from "@/components/DataDate";

/**
 * 모바일 앱 프레임 (CLAUDE.md §4)
 * - max-w-[390px] 중앙 정렬, 하단 고정 탭바
 * - 헤더: Nowcast 로고(골드 포인트) + 데이터 기준일
 */
export default function AppFrame({
  children,
  dataDate,
}: {
  children: React.ReactNode;
  dataDate?: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-bg-base">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-bg-base via-bg-base to-burgundy/30 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 화면 전환: 앱(현재) ↔ 웹 페이지 */}
            <div className="flex overflow-hidden rounded-lg border border-white/15 text-[10px] leading-none">
              <span className="bg-gold px-2 py-1.5 font-bold text-[#14161C]">앱</span>
              <a
                href="/web"
                className="px-2 py-1.5 font-semibold text-text-sub transition-colors hover:text-gold"
              >
                웹
              </a>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Nowcast<span className="text-gold">.</span>
            </h1>
          </div>
          <DataDate initial={dataDate ?? "준비 중"} />
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 pt-2">{children}</main>

      <TabBar />
    </div>
  );
}
