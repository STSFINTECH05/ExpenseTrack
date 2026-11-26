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
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-stretch">
      {/* CARD 1: TOTAL INFLOW / INCOME */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40 h-full flex flex-col justify-between">
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            TOTAL INFLOW / INCOME
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <h3 className="text-lg xl:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums whitespace-nowrap">
            {formatINR(totalIncome)}
          </h3>
          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Gross Inflows Recorded
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            Active Ledger Window
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: totalIncome > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {incomeCount} {incomeCount === 1 ? 'credit entry' : 'credit entries'}
          </span>
          {incomeChangePct !== undefined && incomeChangePct !== null ? (
            <span
              className={`flex items-center font-bold flex-shrink-0 ${
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

      {/* CARD 2: TOTAL OUTFLOW / EXPENSES */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-rose-500/40 h-full flex flex-col justify-between">
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            TOTAL OUTFLOW / EXPENSES
          </span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex-shrink-0">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <h3 className="text-lg xl:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums whitespace-nowrap">
            {formatINR(totalExpenses)}
          </h3>
          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {expenseCount} {expenseCount === 1 ? 'debit entry' : 'debit entries'}
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            Burn Rate: {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 0}% of inflow
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalExpenses > totalIncome ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate">
            Avg: {formatINR(averageDailyExpense)}/day
          </span>
          {expenseChangePct !== undefined && expenseChangePct !== null ? (
            <span
              className={`flex items-center font-bold flex-shrink-0 ${
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

      {/* CARD 3: NET SAVINGS */}
      <div
        className={`rounded-2xl bg-white dark:bg-[#0c1322] border p-4 shadow-xs relative overflow-hidden transition-all duration-200 h-full flex flex-col justify-between ${
          isDeficit
            ? 'border-rose-300 dark:border-rose-900/60'
            : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
        }`}
      >
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            NET SAVINGS
          </span>
          <div
            className={`p-1.5 rounded-lg border flex-shrink-0 ${
              isDeficit
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isDeficit ? <AlertTriangle className="w-3.5 h-3.5" /> : <PiggyBank className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <h3
            className={`text-lg xl:text-[19px] font-bold tracking-tight tabular-nums whitespace-nowrap ${
              isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isDeficit ? `-${formatINR(Math.abs(totalSavings))}` : formatINR(totalSavings)}
          </h3>
          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {isDeficit ? 'Over-budget deficit' : 'Net retained surplus'}
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            Margin: {totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0}% of inflow
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDeficit ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, totalIncome > 0 ? Math.abs(totalSavings / totalIncome) * 100 : 0))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span
            className={`font-semibold truncate ${
              isDeficit ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isDeficit ? 'Operating Deficit' : 'Positive Surplus'}
          </span>
          {savingsChangePct !== undefined && savingsChangePct !== null ? (
            <span
              className={`font-bold flex-shrink-0 ${
                savingsChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              {savingsChangePct >= 0 ? `+${savingsChangePct}%` : `${savingsChangePct}%`}
            </span>
          ) : null}
        </div>
      </div>

      {/* CARD 4: SAVINGS RATE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40 h-full flex flex-col justify-between">
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            SAVINGS RATE
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <Percent className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <div className="flex items-baseline space-x-1 flex-nowrap">
            <h3 className="text-lg xl:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums whitespace-nowrap">
              {fixedIncomeTotal > 0 ? '15%' : `${savingsRate}%`}
            </h3>
            {fixedIncomeTotal > 0 ? (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                ({formatINR(fixedIncomeTotal * 0.15)})
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                of income
              </span>
            )}
          </div>

          <p className="text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {fixedIncomeTotal > 0 ? `of Fixed Income (${formatINR(fixedIncomeTotal)})` : 'Benchmark rate target: 20%'}
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            {fixedIncomeTotal > 0
              ? `Balance: ${formatINR(fixedIncomeTotal * 0.85)}`
              : `Status: ${savingsRate >= 20 ? 'Optimal' : savingsRate > 0 ? 'Sub-optimal' : 'No Savings'}`}
          </p>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
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
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {fixedIncomeTotal > 0 ? 'Target: 15%' : 'Benchmark: 20%'}
          </span>
          <span
            className={`font-bold flex-shrink-0 ${
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

      {/* CARD 5: TOTAL SAVING RATE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40 h-full flex flex-col justify-between">
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            TOTAL SAVING RATE
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <PiggyBank className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <div className="flex items-baseline space-x-1 flex-nowrap">
            <h3 className="text-lg xl:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums whitespace-nowrap">
              {netSavingRatePct}%
            </h3>
            <span
              className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                adjustedNetSavings === 0 && isDeficit ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ({formatINR(adjustedNetSavings)})
            </span>
          </div>

          <p className="text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            of Total Inflow ({formatINR(totalIncome)})
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            Allocated: {formatINR(fifteenPercentAllocation)}
          </p>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
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
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate">Net Retention</span>
          <span
            className={`font-bold flex-shrink-0 ${
              Number(netSavingRatePct) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {Number(netSavingRatePct) > 0 ? 'Active' : 'No Retention'}
          </span>
        </div>
      </div>

      {/* CARD 6: REMINDER BALANCE */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden transition-all duration-200 hover:border-emerald-500/40 h-full flex flex-col justify-between">
        <div className="min-h-[28px] flex items-start justify-between gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase leading-tight text-slate-500 dark:text-slate-400">
            REMINDER BALANCE
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-start">
          <h3 className="text-lg xl:text-[19px] font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums whitespace-nowrap">
            {formatINR(reminderBalance)}
          </h3>

          <p className="text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {upcomingCount > 0 ? `${upcomingCount} pending reminders` : 'No upcoming dues'}
          </p>
          <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums truncate">
            After Dues: {formatINR(balanceAfterDues)}
          </p>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
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
        </div>

        <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate">Commitment</span>
          <span
            className={`font-bold flex-shrink-0 ${
              reminderBalance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
            }`}
          >
            {reminderBalance === 0 ? 'All Settled' : 'Due Scheduled'}
          </span>
        </div>
      </div>
    </section>
  );
}
