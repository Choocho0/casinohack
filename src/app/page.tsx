import { redirect } from "next/navigation";

/** 첫 화면 = 웹 페이지 버전. 앱 화면은 /app */
export default function RootPage() {
  redirect("/web");
}
