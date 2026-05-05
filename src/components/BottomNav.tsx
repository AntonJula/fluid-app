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
      className={`fixed inset-x-0 bottom-0 z-[80] pointer-events-none transition-all duration-700 ease-out ${
        hideNav ? "translate-y-32 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        transform: hideNav ? "translateY(8rem)" : "translateY(0px)",
        transition: `opacity 700ms ease-out, transform 700ms ease-out`,
        willChange: "transform",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-24 bg-gradient-to-t from-black/76 via-black/38 to-transparent" />

      <nav
        data-bottom-nav="true"
        className="pointer-events-auto relative w-full overflow-hidden bg-transparent"
      >
        <div className="mx-auto flex w-full max-w-md items-end justify-around px-8 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex min-w-[4.25rem] flex-col items-center justify-end rounded-2xl py-1.5 transition-transform duration-300 active:scale-95"
              >
                <div
                  className={`flex h-8.5 w-8.5 items-center justify-center transition-all duration-300 sm:h-9 sm:w-9 ${
                    isActive
                      ? "text-white drop-shadow-[0_5px_10px_rgba(0,0,0,0.45)]"
                      : "text-water-100/55 drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)] hover:text-water-100/85"
                  }`}
                >
                  <Icon className="h-5.5 w-5.5 sm:h-5.75 sm:w-5.75" strokeWidth={isActive ? 2.8 : 2.35} />
                </div>

                <span
                  className={`font-ui mt-1 text-[0.66rem] font-bold tracking-normal transition-colors duration-300 sm:text-[0.69rem] ${
                    isActive ? "text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.55)]" : "text-water-100/58"
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
