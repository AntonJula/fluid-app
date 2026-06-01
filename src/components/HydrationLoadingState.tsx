import { Droplets } from "lucide-react";

export function HydrationLoadingState() {
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[23rem] flex-col items-center justify-center overflow-hidden bg-background p-4 pb-24 sm:max-w-[26rem] sm:p-6 sm:pb-24 md:max-w-[30rem]">
      <section
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading Fluid"
        className="relative z-10 flex w-full max-w-[12rem] flex-col items-center text-center"
      >
        <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden="true">
          <div className="absolute -inset-4 rounded-full bg-cyan-300/10 blur-2xl animate-[loading-breathe_3.4s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="absolute inset-0 rounded-full border border-water-200/18 bg-gradient-to-br from-white/10 via-water-300/10 to-water-900/18 shadow-[0_22px_48px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-md animate-[loading-breathe_2.9s_ease-in-out_infinite] motion-reduce:animate-none" />
          <div className="absolute inset-3 rounded-full border border-cyan-100/22 bg-water-950/14" />
          <div className="absolute h-full w-full animate-[loading-orbit_2.8s_linear_infinite] motion-reduce:animate-none">
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(186,230,253,0.68)]" />
          </div>
          <Droplets className="relative z-10 h-12 w-12 text-water-100 drop-shadow-[0_0_20px_rgba(125,211,252,0.5)] animate-[loading-float_2.4s_ease-in-out_infinite] motion-reduce:animate-none" strokeWidth={2.45} />
        </div>
      </section>
    </main>
  );
}
