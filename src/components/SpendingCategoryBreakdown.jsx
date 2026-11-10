import React, { useState } from 'react';
import {
  PieChart,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Layers,
  Inbox,
  Flame,
} from 'lucide-react';
import { formatINR } from './FinancialSummaryCards';

// Category color generator
const CATEGORY_COLORS = [
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#64748b', // slate-500
];

export default function SpendingCategoryBreakdown({
  categories = [],
  highestSpendingCategory,
  topCategories = [],
  totalExpenses = 0,
}) {
  const [activeCategory, setActiveCategory] = useState(null);

  // If no expenses or no categories, show clean empty state
  if (!categories || categories.length === 0 || totalExpenses <= 0) {
    return (
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Category Expenditures Recorded
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No classified expense transactions were found for this reporting window. Add expense records in Segregation to analyze category distribution.
        </p>
      </div>
    );
  }

  // Pre-calculate cumulative offsets for native SVG donut chart
  let cumulativePercent = 0;
  const donutSlices = categories.slice(0, 8).map((cat, idx) => {
    const percent = Number(cat.percentage) || 0;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...cat,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      startPercent,
      endPercent: cumulativePercent,
      percent,
    };
  });

  return (
    <div className="space-y-6">
      {/* Highest Spending Spotlight Banner */}
      {highestSpendingCategory && (
        <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/20 border border-emerald-500/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Primary Outlay Concentration
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {highestSpendingCategory.category}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Consumes <span className="font-bold text-emerald-500">{highestSpendingCategory.percentage}%</span> of your total period expenditure across {highestSpendingCategory.count} entries
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            <span className="text-xs text-slate-400 font-medium">Category Outflow</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatINR(highestSpendingCategory.amount)}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Visual SVG Donut + Top 5 Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): SVG Donut Chart & Legend */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Spending Distribution
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          {/* Native SVG Donut Chart */}
          <div className="relative flex items-center justify-center my-4 py-2">
            <svg viewBox="0 0 100 100" className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90">
              {donutSlices.map((slice, idx) => {
                const strokeDasharray = `${slice.percent} ${100 - slice.percent}`;
                const strokeDashoffset = -slice.startPercent;
                const isHovered = activeCategory === slice.category;
                return (
                  <circle
                    key={slice.category}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? '15' : '12'}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    pathLength="100"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setActiveCategory(slice.category)}
                    onMouseLeave={() => setActiveCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {activeCategory || 'Total Outflow'}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-[130px] mt-0.5">
                {activeCategory
                  ? formatINR(categories.find((c) => c.category === activeCategory)?.amount || 0)
                  : formatINR(totalExpenses)}
              </span>
              <span className="text-[10px] font-semibold text-emerald-500">
                {activeCategory
                  ? `${categories.find((c) => c.category === activeCategory)?.percentage}%`
                  : '100%'}
              </span>
            </div>
          </div>

          {/* Quick Legend Tags */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {donutSlices.slice(0, 6).map((slice) => (
              <button
                key={slice.category}
                type="button"
                onMouseEnter={() => setActiveCategory(slice.category)}
                onMouseLeave={() => setActiveCategory(null)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition flex items-center space-x-1.5 ${
                  activeCategory === slice.category
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate max-w-[90px]">{slice.category}</span>
                <span className="text-[10px] font-bold text-slate-500">{slice.percentage}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column (7 Cols): Top 5 Categories Progress Bars */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Top Spending Categories
                </h4>
              </div>
              <span className="text-xs font-semibold text-slate-500">Share of Total</span>
            </div>

            <div className="space-y-4">
              {(topCategories.length > 0 ? topCategories : categories.slice(0, 5)).map((cat, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const isHovered = activeCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    onMouseEnter={() => setActiveCategory(cat.category)}
                    onMouseLeave={() => setActiveCategory(null)}
                    className={`p-2.5 rounded-xl transition ${
                      isHovered ? 'bg-slate-50 dark:bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-md flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cat.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({cat.count} txns)
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          {formatINR(cat.amount)}
                        </span>
                        <span className="font-bold text-slate-500 w-10 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Full Category-Wise Ledger Breakdown Table */}
      <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Complete Category Breakdown
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {categories.length} total active categories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 sm:px-6">Category</th>
                <th className="py-3 px-4 text-right">Outflow Amount</th>
                <th className="py-3 px-4 text-right">Expenditure Share</th>
                <th className="py-3 px-4 text-right">Transactions</th>
                <th className="py-3 px-4 text-right">Period Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {categories.map((cat, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <tr
                    key={cat.category}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatINR(cat.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600 dark:text-slate-300">
                      {cat.percentage}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {cat.count}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {cat.trend === 'increasing' ? (
                        <span className="inline-flex items-center text-rose-500 font-bold">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          +{cat.changePercentage}%
                        </span>
                      ) : cat.trend === 'decreasing' ? (
                        <span className="inline-flex items-center text-emerald-500 font-bold">
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                          {cat.changePercentage}%
                        </span>
                      ) : cat.trend === 'new' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-500">
                          New Outlay
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-400">
                          <Minus className="w-3.5 h-3.5 mr-0.5" />
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
