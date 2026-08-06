/**
 * 이용 안내 탭 — 시설 안내도 · ARS 입장순서 신청 · 처음 방문 절차
 */
import InfoGuide from "@/components/InfoGuide";

export default function HowtoPage() {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">
        이용 안내<span className="text-gold">.</span>
      </p>
      <InfoGuide />
    </div>
  );
}
