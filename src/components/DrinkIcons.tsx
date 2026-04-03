import React from 'react';

export const SipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinejoin="round" {...props}>
    {/* Outer Cup */}
    <path d="M14 26 L22 54 C22.5 57 26 58 32 58 C38 58 41.5 57 42 54 L50 26 Z" />
    <line x1="10" y1="26" x2="54" y2="26" strokeLinecap="round" />
    
    {/* Straw */}
    <path d="M38 26 L42 12 L52 8" strokeLinecap="round" />
    
    {/* Liquid inside */}
    <path d="M20 42 L24 53 C25 55 28 56 32 56 C36 56 39 55 40 53 L44 42 Z" strokeWidth={3.5} />
    <line x1="18" y1="42" x2="46" y2="42" strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

export const GlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinejoin="round" {...props}>
    {/* Outer Glass */}
    <path d="M14 14 L20 56 C21 59 26 60 32 60 C38 60 43 59 44 56 L50 14 Z" />
    <line x1="10" y1="14" x2="54" y2="14" strokeLinecap="round" />
    
    {/* Liquid inside */}
    <path d="M17 34 L19 54 C19.5 55.5 24 56 32 56 C40 56 44.5 55.5 45 54 L47 34 Z" strokeWidth={3.5} />
    <line x1="16" y1="34" x2="48" y2="34" strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

export const MugIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinejoin="round" {...props}>
    {/* Outer Mug */}
    <path d="M16 18 L48 18 L48 48 C48 55 42 60 32 60 C22 60 16 55 16 48 Z" />
    <line x1="12" y1="18" x2="52" y2="18" strokeLinecap="round" />
    
    {/* Handle */}
    <path d="M48 26 C58 26 62 30 62 38 C62 46 56 48 48 48" strokeLinecap="round" />
  </svg>
);

export const BottleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" {...props}>
    {/* Cap */}
    <path d="M26 6 L38 6 L38 12 L26 12 Z" />
    <line x1="22" y1="12" x2="42" y2="12" />
    
    {/* Bottle Outer */}
    <path d="M26 12 L26 18 C26 23 16 26 16 34 L16 56 C16 59 19 62 32 62 C45 62 48 59 48 56 L48 34 C48 26 38 23 38 18 L38 12" />
    
    {/* Liquid inside */}
    <path d="M19.5 36 L19.5 54 C19.5 56 24 58 32 58 C40 58 44.5 56 44.5 54 L44.5 36 Z" strokeWidth={3.5} />
    <line x1="18" y1="36" x2="46" y2="36" strokeWidth={3.5} />
  </svg>
);
