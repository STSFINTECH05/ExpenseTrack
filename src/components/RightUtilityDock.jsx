import React from 'react';
import {
  Calendar as CalendarIcon,
  Calculator as CalculatorIcon,
  StickyNote,
} from 'lucide-react';

export default function RightUtilityDock({ onOpenTab, activeDrawerTab, isDrawerOpen }) {
  return (
    <aside
      className="hidden md:flex flex-col items-center py-4 w-14 border-l border-emerald-200/70 bg-[#F2FBF7]/90 dark:bg-zinc-900 dark:border-zinc-800 flex-shrink-0 z-30 transition-colors duration-200 select-none space-y-3"
      style={{ minHeight: '100%' }}
      aria-label="Right Utility Dock"
    >
      {/* 1. Calendar: Soft warm amber/yellow square */}
      <button
        type="button"
        onClick={() => onOpenTab('calendar')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 group ${
          isDrawerOpen && activeDrawerTab === 'calendar'
            ? 'bg-amber-100 text-amber-600 border-2 border-amber-400 ring-2 ring-amber-400/30'
            : 'bg-amber-50 text-amber-500 border border-amber-200/60 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-900/60 dark:hover:bg-amber-950/70'
        }`}
        title="Calendar & Scheduled Reminders"
        aria-label="Open Calendar"
      >
        <CalendarIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {/* 2. Calculator: Soft mint/emerald square */}
      <button
        type="button"
        onClick={() => onOpenTab('calc')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 group ${
          isDrawerOpen && activeDrawerTab === 'calc'
            ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500 ring-2 ring-emerald-500/30'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:hover:bg-emerald-950/70'
        }`}
        title="Calculator & Tape Ledger"
        aria-label="Open Calculator"
      >
        <CalculatorIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {/* 3. Notes: Soft rose/pink square */}
      <button
        type="button"
        onClick={() => onOpenTab('notes')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 group ${
          isDrawerOpen && activeDrawerTab === 'notes'
            ? 'bg-rose-100 text-rose-600 border-2 border-rose-400 ring-2 ring-rose-400/30'
            : 'bg-rose-50 text-rose-500 border border-rose-200/60 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900/60 dark:hover:bg-rose-950/70'
        }`}
        title="Quick Notes & Scratchpad"
        aria-label="Open Notes"
      >
        <StickyNote className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </aside>
  );
}
