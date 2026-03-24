import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
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
  const baseStyles = "relative overflow-hidden inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out rounded-2xl active:scale-[0.97]";
  
  const variants = {
    primary: "bg-gradient-to-br from-water-400 to-water-600 text-white shadow-lg shadow-water-500/25 hover:shadow-water-500/40 hover:-translate-y-0.5 border border-water-300/20",
    secondary: "bg-water-800/40 backdrop-blur-md text-water-100 hover:bg-water-700/50 hover:-translate-y-0.5 border border-water-500/30 shadow-sm",
    ghost: "bg-transparent text-water-300 hover:bg-water-800/40 hover:text-white transition-colors",
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
      <span className="pointer-events-none">{children}</span>
    </button>
  );
}
