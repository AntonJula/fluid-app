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

  // Map progress (0-1) to vertical position (100% to 0%)
  const fillHeight = Math.max(0, Math.min(100, progress * 100));
  const topOffset = `${100 - fillHeight}%`;

  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none"
    >
      {/* Bottom fill that seamlessly connects to the front wave */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-water-700 will-change-transform"
        style={{ height: `${fillHeight}%` }}
      />
      
      {/* Wave Layers Animation */}
      <div 
        className="absolute left-0 right-0 w-[200%] h-32 md:h-48 will-change-transform pointer-events-none" 
        style={{ top: topOffset, transform: "translateY(-98%)" }}
      >
        {/* Back Wave (Tallest depth) */}
        <svg
          className="absolute top-0 w-full h-full text-water-900 animate-[wave_24s_linear_infinite]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d="M0,25 C150,50 350,0 600,25 C750,50 950,0 1200,25 L1200,120 L0,120 Z" />
        </svg>

        {/* Middle Wave (Medium tightness) */}
        <svg
          className="absolute top-0 w-full h-full text-water-800 animate-[wave_16s_linear_infinite_reverse]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d="M0,45 C75,70 175,20 300,45 C375,70 475,20 600,45 C675,70 775,20 900,45 C975,70 1075,20 1200,45 L1200,120 L0,120 Z" />
        </svg>

        {/* Front Wave (Highest base line to prevent dipping too low) */}
        <svg
          className="absolute top-0 w-full h-full text-water-700 animate-[wave_12s_linear_infinite]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="currentColor" d="M0,60 C200,80 400,40 600,60 C800,80 1000,40 1200,60 L1200,120 L0,120 Z" />
        </svg>
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
