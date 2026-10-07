import type { Metadata } from "next";
import { Suspense } from "react";
import ExamRoom from "@/components/exam/ExamRoom";

export const metadata: Metadata = {
  title: "Làm bài | NextGen Manager",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <ExamRoom />
    </Suspense>
  );
}
