"use client";

import { useMemo } from "react";

type Direction = "ltr" | "rtl";

interface FishProps {
  size: number;
  variant: number;
}

interface FishConfig {
  id: number;
  size: number;
  threshold: number;
  yPercent: number;
  direction: Direction;
  swimDuration: number;
  bodyDuration: number;
  tailDuration: number;
  delay: number;
  variant: number;
}

function KoiPremium({ size, variant }: FishProps) {
  const shadowId = `fish-shadow-${variant}`;
  const bodyId = `fish-body-${variant}`;
  const tailId = `fish-tail-fill-${variant}`;
  const bodyOutline =
    variant === 1
      ? "M50 50C68 30 112 20 157 18C181 17 196 20 206 29C213 36 216 43 216 50C216 58 213 65 206 72C196 81 181 84 157 82C112 80 68 70 50 50Z"
      : variant === 2
        ? "M48 50C66 31 111 22 156 20C181 19 197 22 207 30C214 37 217 44 217 50C217 57 214 64 207 71C197 79 181 82 156 81C111 79 66 69 48 50Z"
        : "M49 50C67 30 111 21 156 19C181 18 197 21 207 29C214 36 217 43 217 50C217 58 214 65 207 72C197 80 181 83 156 82C111 80 67 70 49 50Z";

  const topContour =
    variant === 1
      ? "M66 43C91 32 125 28 164 30"
      : variant === 2
        ? "M67 42C93 32 127 28 165 31"
        : "M66 42C92 31 126 27 165 30";

  const lowerContour =
    variant === 1
      ? "M70 58C102 65 136 66 171 60"
      : variant === 2
        ? "M72 58C104 64 138 65 171 60"
        : "M71 58C103 65 137 66 171 60";

  return (
    <svg width={size} height={size * 0.36} viewBox="0 0 236 86" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={shadowId} x="-30%" y="-45%" width="170%" height="210%">
          <feDropShadow dx="0" dy="7" stdDeviation="5.2" floodColor="rgba(0,0,0,0.7)" />
          <feDropShadow dx="0" dy="1" stdDeviation="1.6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
        <linearGradient id={bodyId} x1="57" y1="18" x2="200" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(245,255,252,0.98)" />
          <stop offset="0.55" stopColor="rgba(233,252,246,0.96)" />
          <stop offset="1" stopColor="rgba(207,242,233,0.92)" />
        </linearGradient>
        <linearGradient id={tailId} x1="14" y1="9" x2="53" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-water-950)" />
          <stop offset="1" stopColor="var(--color-water-800)" />
        </linearGradient>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <g className="fish-tail" style={{ transformOrigin: "31px 43px" }}>
          <path
            d="M33 43C21 26 12 15 8 8C22 10 37 17 52 31L46 43H33Z"
            fill={`url(#${tailId})`}
            stroke="rgba(15,23,42,0.95)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M33 43C21 60 12 71 8 78C22 76 37 69 52 55L46 43H33Z"
            fill={`url(#${tailId})`}
            stroke="rgba(15,23,42,0.95)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 15L32 42" stroke="rgba(230,255,249,0.34)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M17 11L36 40" stroke="rgba(230,255,249,0.3)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M12 71L32 45" stroke="rgba(230,255,249,0.34)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M17 75L36 47" stroke="rgba(230,255,249,0.3)" strokeWidth="0.9" strokeLinecap="round" />
        </g>

        <path
          d={bodyOutline}
          fill={`url(#${bodyId})`}
          stroke="rgba(20,20,24,0.92)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        <path d={topContour} stroke="rgba(170,220,207,0.42)" strokeWidth="1" strokeLinecap="round" />
        <path d={lowerContour} stroke="rgba(110,172,156,0.28)" strokeWidth="0.95" strokeLinecap="round" />

        <path
          d="M110 19C119 10 132 9 142 14C133 20 122 23 110 19Z"
          fill="rgba(18,72,66,0.95)"
          stroke="rgba(16,16,18,0.86)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        <path
          d="M120 56C130 64 130 74 122 76C116 69 114 60 120 56Z"
          fill="rgba(32,32,36,0.95)"
          stroke="rgba(16,16,18,0.88)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M88 58C99 65 100 74 93 76C86 69 84 62 88 58Z"
          fill="rgba(236,249,245,0.96)"
          stroke="rgba(110,120,125,0.76)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <path
          d="M145 51C153 54 159 60 160 66C149 66 142 61 138 54"
          fill="rgba(20,20,24,0.95)"
          stroke="rgba(16,16,18,0.88)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        <path d="M72 39C76 34 82 33 86 37" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M84 34C89 29 95 29 100 34" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M95 39C100 34 107 34 112 39" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M110 33C115 28 121 28 126 33" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M120 39C125 34 132 34 137 39" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M136 32C141 27 147 27 152 32" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />
        <path d="M145 39C150 34 156 34 161 39" stroke="rgba(115,115,120,0.56)" strokeWidth="1" strokeLinecap="round" />

        <path d="M80 52C84 47 90 47 94 52" stroke="rgba(115,115,120,0.52)" strokeWidth="0.95" strokeLinecap="round" />
        <path d="M97 53C102 48 108 48 113 53" stroke="rgba(115,115,120,0.52)" strokeWidth="0.95" strokeLinecap="round" />
        <path d="M114 53C119 48 126 48 131 53" stroke="rgba(115,115,120,0.52)" strokeWidth="0.95" strokeLinecap="round" />
        <path d="M131 52C136 47 143 47 148 52" stroke="rgba(115,115,120,0.52)" strokeWidth="0.95" strokeLinecap="round" />

        <path d="M53 43C58 41 63 41 67 43" stroke="rgba(150,150,155,0.5)" strokeWidth="0.95" strokeLinecap="round" />
        <path d="M58 56C62 53 66 53 70 56" stroke="rgba(150,150,155,0.45)" strokeWidth="0.9" strokeLinecap="round" />

        <path d="M168 22C180 26 188 35 190 45" stroke="rgba(30,30,34,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="191" cy="38" r="2.2" fill="rgba(19,19,24,0.95)" />
        <path d="M201 48C205 49 207 52 208 56" stroke="rgba(22,22,26,0.92)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M205 44C209 43 212 44 214 46" stroke="rgba(22,22,26,0.75)" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateFishConfigs(): FishConfig[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rand = seededRandom(seed);
  const thresholds = [0.18, 0.28, 0.4, 0.55, 0.72, 0.86];

  return thresholds.map((threshold, index) => ({
    id: index,
    size: 86 + Math.floor(rand() * 28),
    threshold,
    yPercent: 12 + Math.floor(rand() * 64),
    direction: rand() > 0.5 ? "ltr" : "rtl",
    swimDuration: 18 + Math.floor(rand() * 10),
    bodyDuration: 2.8 + rand() * 1.3,
    tailDuration: 1 + rand() * 0.45,
    delay: Math.floor(rand() * 10),
    variant: Math.floor(rand() * 3),
  }));
}

interface FishLayerProps {
  progress: number;
}

export function FishLayer({ progress }: FishLayerProps) {
  const fishConfigs = useMemo(() => generateFishConfigs(), []);
  const visibleFish = fishConfigs.filter((fish) => progress >= fish.threshold);

  if (visibleFish.length === 0) return null;

  return (
    <>
      {visibleFish.map((fish) => {
        const swimAnimation = fish.direction === "ltr" ? "fish-swim-right" : "fish-swim-left";
        const facingTransform = fish.direction === "ltr" ? "scaleX(1)" : "scaleX(-1)";

        return (
          <div
            key={fish.id}
            className="absolute pointer-events-none"
            style={{
              top: `${fish.yPercent}%`,
              animation: `${swimAnimation} ${fish.swimDuration}s linear -${fish.delay}s infinite`,
              willChange: "transform",
            }}
          >
            <div style={{ transform: facingTransform, transformOrigin: "center center" }}>
              <div
                style={{
                  animation: `fish-body-drift ${fish.bodyDuration}s ease-in-out -${(
                    fish.delay * 0.12
                  ).toFixed(2)}s infinite`,
                }}
              >
                <div
                  style={
                    {
                      "--tail-duration": `${fish.tailDuration}s`,
                    } as React.CSSProperties
                  }
                >
                  <KoiPremium size={fish.size} variant={fish.variant} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fish-tail {
              animation: fish-tail-wag var(--tail-duration, 1.2s) ease-in-out infinite;
              transform-box: fill-box;
            }

            @keyframes fish-swim-right {
              0% { transform: translateX(-140px); }
              100% { transform: translateX(calc(100vw + 140px)); }
            }

            @keyframes fish-swim-left {
              0% { transform: translateX(calc(100vw + 140px)); }
              100% { transform: translateX(-140px); }
            }

            @keyframes fish-tail-wag {
              0%, 100% { transform: rotate(9deg); }
              50% { transform: rotate(-11deg); }
            }

            @keyframes fish-body-drift {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-3px) rotate(-1.2deg); }
              50% { transform: translateY(-1px) rotate(0.8deg); }
              75% { transform: translateY(2px) rotate(-0.7deg); }
            }
          `,
        }}
      />
    </>
  );
}
