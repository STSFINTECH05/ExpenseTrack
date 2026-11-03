import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Coins,
  Building2,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Info,
  DollarSign,
  PieChart,
  ChevronRight,
  ExternalLink,
  Layers,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Streams', icon: Layers },
  { id: 'fixed', label: 'Fixed & Guaranteed', icon: ShieldCheck },
  { id: 'market', label: 'Market & Index Growth', icon: TrendingUp },
  { id: 'metals', label: 'Precious Metals & Commodities', icon: Coins },
  { id: 'cashflow', label: 'Cash-Flow Assets', icon: Building2 },
];

const INCOME_STREAMS = [
  // 1. Fixed & Guaranteed Returns
  {
    id: 'fd',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed Returns',
    title: 'Fixed Deposits (FD)',
    assetClass: 'Term Deposit',
    risk: 'Low Risk',
    riskColor: 'emerald',
    returnHorizon: '6.5% – 8.5% p.a. • 1 to 5 Years',
    yieldMin: 6.5,
    yieldMax: 8.5,
    minAmount: 1000,
    term: 'short', // short: <=1yr, medium: 1-5yr, long: 5+yr
    payoutType: 'both', // 'monthly', 'annual', 'both'
    summary: 'Stable bank and NBFC term deposits offering guaranteed, highly predictable interest yields.',
    guide: [
      'Open via your net banking app with scheduled commercial banks or DICGC-insured institutions.',
      'Select cumulative for compounding growth or quarterly payouts for supplemental cash flow.',
    ],
    highlights: ['DICGC Insured up to ₹5L', 'Senior Citizen +0.50% Extra', 'Zero Market Volatility'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'rd',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed Returns',
    title: 'Recurring Deposits (RD)',
    assetClass: 'Systematic Savings',
    risk: 'Low Risk',
    riskColor: 'emerald',
    returnHorizon: '6.5% – 7.5% p.a. • 6 Months to 10 Years',
    yieldMin: 6.5,
    yieldMax: 7.5,
    minAmount: 500,
    term: 'short',
    payoutType: 'annual',
    summary: 'Disciplined monthly contributions with compounding interest returns for systematic cash reserves.',
    guide: [
      'Set up an auto-debit standing instruction through your bank for salary payday each month.',
      'Lock in current interest rates without requiring an upfront lump sum corpus.',
    ],
    highlights: ['Monthly Habits from ₹500', 'Compounded Quarterly', 'Zero Credit Risk'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'ppf',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed Returns',
    title: 'Public Provident Fund (PPF) / Sovereign Debt',
    assetClass: 'Sovereign Debt',
    risk: 'Low Risk',
    riskColor: 'emerald',
    returnHorizon: '7.1% p.a. Guaranteed • 15-Year Horizon',
    yieldMin: 7.1,
    yieldMax: 7.1,
    minAmount: 500,
    term: 'long',
    payoutType: 'annual',
    summary: 'Government-backed sovereign debt vehicles offering long-term tax-exempt savings and inflation buffer.',
    guide: [
      'Open and link a PPF account through designated bank net banking or post office portals.',
      'Deposit up to ₹1.5L annually before the 5th of each month to maximize full-month interest.',
    ],
    highlights: ['Triple Tax Exemption (EEE)', 'Sovereign Guarantee', 'Partial Loans Available'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },

  // 2. Market & Index Growth
  {
    id: 'nifty50',
    category: 'market',
    categoryName: 'Market & Index Growth',
    title: 'NIFTY 50 Index Funds & ETFs',
    assetClass: 'Passive Index Equity',
    risk: 'Moderate Risk',
    riskColor: 'cyan',
    returnHorizon: '11% – 13% CAGR Historical • 5+ Years',
    yieldMin: 11.0,
    yieldMax: 13.0,
    minAmount: 500,
    term: 'long',
    payoutType: 'annual',
    summary: "Broad Indian equity market exposure tracking the nation's top 50 corporate leaders with rock-bottom expense ratios.",
    guide: [
      'Start a monthly automated SIP via Demat brokers (Zerodha/Groww) or direct mutual fund portals.',
      'Choose the Direct Plan Growth option with expense ratios under 0.20% for maximum compounding.',
    ],
    highlights: ['Top 50 Bluechips', 'Zero Manager Bias', 'Ultra-low Expense Ratio'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'dividends',
    category: 'market',
    categoryName: 'Market & Index Growth',
    title: 'High-Dividend Yield Stocks',
    assetClass: 'Dividend Equity',
    risk: 'Moderate to High Risk',
    riskColor: 'amber',
    returnHorizon: '4% – 8% Yield + Capital Gains • 3+ Years',
    yieldMin: 4.0,
    yieldMax: 8.0,
    minAmount: 2000,
    term: 'medium',
    payoutType: 'monthly',
    summary: 'Regular cash flow payouts from cash-rich PSUs and established market leaders alongside capital appreciation.',
    guide: [
      'Filter top dividend aristocrats (e.g., ITC, Coal India, TCS, Power Grid) via stock screeners.',
      'Accumulate on market dips and reinvest payouts into high-conviction dividend cash machines.',
    ],
    highlights: ['Direct Bank Payouts', 'Quarterly Distributions', 'Inflation Hedge'],
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-800/60',
    accentText: 'text-amber-700 dark:text-amber-400',
  },

  // 3. Precious Metals & Commodities
  {
    id: 'sgb',
    category: 'metals',
    categoryName: 'Precious Metals & Commodities',
    title: 'Sovereign Gold Bonds (SGBs) / Digital Gold',
    assetClass: 'Sovereign Gold',
    risk: 'Low to Moderate Risk',
    riskColor: 'amber',
    returnHorizon: '2.50% Cash p.a. + Gold Gains • 5 to 8 Years',
    yieldMin: 2.5,
    yieldMax: 10.0,
    minAmount: 5000,
    term: 'long',
    payoutType: 'both',
    summary: 'RBI-issued gold bonds providing gold value exposure with guaranteed annual interest payouts and zero storage hassle.',
    guide: [
      'Subscribe during primary RBI tranches or buy seasoned series on NSE/BSE secondary markets.',
      'Hold through the 8-year maturity duration for 100% tax-free capital gains on redemption.',
    ],
    highlights: ['2.5% Cash Interest Paid Semi-annually', 'Zero Making Charges', 'Tax-Free at Maturity'],
    accentBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    accentBorder: 'border-yellow-200 dark:border-yellow-800/60',
    accentText: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    id: 'silver_etf',
    category: 'metals',
    categoryName: 'Precious Metals & Commodities',
    title: 'Silver ETFs',
    assetClass: 'Commodity ETF',
    risk: 'Moderate Risk',
    riskColor: 'cyan',
    returnHorizon: 'Industrial Demand Growth • 3 to 7 Years',
    yieldMin: 8.0,
    yieldMax: 12.0,
    minAmount: 1000,
    term: 'medium',
    payoutType: 'annual',
    summary: 'SEBI-regulated exchange-traded funds tracking physical silver bullion for industrial and hedge diversification.',
    guide: [
      'Purchase Silver ETF units directly on stock exchange via your Demat trading account.',
      'Allocate a 5% to 10% portfolio sleeve as a hedge against fiat currency fluctuations.',
    ],
    highlights: ['Physical 99.9% Purity Backing', 'High Demat Liquidity', 'Green Energy Industrial Demand'],
    accentBg: 'bg-slate-100 dark:bg-slate-800/60',
    accentBorder: 'border-slate-300 dark:border-slate-700',
    accentText: 'text-slate-800 dark:text-slate-200',
  },

  // 4. Cash-Flow Assets
  {
    id: 'reit',
    category: 'cashflow',
    categoryName: 'Cash-Flow Assets',
    title: 'Real Estate REITs',
    assetClass: 'Commercial Real Estate',
    risk: 'Moderate Risk',
    riskColor: 'cyan',
    returnHorizon: '6.5% – 8.5% Cash Yield + Appreciation • 3+ Years',
    yieldMin: 6.5,
    yieldMax: 8.5,
    minAmount: 5000,
    term: 'medium',
    payoutType: 'monthly',
    summary: 'Fractional institutional ownership of Grade-A commercial tech parks yielding mandatory quarterly rental distributions.',
    guide: [
      'Purchase listed REIT units (e.g., Embassy, Nexus, Mindspace, Brookfield) directly from Demat terminal.',
      'Receive statutory 90% NDCF rental cash distributions deposited straight to your bank account.',
    ],
    highlights: ['Quarterly Dividend Payouts', 'Grade-A Multinational Tenants', 'Fractional Property Entry'],
    accentBg: 'bg-red-50 dark:bg-red-950/40',
    accentBorder: 'border-red-200 dark:border-red-800/60',
    accentText: 'text-red-700 dark:text-red-400',
  },
  {
    id: 'swp',
    category: 'cashflow',
    categoryName: 'Cash-Flow Assets',
    title: 'Mutual Fund SWP (Systematic Withdrawal Plan)',
    assetClass: 'Hybrid / Debt Asset',
    risk: 'Low to Moderate Risk',
    riskColor: 'emerald',
    returnHorizon: '7% – 9% Sustainable Payout Rate • Ongoing Monthly',
    yieldMin: 7.0,
    yieldMax: 9.0,
    minAmount: 10000,
    term: 'medium',
    payoutType: 'monthly',
    summary: 'Structured, highly tax-efficient monthly cash payouts generated from an accumulated mutual fund investment corpus.',
    guide: [
      'Direct your accumulated hybrid, index, or debt mutual fund to activate a monthly SWP instruction.',
      'Specify a fixed monthly credit date and amount; only capital gains components incur tax.',
    ],
    highlights: ['Tax-Efficient Salary Alternative', 'Customizable Monthly Cash Flow', 'Principal Keeps Compounding'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
];

export default function IncomeStreamsView() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Filter States
  const [isFilterSubmitted, setIsFilterSubmitted] = useState(false);
  const [invAmount, setInvAmount] = useState('50000');
  const [targetProfit, setTargetProfit] = useState('8');
  const [profitCadence, setProfitCadence] = useState('year'); // 'month' or 'year'
  const [timeHorizon, setTimeHorizon] = useState('any'); // 'any', 'short', 'medium', 'long'

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setIsFilterSubmitted(true);
  };

  const handleResetFilter = () => {
    setIsFilterSubmitted(false);
    setInvAmount('50000');
    setTargetProfit('8');
    setProfitCadence('year');
    setTimeHorizon('any');
  };

  // Filtered & ranked streams
  const processedStreams = useMemo(() => {
    const numAmount = Number(invAmount) || 0;
    const numProfit = Number(targetProfit) || 0;

    const list = INCOME_STREAMS.map((item) => {
      let isMatch = false;
      let estAnnual = 0;
      let estMonthly = 0;

      const avgYield = (item.yieldMin + item.yieldMax) / 2;
      estAnnual = Math.round((numAmount * avgYield) / 100);
      estMonthly = Math.round(estAnnual / 12);

      if (isFilterSubmitted) {
        const matchesAmount = numAmount >= item.minAmount;
        const matchesYield = item.yieldMax >= numProfit;
        const matchesHorizon = timeHorizon === 'any' || item.term === timeHorizon;
        const matchesCadence =
          profitCadence === 'year'
            ? true
            : item.payoutType === 'monthly' || item.payoutType === 'both';

        isMatch = matchesAmount && matchesYield && matchesHorizon && matchesCadence;
      }

      return {
        ...item,
        isMatch,
        estAnnual,
        estMonthly,
      };
    });

    // Match priority sorting: matches float to top
    return list.sort((a, b) => {
      if (isFilterSubmitted) {
        if (a.isMatch && !b.isMatch) return -1;
        if (!a.isMatch && b.isMatch) return 1;
      }
      return 0;
    });
  }, [invAmount, targetProfit, profitCadence, timeHorizon, isFilterSubmitted]);

  // Combined search & category filtering
  const finalStreams = useMemo(() => {
    return processedStreams.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.assetClass.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [processedStreams, activeCategory, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* 1. Header Banner & Context                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Income Streams
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Curated wealth-building and passive income avenues to diversify beyond active salary
              </p>
            </div>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>4 Asset Classes</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>9 Curated Streams</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Interactive Match Filter (Enter Amount, Profit, Horizon)              */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Investment Profit & Match Calculator
            </h2>
          </div>
          {isFilterSubmitted && (
            <button
              onClick={handleResetFilter}
              type="button"
              className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Enter Amount */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Enter Amount (₹)
            </label>
            <input
              type="number"
              min="500"
              step="500"
              value={invAmount}
              onChange={(e) => setInvAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
              required
            />
          </div>

          {/* Target Profit % */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Target Profit (% p.a.)
            </label>
            <input
              type="number"
              min="1"
              max="35"
              step="0.5"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              placeholder="e.g. 8"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
              required
            />
          </div>

          {/* Month / Year Profit Preference */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Profit Cadence
            </label>
            <select
              value={profitCadence}
              onChange={(e) => setProfitCadence(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="year">Per Year / Compounding</option>
              <option value="month">Per Month Cashflow</option>
            </select>
          </div>

          {/* Long Term or Short Term */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Term Horizon
            </label>
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="any">Any Horizon</option>
              <option value="short">Short Term (&le; 1 Year)</option>
              <option value="medium">Medium Term (1 - 5 Years)</option>
              <option value="long">Long Term (5+ Years)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shadow-emerald-600/30 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Find Match</span>
            </button>
          </div>
        </form>

        {isFilterSubmitted && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>
              Targeting ₹{Number(invAmount).toLocaleString('en-IN')} with {targetProfit}%+ returns ({timeHorizon === 'any' ? 'Any Horizon' : `${timeHorizon} Term`})
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{finalStreams.filter((s) => s.isMatch).length} matched streams surfaced to top</span>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. Interactive Category Tabs & Search Bar                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold'
                    : 'bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search income vehicles..."
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-xs"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Income Stream Cards Grid                                               */}
      {/* ========================================================================= */}
      {finalStreams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          No income streams match &quot;{searchQuery}&quot;. Clear the search filter to see all strategies.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {finalStreams.map((item) => {
            const isEmerald = item.riskColor === 'emerald';
            const isAmber = item.riskColor === 'amber';

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-white dark:bg-[#0c1322] p-5 shadow-sm transition-all duration-200 flex flex-col justify-between group relative ${item.isMatch
                    ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:shadow-md'
                  }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                      {item.assetClass}
                    </span>

                    {/* Matched Pill or Standard Risk Badge */}
                    {item.isMatch ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center space-x-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Best Match</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isEmerald
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                            : isAmber
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/80'
                          }`}
                      >
                        {item.risk}
                      </span>
                    )}
                  </div>

                  {/* Card Title */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>

                  {/* Return Horizon Pill */}
                  <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {item.returnHorizon}
                    </span>
                  </div>

                  {/* Profit Calculation Highlight on Match */}
                  {isFilterSubmitted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {profitCadence === 'month' ? 'Est. Monthly Payout:' : 'Est. Annual Profit:'}
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ~₹{profitCadence === 'month' ? item.estMonthly.toLocaleString('en-IN') : item.estAnnual.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* Short Summary */}
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Practical 2-line Guide */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      How to Get Started:
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <p className="leading-tight">{item.guide[0]}</p>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <p className="leading-tight">{item.guide[1]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Key Highlights */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                  {item.highlights.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Strategic Allocation Framework Card                                    */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                STS FINTECH Asset Allocation Guidance
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              Never allocate 100% of capital into any single asset class. Combine guaranteed fixed returns (FD/PPF) for peace of mind, equity indexes (NIFTY 50) for wealth accumulation, and cash-flow yield assets (REITs/SWP) for systematic passive liquidity.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <span className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold">
              50% Safe Core
            </span>
            <span className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/80 font-bold">
              30% Market Growth
            </span>
            <span className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 font-bold">
              20% Cash Flow / Gold
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}