import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { formatINR } from './FinancialSummaryCards';
import apiClient from '../apiClient';

export default function FinancialComparison({ activeComparison = 'monthly' }) {
  const [viewMode, setViewMode] = useState(activeComparison === 'yearly' ? 'yearly' : 'monthly');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchComparison = async (mode) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = mode === 'yearly' ? '/api/ai/comparison/yearly' : '/api/ai/comparison/monthly';
      const res = await apiClient.get(endpoint);
      if (!res.ok) {
        throw new Error(`Failed to load ${mode} comparison (Status ${res.status})`);
      }
      const json = await res.json();
      if (json && json.success) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Comparison response unsuccessful');
      }
    } catch (err) {
      console.warn('[FinancialComparison] Fetch error:', err.message);
      setErrorMessage(err.message || 'Unable to retrieve comparison data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(viewMode);
  }, [viewMode]);

  const current = viewMode === 'yearly' ? data?.summary : data?.currentPeriod;
  const previous = viewMode === 'yearly' ? data?.previousYear?.summary : data?.previousPeriod;
  const comparison = data?.comparison;

  const currentLabel = viewMode === 'yearly' ? `${data?.year || 'Current Year'}` : 'Current Month';
  const previousLabel = viewMode === 'yearly' ? `${data?.previousYear?.year || 'Previous Year'}` : 'Previous Month';

  return (
    <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Period-Over-Period Financial Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Mathematical delta analysis across consecutive accounting periods
            </p>
          </div>
        </div>

        {/* View Switcher Toggle: Monthly vs Yearly */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Month vs Month
          </button>
          <button
            type="button"
            onClick={() => setViewMode('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'yearly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Year vs Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-semibold">Comparing period ledgers...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : !data ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No comparison data available for this range.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Delta KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Income Delta */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Income Growth / Delta
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {comparison?.incomeDifference >= 0
                    ? `+${formatINR(comparison.incomeDifference)}`
                    : formatINR(comparison?.incomeDifference || 0)}
                </span>
                <span
                  className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-full ${
                    comparison?.incomeChangePct >= 0
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {comparison?.incomeChangePct >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {comparison?.incomeChangePct >= 0
                    ? `+${comparison.incomeChangePct}%`
                    : `${comparison?.incomeChangePct}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                vs {previousLabel}: {formatINR(previous?.totalIncome || 0)}
              </p>
            </div>

            {/* 2. Expense Delta */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Expense Growth / Delta
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {comparison?.expenseDifference > 0
                    ? `+${formatINR(comparison.expenseDifference)}`
                    : formatINR(comparison?.expenseDifference || 0)}
                </span>
                <span
                  className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-full ${
                    comparison?.expenseChangePct <= 0
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {comparison?.expenseChangePct > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {comparison?.expenseChangePct > 0
                    ? `+${comparison.expenseChangePct}%`
                    : `${comparison?.expenseChangePct}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                vs {previousLabel}: {formatINR(previous?.totalExpenses || 0)}
              </p>
            </div>

            {/* 3. Savings Delta */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Net Savings Delta
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {comparison?.savingsDifference !== undefined
                    ? comparison.savingsDifference >= 0
                      ? `+${formatINR(comparison.savingsDifference)}`
                      : formatINR(comparison.savingsDifference)
                    : `${formatINR((current?.totalSavings || 0) - (previous?.totalSavings || 0))}`}
                </span>
                {comparison?.savingsChangePct !== undefined ? (
                  <span
                    className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-full ${
                      comparison.savingsChangePct >= 0
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {comparison.savingsChangePct >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    {comparison.savingsChangePct >= 0
                      ? `+${comparison.savingsChangePct}%`
                      : `${comparison.savingsChangePct}%`}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                vs {previousLabel}: {formatINR(previous?.totalSavings || 0)}
              </p>
            </div>
          </div>

          {/* Side-by-Side Detailed Breakdown Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Financial Metric</th>
                  <th className="py-3 px-4 text-right">{previousLabel}</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {currentLabel}
                  </th>
                  <th className="py-3 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Total Inflow / Income
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {formatINR(previous?.totalIncome || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(current?.totalIncome || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        (comparison?.incomeDifference || 0) >= 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }
                    >
                      {(comparison?.incomeDifference || 0) >= 0 ? '+' : ''}
                      {formatINR(comparison?.incomeDifference || 0)}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Total Outflow / Expenses
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {formatINR(previous?.totalExpenses || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(current?.totalExpenses || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        (comparison?.expenseDifference || 0) <= 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }
                    >
                      {(comparison?.expenseDifference || 0) > 0 ? '+' : ''}
                      {formatINR(comparison?.expenseDifference || 0)}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Net Savings
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {formatINR(previous?.totalSavings || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(current?.totalSavings || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        ((current?.totalSavings || 0) - (previous?.totalSavings || 0)) >= 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }
                    >
                      {((current?.totalSavings || 0) - (previous?.totalSavings || 0)) >= 0 ? '+' : ''}
                      {formatINR((current?.totalSavings || 0) - (previous?.totalSavings || 0))}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Savings Rate
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {previous?.savingsRate || 0}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {current?.savingsRate || 0}%
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={
                        (current?.savingsRate || 0) >= (previous?.savingsRate || 0)
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }
                    >
                      {(current?.savingsRate || 0) - (previous?.savingsRate || 0) >= 0 ? '+' : ''}
                      {Math.round(((current?.savingsRate || 0) - (previous?.savingsRate || 0)) * 100) / 100}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
