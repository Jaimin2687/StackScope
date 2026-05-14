export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-20 px-8 flex flex-col items-center justify-center relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>
      <div className="z-10 w-full max-w-md">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">Payments are handled via Razorpay</h1>
          <p className="text-sm text-neutral-400">
            StackScope now issues milestone payment links through Razorpay Route. Please return to your scope and
            generate a milestone link there.
          </p>
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black shadow transition-colors hover:bg-neutral-200"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
