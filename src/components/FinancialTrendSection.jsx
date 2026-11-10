import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  Flame,
  ArrowRight,
  Layers,
  Activity,
  CheckCircle2,
  Inbox,
  Info,
} from 'lucide-react';
import { formatINR } from './FinancialSummaryCards';

export default function FinancialTrendSection({
  dailyBreakdown = [],
  highestSpendingDay = null,
  monthlyHistory = [],
  summary = {},
  period = '30d',
}) {
  const [hoveredDailyIndex, setHoveredDailyIndex] = useState(null);
  const [hoveredMonthlyIndex, setHoveredMonthlyIndex] = useState(null);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const totalSavings = summary?.totalSavings !== undefined ? summary.totalSavings : totalIncome - totalExpenses;
  const totalCashflow = totalIncome + totalExpenses;

  const incomePct = totalCashflow > 0 ? Math.round((totalIncome / totalCashflow) * 100) : 50;
  const expensePct = totalCashflow > 0 ? Math.round((totalExpenses / totalCashflow) * 100) : 50;

  // Maximum daily expense for SVG height scaling
  const maxDailyAmount = Math.max(
    ...dailyBreakdown.map((d) => Number(d.amount) || 0),
    1
  );

  // Maximum monthly amount for SVG height scaling
  const maxMonthlyAmount = Math.max(
    ...monthlyHistory.map((m) => Math.max(Number(m.income) || 0, Number(m.expense) || 0)),
    1
  );

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    try {
      const parts = monthStr.split('-');
      if (parts.length === 2) {
        const monthNum = parseInt(parts[1], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[monthNum - 1] || parts[1]} '${parts[0].slice(2)}`;
      }
      return monthStr;
    } catch {
      return monthStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Inflow vs Outflow Comparison Meter                                     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Cashflow Balance: Income vs Expense Proportion
            </h4>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              Inflow: {incomePct}%
            </span>
            <span className="flex items-center text-rose-500 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
              Outflow: {expensePct}%
            </span>
          </div>
        </div>

        {/* Dual Colored Proportional Bar */}
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${incomePct}%` }}
            title={`Income: ${formatINR(totalIncome)} (${incomePct}%)`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${expensePct}%` }}
            title={`Expenses: ${formatINR(totalExpenses)} (${expensePct}%)`}
          />
        </div>

        <div className="flex items-center justify-between text-xs mt-3 pt-2 text-slate-500 dark:text-slate-400">
          <span>Inflow: {formatINR(totalIncome)}</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Net Surplus: {totalSavings >= 0 ? `+${formatINR(totalSavings)}` : `-${formatINR(Math.abs(totalSavings))}`}
          </span>
          <span>Outflow: {formatINR(totalExpenses)}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Daily Spending Activity Chart                                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Daily Spending Progression
              </h4>
              <p className="text-[11px] text-slate-500">
                Outflow recorded per calendar day in active window
              </p>
            </div>
          </div>

          {highestSpendingDay && highestSpendingDay.amount > 0 && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>
                Peak: {formatINR(highestSpendingDay.amount)} on {highestSpendingDay.date}
              </span>
            </div>
          )}
        </div>

        {dailyBreakdown.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-xs font-semibold">No daily expense transactions found for this period.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Native SVG Bar Chart with Responsive ViewBox */}
            <div className="relative w-full h-48 sm:h-56">
              <svg
                viewBox={`0 0 ${Math.max(400, dailyBreakdown.length * 36)} 160`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="130" x2="100%" y2="130" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="100%" y2="75" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="0" y1="20" x2="100%" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

                {dailyBreakdown.map((day, idx) => {
                  const barWidth = 18;
                  const spacing = 36;
                  const x = idx * spacing + 12;
                  const height = Math.max(4, Math.round(((Number(day.amount) || 0) / maxDailyAmount) * 110));
                  const y = 130 - height;
                  const isHovered = hoveredDailyIndex === idx;
                  const isPeak = highestSpendingDay?.date === day.date;

                  return (
                    <g
                      key={day.date}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredDailyIndex(idx)}
                      onMouseLeave={() => setHoveredDailyIndex(null)}
                    >
                      {/* Bar Rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="4"
                        fill={isPeak ? '#f43f5e' : isHovered ? '#10b981' : '#0d5236'}
                        className="transition-colors duration-200"
                      />

                      {/* Date Axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y="146"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#94a3b8"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {formatDateLabel(day.date)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Interactive Tooltip */}
              {hoveredDailyIndex !== null && dailyBreakdown[hoveredDailyIndex] && (
                <div
                  className="absolute top-0 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 shadow-lg pointer-events-none z-10"
                >
                  <div className="font-bold text-emerald-400">
                    {formatINR(dailyBreakdown[hoveredDailyIndex].amount)}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {dailyBreakdown[hoveredDailyIndex].date} ({dailyBreakdown[hoveredDailyIndex].count} txns)
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>0% baseline</span>
              <span>Daily Max Outflow: {formatINR(maxDailyAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. Monthly Financial History & Income vs Savings Progression (12 Months)  */}
      {/* ========================================================================= */}
      {monthlyHistory.length > 0 && (
        <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Monthly Financial Trend & History (12-Month Progression)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Month-by-month Inflow vs Outflow vs Net Savings
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-emerald-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1.5" />
                Income
              </span>
              <span className="flex items-center text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 mr-1.5" />
                Expense
              </span>
              <span className="flex items-center text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 mr-1.5" />
                Savings
              </span>
            </div>
          </div>

          <div className="relative w-full h-56 sm:h-64">
            <svg
              viewBox={`0 0 ${Math.max(480, monthlyHistory.length * 60)} 170`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Horizontal Guides */}
              <line x1="0" y1="135" x2="100%" y2="135" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="100%" y2="75" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="0" y1="20" x2="100%" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

              {monthlyHistory.map((m, idx) => {
                const groupWidth = 40;
                const spacing = 60;
                const x = idx * spacing + 15;
                const subWidth = 11;

                const incomeHeight = Math.max(2, Math.round(((Number(m.income) || 0) / maxMonthlyAmount) * 115));
                const expenseHeight = Math.max(2, Math.round(((Number(m.expense) || 0) / maxMonthlyAmount) * 115));
                const savingsHeight = Math.max(
                  2,
                  Math.round((Math.max(0, Number(m.savings) || 0) / maxMonthlyAmount) * 115)
                );

                const isHovered = hoveredMonthlyIndex === idx;

                return (
                  <g
                    key={m.month}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredMonthlyIndex(idx)}
                    onMouseLeave={() => setHoveredMonthlyIndex(null)}
                  >
                    {/* Income Bar (Green) */}
                    <rect
                      x={x}
                      y={135 - incomeHeight}
                      width={subWidth}
                      height={incomeHeight}
                      rx="3"
                      fill="#10b981"
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Expense Bar (Rose) */}
                    <rect
                      x={x + subWidth + 2}
                      y={135 - expenseHeight}
                      width={subWidth}
                      height={expenseHeight}
                      rx="3"
                      fill="#f43f5e"
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Savings Bar (Cyan) */}
                    <rect
                      x={x + (subWidth + 2) * 2}
                      y={135 - savingsHeight}
                      width={subWidth}
                      height={savingsHeight}
                      rx="3"
                      fill="#06b6d4"
                      opacity={isHovered ? 1 : 0.85}
                    />

                    {/* Month Label */}
                    <text
                      x={x + groupWidth / 2}
                      y="152"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                    >
                      {formatMonthLabel(m.month)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip for Monthly View */}
            {hoveredMonthlyIndex !== null && monthlyHistory[hoveredMonthlyIndex] && (
              <div className="absolute top-0 right-4 bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-700 shadow-xl pointer-events-none z-10 space-y-1">
                <div className="font-bold text-slate-300">
                  {formatMonthLabel(monthlyHistory[hoveredMonthlyIndex].month)}
                </div>
                <div className="text-emerald-400">
                  Income: {formatINR(monthlyHistory[hoveredMonthlyIndex].income)}
                </div>
                <div className="text-rose-400">
                  Expense: {formatINR(monthlyHistory[hoveredMonthlyIndex].expense)}
                </div>
                <div className="text-cyan-400 font-semibold">
                  Savings: {formatINR(monthlyHistory[hoveredMonthlyIndex].savings)} ({monthlyHistory[hoveredMonthlyIndex].savingsRate}%)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
