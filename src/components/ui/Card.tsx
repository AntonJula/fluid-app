import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-water-900/15 backdrop-blur-sm border border-water-300/12 shadow-lg shadow-black/10 rounded-3xl p-6 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
