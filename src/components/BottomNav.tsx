"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart2, Droplets, Settings } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSwipeUiState } from "@/hooks/useSwipeUiState";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Droplets },
  { href: "/stats", label: "Stats", Icon: BarChart2 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hideNav: keepNavCompact, mounted } = useHydration();
  const swipeUi = useSwipeUiState();
  const activePathname = swipeUi.frozenPathname ?? pathname;
  const [isCompact, setIsCompact] = useState(false);
  const isCompactRef = useRef(false);
  const effectiveCompact = keepNavCompact || isCompact;

  useEffect(() => {
    const scrollRoot = document.querySelector<HTMLElement>("[data-app-scroll-root='true']");
    if (!scrollRoot) return;

    let lastScrollTop = Math.max(0, scrollRoot.scrollTop);
    let directionDistance = 0;
    let frameId: number | null = null;

    const updateCompactState = (compact: boolean) => {
      if (isCompactRef.current === compact) return;
      isCompactRef.current = compact;
      setIsCompact(compact);
    };

    const updateFromScroll = () => {
      frameId = null;
      const currentScrollTop = Math.max(0, scrollRoot.scrollTop);
      const delta = currentScrollTop - lastScrollTop;

      if (currentScrollTop <= 24) {
        directionDistance = 0;
        updateCompactState(false);
      } else if (Math.abs(delta) >= 0.5) {
        const directionChanged =
          (directionDistance > 0 && delta < 0) || (directionDistance < 0 && delta > 0);

        directionDistance = directionChanged ? delta : directionDistance + delta;

        if (directionDistance >= 16) {
          updateCompactState(true);
          directionDistance = 0;
        } else if (directionDistance <= -10) {
          updateCompactState(false);
          directionDistance = 0;
        }
      }

      lastScrollTop = currentScrollTop;
    };

    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateFromScroll);
    };

    updateCompactState(lastScrollTop > 24 && isCompactRef.current);
    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener("scroll", handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      data-bottom-nav-shell="true"
      data-swipe-ignore="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-3"
    >
      <nav
        data-bottom-nav="true"
        data-nav-compact={effectiveCompact ? "true" : "false"}
        className={`pointer-events-auto relative mx-auto mb-[max(0.6rem,env(safe-area-inset-bottom))] w-full overflow-hidden border border-cyan-100/18 bg-water-950/72 backdrop-blur-2xl transition-[max-width,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          effectiveCompact
            ? "max-w-[14.75rem] rounded-[1.2rem] shadow-[0_12px_30px_rgba(8,145,178,0.16),inset_0_1px_0_rgba(255,255,255,0.1)]"
            : "max-w-[22.5rem] rounded-[1.45rem] shadow-[0_16px_38px_rgba(8,145,178,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 mx-auto h-px max-w-[19rem] bg-gradient-to-r from-transparent via-white/52 to-transparent shadow-[0_0_14px_rgba(125,211,252,0.2)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-14 w-24 -translate-x-1/2 rounded-full bg-cyan-300/8 blur-2xl" />
        <div
          className={`mx-auto flex w-full items-end justify-between transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            effectiveCompact ? "px-2.5 py-1.5" : "px-4 py-2.5 sm:px-7"
          }`}
        >
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = activePathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className={`relative flex min-h-11 flex-col items-center justify-center rounded-[1.05rem] transition-[min-width,padding,background-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 ${
                  effectiveCompact ? "min-w-[3.7rem] px-2 py-1" : "min-w-[4.15rem] px-3 py-2"
                } ${
                  isActive ? "bg-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "hover:bg-white/[0.04]"
                }`}
              >
                <div
                  key={`${href}-${isActive ? "active" : "idle"}`}
                  className={`fluid-nav-icon relative flex items-center justify-center transition-[width,height,color,filter,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    effectiveCompact ? "h-7 w-7" : "h-8 w-8"
                  } ${
                    isActive
                      ? "fluid-nav-icon-active text-cyan-50 drop-shadow-[0_0_12px_rgba(103,232,249,0.32)]"
                      : "text-water-100/72 drop-shadow-[0_3px_8px_rgba(0,0,0,0.48)] hover:text-water-100/90"
                  }`}
                >
                  <Icon
                    className={`relative z-10 transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      effectiveCompact ? "h-4.5 w-4.5" : "h-5.5 w-5.5 sm:h-5.75 sm:w-5.75"
                    }`}
                    strokeWidth={isActive ? 2.8 : 2.35}
                  />
                </div>

                <span
                  aria-hidden={effectiveCompact}
                  className={`font-ui overflow-hidden text-[0.64rem] font-bold tracking-[0.01em] transition-[max-height,margin,opacity,transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-[0.68rem] ${
                    effectiveCompact ? "mt-0 max-h-0 -translate-y-1 opacity-0" : "mt-0.5 max-h-5 translate-y-0 opacity-100"
                  } ${
                    isActive ? "text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" : "text-water-100/64 drop-shadow-[0_2px_6px_rgba(0,0,0,0.38)]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
