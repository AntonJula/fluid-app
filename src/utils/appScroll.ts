"use client";

export function getAppScrollElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  return document.querySelector<HTMLElement>("[data-app-scroll-root='true']");
}

export function getAppScrollY(): number {
  if (typeof window === "undefined") return 0;

  return getAppScrollElement()?.scrollTop ?? window.scrollY;
}

export function scrollAppTo(top: number, behavior: ScrollBehavior = "auto"): void {
  if (typeof window === "undefined") return;

  const scrollElement = getAppScrollElement();

  if (scrollElement) {
    scrollElement.scrollTo({ top, behavior });
    return;
  }

  window.scrollTo({ top, behavior });
}
