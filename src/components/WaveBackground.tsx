"use client";

import React, { useEffect, useState } from "react";

interface WaveBackgroundProps {
  progress?: number; // 0 to 1
}

export function WaveBackground({ progress = 0.5 }: WaveBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Map progress (0-1) to vertical position (80% to 0%)
  const fillHeight = Math.max(0, Math.min(100, progress * 100));
  const topOffset = `${100 - fillHeight}%`;

  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden bg-background transition-all duration-1000 ease-in-out"
      style={{
        background: `linear-gradient(to top, var(--color-water-100) ${fillHeight}%, transparent ${fillHeight}%)`
      }}
    >
      {/* Wave SVG Animation */}
      <div 
        className="absolute left-0 right-0 w-[200%] transition-all duration-1000 ease-in-out" 
        style={{ top: topOffset, transform: "translateY(-50%)" }}
      >
        <svg
          className="w-full h-auto text-water-100 animate-[wave_10s_linear_infinite]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z"
          />
        </svg>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
