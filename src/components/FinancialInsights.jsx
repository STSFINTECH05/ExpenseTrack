import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldAlert,
  Flame,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export default function FinancialInsights({ insights = [], isLoading = false }) {
  const getInsightIcon = (type, severity, id) => {
    if (id?.includes('deficit') || severity === 'high') {
      return <ShieldAlert className="w-5 h-5 text-rose-500" />;
    }
    if (id?.includes('surge') || severity === 'medium') {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    if (type === 'positive' || id?.includes('savings')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    if (id?.includes('peak')) {
      return <Flame className="w-5 h-5 text-rose-400" />;
    }
    return <Info className="w-5 h-5 text-cyan-400" />;
  };

  const getCardStyle = (type, severity, id) => {
    if (id?.includes('deficit') || severity === 'high') {
      return 'border-rose-500/30 bg-rose-950/10 text-rose-400';
    }
    if (id?.includes('surge') || severity === 'medium') {
      return 'border-amber-500/30 bg-amber-950/10 text-amber-400';
    }
    if (type === 'positive') {
      return 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400';
    }
    return 'border-slate-700/60 bg-slate-900/40 text-slate-300';
  };

  const getSeverityBadge = (severity, type) => {
    if (severity === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Action Advised
        </span>
      );
    }
    if (severity === 'medium') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Advisory
        </span>
      );
    }
    if (type === 'positive') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Healthy Benchmark
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/20 text-slate-400 border border-slate-500/30">
        Statistical Observation
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Explicit Rule-Based Statistical Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Rule-Based Statistical Observations & Alerts
            </h3>
            <p className="text-[11px] text-slate-500">
              Deterministic mathematical analysis generated from your active ledger records
            </p>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Deterministic Audit (Not ML Predictions)</span>
        </div>
      </div>

      {/* Insights List / Cards */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Evaluating mathematical ledger patterns...
        </div>
      ) : !insights || insights.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No statistical alerts found for this reporting period.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((item, idx) => {
            const cardStyle = getCardStyle(item.type, item.severity, item.id);
            return (
              <div
                key={item.id || idx}
                className={`p-4 rounded-xl border transition-all duration-200 flex items-start space-x-3.5 ${cardStyle}`}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 mt-0.5">
                  {getInsightIcon(item.type, item.severity, item.id)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                    {getSeverityBadge(item.severity, item.type)}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
