"use client";

import { useMemo } from "react";
import Image from "next/image";

type Direction = "ltr" | "rtl";

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
    size: 240 + Math.floor(rand() * 100), // Much larger fish
    threshold,
    yPercent: 12 + Math.floor(rand() * 64),
    direction: rand() > 0.5 ? "ltr" : "rtl",
    swimDuration: 26 + Math.floor(rand() * 12),
    bodyDuration: 3.5 + rand() * 1.5,
    tailDuration: 2 + rand() * 0.8,
    delay: Math.floor(rand() * 10),
    variant: Math.floor(rand() * 3), // kept for seed consistency
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
        const facingTransform = fish.direction === "ltr" ? "scaleX(-1)" : "scaleX(1)";

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
                      width: fish.size,
                      height: fish.size * 0.6,
                      position: 'relative',
                    } as React.CSSProperties
                  }
                >
                  {/* Head Part - Static */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      clipPath: 'inset(0 30% 0 0)', // Shows only left 70%
                    }}
                  >
                    <Image 
                      src="/Glowing fish in deep blue waters.png" 
                      alt="Glowing Fish Head" 
                      fill 
                      unoptimized
                      className="object-contain mix-blend-color-dodge opacity-90"
                      style={{ filter: "brightness(1.5) contrast(1.5) grayscale(0.2)" }}
                    />
                  </div>

                  {/* Tail Part - Wagging */}
                  <div
                    className="fish-tail-wag"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      clipPath: 'inset(0 0 0 69.5%)', // Shows only right 30.5%
                      transformOrigin: '70% 50%', // Anchor exactly at the cut
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <Image 
                      src="/Glowing fish in deep blue waters.png" 
                      alt="Glowing Fish Tail" 
                      fill 
                      unoptimized
                      className="object-contain mix-blend-color-dodge opacity-90"
                      style={{ filter: "brightness(1.5) contrast(1.5) grayscale(0.2)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fish-tail-wag {
              animation: fish-tail-wag-anim var(--tail-duration, 2s) ease-in-out infinite alternate;
            }

            @keyframes fish-swim-right {
              0% { transform: translateX(-200px); }
              100% { transform: translateX(calc(100vw + 200px)); }
            }

            @keyframes fish-swim-left {
              0% { transform: translateX(calc(100vw + 200px)); }
              100% { transform: translateX(-200px); }
            }

            @keyframes fish-body-drift {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-4px) rotate(-1.5deg); }
              50% { transform: translateY(-1px) rotate(0.8deg); }
              75% { transform: translateY(3px) rotate(-0.5deg); }
            }

            @keyframes fish-tail-wag-anim {
              0% { 
                transform: perspective(600px) rotateY(35deg); 
              }
              100% { 
                transform: perspective(600px) rotateY(-35deg); 
              }
            }
          `,
        }}
      />
    </>
  );
}
