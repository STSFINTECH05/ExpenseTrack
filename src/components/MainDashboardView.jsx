import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MainDashboardView() {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('MainDashboardView LanguageContext fallback:', err);
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard', 'Dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Overview and real-time activity metrics
          </p>
        </div>
      </div>

      {/* Blank / Empty container placeholder ready for new widgets */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[420px] transition-all">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mb-4">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {t('dashboard', 'Dashboard')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1.5">
          Welcome to your new Dashboard. This workspace is ready for upcoming widgets, charts, and summary reports.
        </p>
      </div>
    </div>
  );
}
