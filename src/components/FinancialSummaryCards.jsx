import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Wallet,
} from 'lucide-react';
import apiClient from '../apiClient';

export const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

export default function FinancialSummaryCards({ summary, dateRange, comparisons, isLoading, fixedIncomeAmount }) {
  const [fixedIncomeTotal, setFixedIncomeTotal] = useState(() => {
    if (typeof fixedIncomeAmount === 'number' && fixedIncomeAmount >= 0) {
      return fixedIncomeAmount;
    }
    // Check cached records in localStorage if available
    try {
      const cached = localStorage.getItem('sts_segregation_records');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((r) => r.type === 'fixed_income')
            .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        }
      }
    } catch (_) {}
    return 0;
  });

  const [reminderData, setReminderData] = useState(() => {
    try {
      const cachedBills = localStorage.getItem('sts_bills') || localStorage.getItem('sts_segregation_records');
      if (cachedBills) {
        const parsed = JSON.parse(cachedBills);
        if (Array.isArray(parsed)) {
          const billItems = parsed.filter((r) => r.type === 'bill');
          const totalDue = billItems.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          return { totalDue, count: billItems.length };
        }
      }
    } catch (_) {}
    return { totalDue: 0, count: 0 };
  });

  useEffect(() => {
    if (typeof fixedIncomeAmount === 'number' && fixedIncomeAmount >= 0) {
      setFixedIncomeTotal(fixedIncomeAmount);
      return;
    }

    let isMounted = true;
    const fetchLedgerData = async () => {
      try {
        const res = await apiClient.get('/api/segregation');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            const fixedTotal = json.data
              .filter((r) => r.type === 'fixed_income')
              .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
            setFixedIncomeTotal(fixedTotal);

            const billItems = json.data.filter((r) => r.type === 'bill');
            const totalDue = billItems.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
            setReminderData({ totalDue, count: billItems.length });

            try {
              localStorage.setItem('sts_segregation_records', JSON.stringify(json.data));
            } catch (_) {}
          }
        }
      } catch (err) {
        // Fallback or ignore
      }
    };

    fetchLedgerData();
    const handleUpdate = () => fetchLedgerData();
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('sts_data_updated', handleUpdate);
    };
  }, [fixedIncomeAmount]);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const totalSavings = summary?.totalSavings !== undefined ? summary.totalSavings : (totalIncome - totalExpenses);
  const savingsRate = summary?.savingsRate || 0;
  const isDeficit = totalSavings < 0;
  const averageDailyExpense = summary?.averageDailyExpense || 0;
  const totalTransactions = summary?.totalTransactions || 0;
  const incomeCount = summary?.incomeCount || 0;
  const expenseCount = summary?.expenseCount || 0;

  // Comparison deltas if available
  const incomeChangePct = comparisons?.incomeChangePct;
  const expenseChangePct = comparisons?.expenseChangePct;
  const savingsChangePct = comparisons?.savingsChangePct;

  // Card 5: Total Saving Rate calculations (deducting 15% Fixed Income allocation)
  const fifteenPercentAllocation = (fixedIncomeTotal || 0) * 0.15;
  const adjustedNetSavings = Math.max(0, totalSavings - fifteenPercentAllocation);
  const netSavingRatePct = totalIncome > 0 ? ((adjustedNetSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Card 6: Reminder Balance calculations
  const reminderBalance = reminderData.totalDue || 0;
  const upcomingCount = reminderData.count || 0;
  const balanceAfterDues = Math.max(0, totalSavings - reminderBalance);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* CARD 1: TOTAL INCOME */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Inflow / Income
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatINR(totalIncome)}
          </h3>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">
              {incomeCount} {incomeCount === 1 ? 'credit entry' : 'credit entries'}
            </span>
            {incomeChangePct !== undefined && incomeChangePct !== null ? (
              <span
                className={`flex items-center font-bold ${
                  incomeChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {incomeChangePct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {incomeChangePct >= 0 ? `+${incomeChangePct}%` : `${incomeChangePct}%`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* CARD 2: TOTAL EXPENSES */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-rose-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Outflow / Expenses
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatINR(totalExpenses)}
          </h3>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">
              Avg: {formatINR(averageDailyExpense)}/day
            </span>
            {expenseChangePct !== undefined && expenseChangePct !== null ? (
              <span
                className={`flex items-center font-bold ${
                  expenseChangePct <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {expenseChangePct <= 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {expenseChangePct > 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* CARD 3: NET SAVINGS */}
      <div
        className={`rounded-2xl bg-white dark:bg-[#0c1322] border p-5 shadow-xs relative overflow-hidden transition-all duration-200 ${
          isDeficit
            ? 'border-rose-300 dark:border-rose-900/60'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Savings
          </span>
          <div
            className={`p-2 rounded-xl border ${
              isDeficit
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isDeficit ? <AlertTriangle className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
          </div>
        </div>

        <div className="mt-3">
          <h3
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isDeficit ? `-${formatINR(Math.abs(totalSavings))}` : formatINR(totalSavings)}
          </h3>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <span
              className={`font-semibold ${
                isDeficit ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDeficit ? 'Operating Deficit' : 'Positive Surplus'}
            </span>
            {savingsChangePct !== undefined && savingsChangePct !== null ? (
              <span
                className={`font-bold ${
                  savingsChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {savingsChangePct >= 0 ? `+${savingsChangePct}%` : `${savingsChangePct}%`}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* CARD 4: SAVINGS RATE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Savings Rate
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          {fixedIncomeTotal > 0 ? (
            <div>
              <div className="flex items-baseline space-x-1.5 flex-wrap">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  15%
                </h3>
                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ({formatINR(fixedIncomeTotal * 0.15)})
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                of Fixed Income ({formatINR(fixedIncomeTotal)})
              </p>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
                Balance: {formatINR(fixedIncomeTotal * 0.85)}
              </p>
            </div>
          ) : (
            <div className="flex items-baseline space-x-1.5">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {savingsRate}%
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">of income</span>
            </div>
          )}

          {/* Mini Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fixedIncomeTotal > 0
                  ? 'bg-emerald-500'
                  : savingsRate >= 20
                  ? 'bg-emerald-500'
                  : savingsRate > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: fixedIncomeTotal > 0 ? '15%' : `${Math.min(100, Math.max(0, savingsRate))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
            <span>{fixedIncomeTotal > 0 ? 'Target: 15% Allocation' : 'Benchmark: 20%'}</span>
            <span
              className={`font-bold ${
                fixedIncomeTotal > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : savingsRate >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : savingsRate > 0
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {fixedIncomeTotal > 0
                ? '15% Fixed Allocation'
                : savingsRate >= 20
                ? 'Optimal'
                : savingsRate > 0
                ? 'Sub-optimal'
                : 'No Savings'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 5: TOTAL SAVING RATE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Saving Rate
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline space-x-1.5 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {netSavingRatePct}%
            </h3>
            <span
              className={`text-sm sm:text-base font-bold ${
                adjustedNetSavings === 0 && isDeficit ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ({formatINR(adjustedNetSavings)})
            </span>
          </div>

          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            of Total Inflow ({formatINR(totalIncome)})
          </p>

          {/* Mini Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                Number(netSavingRatePct) >= 20
                  ? 'bg-emerald-500'
                  : Number(netSavingRatePct) > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, Number(netSavingRatePct)))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
            <span>Net Retention</span>
            <span
              className={`font-bold ${
                Number(netSavingRatePct) > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500'
              }`}
            >
              {Number(netSavingRatePct) > 0 ? 'Active' : 'No Retention'}
            </span>
          </div>
        </div>
      </div>

      {/* CARD 6: REMINDER BALANCE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Reminder Balance
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Bell className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline space-x-1.5 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatINR(reminderBalance)}
            </h3>
          </div>

          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {upcomingCount > 0 ? `${upcomingCount} pending reminders` : 'No upcoming dues'}
          </p>
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
            After Dues: {formatINR(balanceAfterDues)}
          </p>

          {/* Mini Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                reminderBalance === 0
                  ? 'bg-emerald-500'
                  : balanceAfterDues > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: reminderBalance === 0 ? '100%' : `${Math.min(100, Math.max(10, (reminderBalance / (totalIncome || 1)) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
            <span>Commitment</span>
            <span
              className={`font-bold ${
                reminderBalance === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-500'
              }`}
            >
              {reminderBalance === 0 ? 'All Settled' : 'Due Scheduled'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
