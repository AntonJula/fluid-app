import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "brightOutline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "font-ui fluid-button relative isolate overflow-hidden inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-2xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none";
  
  const variants = {
    primary: "border border-cyan-50/36 bg-gradient-to-b from-cyan-100 via-cyan-200 to-cyan-300 text-water-950 shadow-[0_8px_20px_rgba(8,145,178,0.18),inset_0_1px_0_rgba(255,255,255,0.68)] hover:-translate-y-0.5 hover:brightness-105",
    secondary: "border border-water-200/16 bg-water-950/28 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md hover:-translate-y-0.5 hover:border-water-100/24 hover:bg-water-700/38",
    ghost: "bg-transparent text-water-300 hover:bg-water-800/40 hover:text-white transition-colors",
    brightOutline: "border border-white/55 bg-white/[0.035] text-white hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/[0.07]",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="pointer-events-none relative inline-flex items-center justify-center">{children}</span>
    </button>
  );
}
