import React from 'react';
import { Sparkles } from 'lucide-react';

export interface XerneasFABProps {
  onClick?: () => void;
  isOpen?: boolean;
  className?: string;
}

export function XerneasFAB({ onClick, isOpen, className = '' }: XerneasFABProps) {
  return (
    <button
      id="xerneas-fab-btn"
      type="button"
      onClick={onClick}
      aria-label="Open Xerneas AI Study Mentor"
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-main)] shadow-lg shadow-[var(--glow-primary)] hover:shadow-xl hover:shadow-[var(--glow-primary)] border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer ${className}`}
    >
      {/* Ambient dynamic glow effect */}
      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-60 blur group-hover:opacity-100 animate-pulse transition duration-700 pointer-events-none" />
      
      {/* Icon pill */}
      <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white shadow-inner">
        <Sparkles className="w-4 h-4 animate-spin-slow" />
      </span>
      
      {/* Label */}
      <span className="relative font-semibold text-sm tracking-wide hidden xs:inline-block sm:inline-block">
        Xerneas AI
      </span>

      {/* Online Pulse Indicator */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
      </span>
    </button>
  );
}

export default XerneasFAB;
