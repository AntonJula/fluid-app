export function HydrationLoadingState() {
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[23rem] flex-col items-center justify-center overflow-hidden bg-[#0a5b84] p-4 pb-24 sm:max-w-[26rem] sm:p-6 sm:pb-24 md:max-w-[30rem]">
      <section
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading Fluid"
        className="relative z-10 flex w-full flex-col items-center text-center"
      >
        <h1
          className="font-display text-[4.65rem] font-black leading-none tracking-normal text-white drop-shadow-[0_10px_22px_rgba(3,31,50,0.32)] min-[380px]:text-[5.45rem]"
          aria-hidden="true"
        >
          Fluid.
        </h1>
      </section>
    </main>
  );
}
