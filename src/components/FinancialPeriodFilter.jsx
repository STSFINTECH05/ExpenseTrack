import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  CalendarRange,
  GitCompare,
} from 'lucide-react';

export const PERIOD_OPTIONS = [
  { id: '10d', label: 'Last 10 Days', shortLabel: '10 Days' },
  { id: '30d', label: 'Last 30 Days', shortLabel: '30 Days' },
  { id: 'currentMonth', label: 'Current Month', shortLabel: 'This Month' },
  { id: 'monthly', label: 'Monthly History', shortLabel: 'Monthly (12M)' },
  { id: 'yearly', label: 'Current Year', shortLabel: 'This Year' },
  { id: 'comparison_monthly', label: 'Month vs Month', shortLabel: 'MoM Compare' },
  { id: 'comparison_yearly', label: 'Year vs Year', shortLabel: 'YoY Compare' },
  { id: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
];

export default function FinancialPeriodFilter({
  selectedPeriod,
  onSelectPeriod,
  customDates,
  onCustomDatesChange,
  onApplyCustom,
  isLoading,
  onRefresh,
  dateRange,
}) {
  const [showCustomInputs, setShowCustomInputs] = useState(selectedPeriod === 'custom');
  const [validationError, setValidationError] = useState('');

  const handlePeriodChange = (periodId) => {
    setValidationError('');
    if (periodId === 'custom') {
      setShowCustomInputs(true);
      onSelectPeriod('custom');
    } else {
      setShowCustomInputs(false);
      onSelectPeriod(periodId);
    }
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customDates.startDate || !customDates.endDate) {
      setValidationError('Please select both start and end dates.');
      return;
    }
    if (new Date(customDates.startDate) > new Date(customDates.endDate)) {
      setValidationError('Start date cannot be after end date.');
      return;
    }
    setValidationError('');
    onApplyCustom();
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        {/* Left: Active Period Info & Range */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reporting Window
              </span>
              {dateRange?.totalDays ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {dateRange.totalDays} Days
                </span>
              ) : null}
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 mt-0.5">
              {dateRange?.startDate && dateRange?.endDate ? (
                <>
                  <span>{formatDateDisplay(dateRange.startDate)}</span>
                  <span className="text-slate-400">→</span>
                  <span>{formatDateDisplay(dateRange.endDate)}</span>
                </>
              ) : (
                <span>
                  {PERIOD_OPTIONS.find((p) => p.id === selectedPeriod)?.label || 'Financial Analytics'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Refresh Button */}
        <div className="flex items-center space-x-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-60"
            title="Reload analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Period Selector Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {PERIOD_OPTIONS.map((period) => {
          const isActive = selectedPeriod === period.id;
          return (
            <button
              key={period.id}
              type="button"
              onClick={() => handlePeriodChange(period.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500/50'
                  : 'bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {period.id.startsWith('comparison') ? (
                <GitCompare className="w-3.5 h-3.5 flex-shrink-0" />
              ) : period.id === 'custom' ? (
                <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" />
              ) : null}
              <span>{period.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Picker Container */}
      {(showCustomInputs || selectedPeriod === 'custom') && (
        <form
          onSubmit={handleApplyCustomDates}
          className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={customDates.startDate}
              onChange={(e) =>
                onCustomDatesChange({ ...customDates, startDate: e.target.value })
              }
              max={customDates.endDate || undefined}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={customDates.endDate}
              onChange={(e) =>
                onCustomDatesChange({ ...customDates, endDate: e.target.value })
              }
              min={customDates.startDate || undefined}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-60"
          >
            <span>Apply Custom Window</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {validationError && (
            <span className="text-red-500 dark:text-red-400 font-semibold">{validationError}</span>
          )}
        </form>
      )}
    </div>
  );
}
