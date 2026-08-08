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
  const baseStyles = "font-ui fluid-button relative isolate overflow-hidden inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-500 ease-out rounded-2xl active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-water-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-gradient-to-br from-cyan-300 via-water-400 to-water-600 text-water-950 shadow-lg shadow-cyan-950/25 hover:shadow-cyan-300/20 hover:-translate-y-0.5 border border-white/30",
    secondary: "bg-water-950/32 backdrop-blur-md text-white hover:bg-water-700/46 hover:-translate-y-0.5 border border-water-200/18 shadow-sm",
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
