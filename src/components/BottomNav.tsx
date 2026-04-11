"use client";

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

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 pointer-events-none transition-all duration-700 ease-out ${
        hideNav ? "translate-y-32 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        transform: `translateX(var(--swipe-shell-offset, 0px)) scale(var(--swipe-shell-scale, 1)) ${hideNav ? "translateY(8rem)" : "translateY(0px)"}`,
        transition: `var(--swipe-shell-transition, transform 220ms ease-out), opacity 700ms ease-out`,
        filter:
          "brightness(calc(1 - var(--swipe-shell-dim, 0))) drop-shadow(0 18px 34px rgba(0, 0, 0, var(--swipe-shell-shadow, 0)))",
        transformOrigin: "center bottom",
        willChange: "transform, filter",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-14 bg-gradient-to-t from-water-950/68 via-water-950/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-20 bottom-full h-7 rounded-full bg-water-400/10 blur-2xl" />

      <nav className="pointer-events-auto relative w-full overflow-hidden border-t border-white/10 bg-[linear-gradient(180deg,rgba(12,74,110,0.94),rgba(8,47,73,0.98))] shadow-[0_-12px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white/[0.04] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-water-200/30 to-transparent" />
        <div className="mx-auto flex w-full max-w-md items-end justify-around px-4 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-1.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex min-w-[4.3rem] flex-col items-center justify-end"
              >
                <div
                  className={`flex h-9.5 w-9.5 items-center justify-center rounded-[0.9rem] transition-all duration-300 ${
                    isActive
                      ? "bg-water-400/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_20px_rgba(14,165,233,0.18)]"
                      : "text-water-200/65"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.4} />
                </div>

                <span
                  className={`font-ui mt-0.5 text-[0.64rem] font-semibold tracking-wide transition-colors duration-300 ${
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
