"use client";

import React from "react";
import Image from "next/image";

export function SharkBackground() {
  return (
    <div 
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center -z-10 pointer-events-none select-none"
    >
      <Image
        src="/shark.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute object-contain object-center opacity-40 grayscale brightness-[2] contrast-125"
      />
      
      <div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0b2a3a]/40 to-[#0b2a3a]/60"
      />
    </div>
  );
}
