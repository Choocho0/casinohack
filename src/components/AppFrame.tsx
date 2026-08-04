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
        <div className="flex items-end justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Nowcast<span className="text-gold">.</span>
          </h1>
          <DataDate initial={dataDate ?? "준비 중"} />
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 pt-2">{children}</main>

      <TabBar />
    </div>
  );
}
