"use client";

import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function FluidMotion() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const scroller = document.querySelector<HTMLElement>("[data-app-scroll-root='true']");
      if (!scroller) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-fluid-reveal]:not([data-fluid-media]):not([data-fluid-stack])"
      );
      const mediaItems = gsap.utils.toArray<HTMLElement>("[data-fluid-media]");
      const stackItems = gsap.utils.toArray<HTMLElement>("[data-fluid-stack]");

      if (reduceMotion) {
        gsap.set([...revealItems, ...mediaItems, ...stackItems], {
          clearProps: "opacity,transform,filter",
        });
        return;
      }

      revealItems.forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 20, scale: 0.985 },
          {
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              scroller,
              start: "top 96%",
              end: "top 72%",
              scrub: 0.45,
            },
          }
        );

        element.style.setProperty("--fluid-reveal-order", String(index));
      });

      mediaItems.forEach((element) => {
        gsap.fromTo(
          element,
          { y: 18, scale: 0.97 },
          {
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              scroller,
              start: "top 96%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      stackItems.forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 32 + index * 6, scale: 0.96 },
          {
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              scroller,
              start: "top 94%",
              end: "top 64%",
              scrub: 0.55,
            },
          }
        );
      });

      const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        window.cancelAnimationFrame(refreshFrame);
      };
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return null;
}
