import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: "soft" | "strong";
}

export function Card({ children, className = "", glass = "soft", ...props }: CardProps) {
  const glassClass = glass === "strong" ? "fluid-glass-surface" : "fluid-glass-soft";

  return (
    <div
      className={`${glassClass} min-w-0 rounded-[1.15rem] border border-water-300/12 bg-water-900/15 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 min-[380px]:rounded-[1.35rem] sm:rounded-[1.5rem] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
