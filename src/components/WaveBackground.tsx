"use client";

import { FishLayer } from "./FishLayer";

interface WaveBackgroundProps {
  progress?: number; // 0 to 1
}

export function WaveBackground({ progress = 0.5 }: WaveBackgroundProps) {
  const fillHeight = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      {/* Single water body — anchored to bottom, grows upward with progress */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ height: `calc(${fillHeight}% + 8rem)` }}
      >
        {/* Animated wave surface at the top of the water body */}
        <div className="absolute top-0 left-0 right-0 h-32 w-[200%] pointer-events-none">
          <svg
            className="absolute top-0 w-full h-full text-water-900 animate-[wave_24s_linear_infinite]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="currentColor" d="M0,25 C150,50 350,0 600,25 C750,50 950,0 1200,25 L1200,120 L0,120 Z" />
          </svg>

          <svg
            className="absolute top-0 w-full h-full text-water-800 animate-[wave_16s_linear_infinite_reverse]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="currentColor" d="M0,40 C150,10 350,70 600,40 C750,10 950,70 1200,40 L1200,120 L0,120 Z" />
          </svg>

          <svg
            className="absolute top-0 w-full h-full text-water-700 animate-[wave_12s_linear_infinite]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="currentColor" d="M0,60 C200,80 400,40 600,60 C800,80 1000,40 1200,60 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* Solid fill — sits directly below waves, same color as front wave */}
        <div className="absolute left-0 right-0 bottom-0 top-32 bg-water-700 overflow-hidden">
          {/* Fish swim within the water */}
          <FishLayer progress={progress} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
