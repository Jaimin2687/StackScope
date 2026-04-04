import { Suspense } from "react";
import PaymentForm from "./PaymentForm";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-8 flex flex-col items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>
      <div className="z-10 w-full max-w-md">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-neutral-500">Loading payment details...</div>}>
          <PaymentForm />
        </Suspense>
      </div>
    </div>
  );
}
