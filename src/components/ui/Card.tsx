import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md border border-water-100 shadow-sm rounded-3xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
