import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  BrainCircuit,
  Calendar,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../apiClient';
import FinancialPeriodFilter from './FinancialPeriodFilter';
import FinancialSummaryCards, { formatINR } from './FinancialSummaryCards';
import SpendingCategoryBreakdown from './SpendingCategoryBreakdown';
import FinancialTrendSection from './FinancialTrendSection';
import FinancialComparison from './FinancialComparison';
import FinancialInsights from './FinancialInsights';

export default function FinancialIntelligenceView() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [customDates, setCustomDates] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  });

  const [analyticsData, setAnalyticsData] = useState(null);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Request counter ref to prevent race conditions and outdated responses from overwriting newer ones
  const activeRequestIdRef = useRef(0);

  const fetchAnalytics = useCallback(async (period, customRange = null) => {
    const currentReqId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage('');

    try {
      let endpoint = `/api/ai/analytics?period=${encodeURIComponent(period)}`;
      if (period === 'custom' && customRange) {
        endpoint += `&start_date=${encodeURIComponent(customRange.startDate)}&end_date=${encodeURIComponent(customRange.endDate)}`;
      }

      // If viewing comparisons, fetch both analytics baseline and comparison
      const isComparisonPeriod = period === 'comparison_monthly' || period === 'comparison_yearly';
      const actualPeriod = isComparisonPeriod ? 'currentMonth' : period;
      const analyticsEndpoint = isComparisonPeriod
        ? `/api/ai/analytics?period=currentMonth`
        : endpoint;

      // Parallel fetch: analytics overview + monthly history for multi-month trend
      const [analyticsRes, monthlyRes] = await Promise.all([
        apiClient.get(analyticsEndpoint),
        apiClient.get('/api/ai/analytics?period=monthly').catch(() => null),
      ]);

      // Guard against race conditions
      if (currentReqId !== activeRequestIdRef.current) {
        return;
      }

      if (!analyticsRes.ok) {
        const errJson = await analyticsRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Analytics request failed with status ${analyticsRes.status}`);
      }

      const analyticsJson = await analyticsRes.json();
      if (!analyticsJson.success) {
        throw new Error(analyticsJson.message || 'Failed to retrieve financial analytics');
      }

      setAnalyticsData(analyticsJson);

      if (monthlyRes && monthlyRes.ok) {
        const monthlyJson = await monthlyRes.json().catch(() => null);
        if (monthlyJson && monthlyJson.success && Array.isArray(monthlyJson.data)) {
          setMonthlyHistory(monthlyJson.data);
        }
      }
    } catch (err) {
      if (currentReqId === activeRequestIdRef.current) {
        console.warn('[FinancialIntelligenceView] Fetch error:', err.message);
        setErrorMessage(err.message || 'Error communicating with Financial Intelligence Engine.');
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when period changes
  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      fetchAnalytics(selectedPeriod);
    }
  }, [selectedPeriod, fetchAnalytics]);

  const handleApplyCustomDates = () => {
    fetchAnalytics('custom', customDates);
  };

  const handleRefresh = () => {
    if (selectedPeriod === 'custom') {
      fetchAnalytics('custom', customDates);
    } else {
      fetchAnalytics(selectedPeriod);
    }
  };

  const isComparisonMode =
    selectedPeriod === 'comparison_monthly' || selectedPeriod === 'comparison_yearly';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#0d5236] to-emerald-600 text-white shadow-md border border-emerald-500/40 flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Financial Intelligence
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Milestone 2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic mathematical analytics, expenditure segregation, and cashflow intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Strict User Isolated Engine</span>
          </div>
        </div>
      </div>

      {/* Error Alert Banner with Retry Button */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reporting Period Filter Bar */}
      <FinancialPeriodFilter
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        customDates={customDates}
        onCustomDatesChange={setCustomDates}
        onApplyCustom={handleApplyCustomDates}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        dateRange={analyticsData?.dateRange}
      />

      {/* Financial Summary Cards */}
      <FinancialSummaryCards
        summary={analyticsData?.summary}
        dateRange={analyticsData?.dateRange}
        comparisons={analyticsData?.comparisons}
        isLoading={isLoading}
      />

      {/* Period-Over-Period Comparison Section (Shown on top if comparison period selected) */}
      {isComparisonMode && (
        <FinancialComparison
          activeComparison={selectedPeriod === 'comparison_yearly' ? 'yearly' : 'monthly'}
        />
      )}

      {/* Deterministic Rule-Based Statistical Insights */}
      <FinancialInsights
        insights={analyticsData?.insights}
        isLoading={isLoading}
      />

      {/* Spending Category Breakdown */}
      <SpendingCategoryBreakdown
        categories={analyticsData?.categories}
        highestSpendingCategory={analyticsData?.highestSpendingCategory}
        topCategories={analyticsData?.topCategories}
        totalExpenses={analyticsData?.summary?.totalExpenses || 0}
      />

      {/* Financial Visualizations: Trends, Daily Progression & Cashflow Meter */}
      <FinancialTrendSection
        dailyBreakdown={analyticsData?.dailyBreakdown}
        highestSpendingDay={analyticsData?.highestSpendingDay}
        monthlyHistory={monthlyHistory}
        summary={analyticsData?.summary}
        period={selectedPeriod}
      />

      {/* Period Comparison Section (When not already displayed on top) */}
      {!isComparisonMode && (
        <FinancialComparison activeComparison="monthly" />
      )}
    </div>
  );
}
