"use client";

import React from "react";

export function SharkBackground() {
  return (
    <div 
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center -z-10 pointer-events-none select-none"
    >
      <img
        src="/shark.png"
        alt=""
        className="absolute w-full h-full object-contain object-center opacity-40 grayscale brightness-[2] contrast-125"
      />
      
      <div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0b2a3a]/40 to-[#0b2a3a]/60"
      />
    </div>
  );
}
