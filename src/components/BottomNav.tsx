"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Droplets, Settings } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Droplets },
  { href: "/stats", label: "Stats", Icon: BarChart2 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hideNav, mounted } = useHydration();
  const [stablePathname, setStablePathname] = useState(pathname);

  useEffect(() => {
    const root = document.documentElement;

    const syncStablePathname = () => {
      const isSwipeActive =
        root.dataset.swipeDragging === "true" || root.dataset.swipeTransitioning === "true";

      if (!isSwipeActive) {
        setStablePathname(pathname);
      }
    };

    syncStablePathname();

    const observer = new MutationObserver(syncStablePathname);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-swipe-dragging", "data-swipe-transitioning"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 pointer-events-none transition-all duration-700 ease-out ${
        hideNav ? "translate-y-32 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        transform: hideNav ? "translateY(8rem)" : "translateY(0px)",
        transition: `opacity 700ms ease-out, transform 700ms ease-out`,
        willChange: "transform",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-5 bg-gradient-to-t from-water-950/50 via-water-950/10 to-transparent" />

      <nav
        data-bottom-nav="true"
        className="pointer-events-auto relative w-full overflow-hidden border-t border-white/8 bg-water-950 shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-water-300/12" />
        <div className="mx-auto flex w-full max-w-md items-end justify-around px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = stablePathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex min-w-[4rem] flex-col items-center justify-end"
              >
                <div
                  className={`flex h-8.5 w-8.5 items-center justify-center rounded-[0.85rem] transition-all duration-300 sm:h-9 sm:w-9 ${
                    isActive
                      ? "bg-water-400/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_18px_rgba(14,165,233,0.14)]"
                      : "text-water-200/62"
                  }`}
                >
                  <Icon className="h-4.25 w-4.25 sm:h-4.5 sm:w-4.5" strokeWidth={2.4} />
                </div>

                <span
                  className={`font-ui mt-0.5 text-[0.6rem] font-semibold tracking-wide transition-colors duration-300 sm:text-[0.63rem] ${
                    isActive ? "text-white" : "text-water-200/70"
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
