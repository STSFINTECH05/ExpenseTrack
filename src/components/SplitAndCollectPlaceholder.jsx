import React from 'react';
import { Users2, ArrowRightLeft, Sparkles, ShieldCheck, Clock } from 'lucide-react';

export default function SplitAndCollectPlaceholder() {
  return (
    <div className="rounded-3xl bg-[#0f172a]/90 border border-slate-800 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl space-y-6 my-10 animate-fadeIn relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10">
        <Users2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          MODULE IN DEVELOPMENT
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight">
          Split & Collect Engine
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Automated multi-party expense splitting, stakeholder settlement requests, and automated payment collection workflows for STS FINTECH operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-left text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Splits</span>
          </div>
          <p className="text-slate-400 text-[11px]">Dynamic weighted or equal split allocation across team nodes.</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Escrow Queue</span>
          </div>
          <p className="text-slate-400 text-[11px]">Hold & verify payment collections before ledger posting.</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Trail</span>
          </div>
          <p className="text-slate-400 text-[11px]">Instant settlement receipts and compliance export logs.</p>
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-500 pt-2">
        STS FINTECH PRIVATE LIMITED • Financial Architecture v2.0 Roadmap
      </div>
    </div>
  );
}
