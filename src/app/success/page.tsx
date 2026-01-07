import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
