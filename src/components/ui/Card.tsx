import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`min-w-0 rounded-[1.15rem] border border-water-300/12 bg-water-900/15 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-300 min-[380px]:rounded-[1.35rem] sm:rounded-[1.5rem] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
