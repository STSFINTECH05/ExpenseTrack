import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Coins,
  Building2,
  Search,
  Filter,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Calculator,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Landmark,
  Mail,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Streams', icon: Layers },
  { id: 'fixed', label: 'Fixed & Guaranteed', icon: ShieldCheck },
  { id: 'market', label: 'Market & Index Growth', icon: TrendingUp },
  { id: 'metals', label: 'Precious Metals & Commodities', icon: Coins },
  { id: 'cashflow', label: 'Cash-Flow Assets', icon: Building2 },
];

// --- BANK FD DIRECTORY DATA WITH RATES & DIGITAL PROCESS ---
const BANK_FD_RATES = [
  {
    bank: 'State Bank of India (SBI)',
    category: 'Public Sector',
    generalRate: '6.80% – 7.10%',
    seniorRate: '7.30% – 7.60%',
    tenure: '1 Yr to 3 Yrs (Amrit Kalash 400D @ 7.10%)',
    minDeposit: 1000,
    process: [
      'Login to YONO SBI App or OnlineSBI portal.',
      'Navigate to Deposits > Open Fixed Deposit (e-TDR / e-STDR).',
      'Select tenure, payout cadence, and fund from linked savings account.',
      'Instant digital receipt generated; no branch visit required.',
    ],
  },
  {
    bank: 'HDFC Bank',
    category: 'Private Sector',
    generalRate: '7.00% – 7.25%',
    seniorRate: '7.50% – 7.75%',
    tenure: '15 Months to 55 Months',
    minDeposit: 5000,
    process: [
      'Open HDFC MobileBanking app > Transact > Open Fixed Deposit.',
      'Choose Cumulative (compounding quarterly) or Non-cumulative (monthly/quarterly interest).',
      'Authenticate via NetBanking MPIN / OTP to complete instant creation.',
    ],
  },
  {
    bank: 'ICICI Bank',
    category: 'Private Sector',
    generalRate: '7.00% – 7.20%',
    seniorRate: '7.50% – 7.75%',
    tenure: '15 Months to 2 Years',
    minDeposit: 10000,
    process: [
      'Open iMobile Pay app > Accounts & Deposits > Deposits > Open FD.',
      'Select tenure and payout preferences.',
      'Instant FD activation with digital certificate download.',
    ],
  },
  {
    bank: 'Punjab National Bank (PNB)',
    category: 'Public Sector',
    generalRate: '6.80% – 7.25%',
    seniorRate: '7.30% – 7.75%',
    tenure: '400 Days to 2 Years',
    minDeposit: 1000,
    process: [
      'Access PNB ONE App > Services > Deposits > Open Term Deposit.',
      'Authorize via TPIN / OTP to lock interest rate.',
    ],
  },
  {
    bank: 'Bank of Baroda (BoB)',
    category: 'Public Sector',
    generalRate: '6.85% – 7.15%',
    seniorRate: '7.35% – 7.65%',
    tenure: '399 Days (Baroda Tiranga Plus) to 3 Years',
    minDeposit: 1000,
    process: [
      'Login to bob World Mobile App > Save & Invest > Fixed Deposit.',
      'Enter amount and auto-renewal instructions.',
    ],
  },
  {
    bank: 'Axis Bank',
    category: 'Private Sector',
    generalRate: '7.10% – 7.20%',
    seniorRate: '7.60% – 7.75%',
    tenure: '15 Months to 3 Years',
    minDeposit: 5000,
    process: [
      'Login to Axis Mobile app > FD / RD > Open FD.',
      'Verify details and submit using mPIN.',
    ],
  },
  {
    bank: 'Kotak Mahindra Bank',
    category: 'Private Sector',
    generalRate: '7.10% – 7.40%',
    seniorRate: '7.60% – 7.90%',
    tenure: '390 Days to 23 Months',
    minDeposit: 5000,
    process: [
      'Open Kotak 811 app > Investments > Term Deposits > Open Fixed Deposit.',
      'Instant opening with zero branch paperwork.',
    ],
  },
  {
    bank: 'Unity / Suryoday / Equitas Small Finance Banks',
    category: 'Small Finance Bank (DICGC Insured up to ₹5L)',
    generalRate: '8.00% – 8.60%',
    seniorRate: '8.50% – 9.10%',
    tenure: '1 Year to 3 Years',
    minDeposit: 1000,
    process: [
      'Complete Aadhaar Video-KYC on the SFB official website/app.',
      'Transfer funds via UPI / IMPS from any bank account.',
      'Receive digital deposit advice within 5 minutes.',
    ],
  },
];

// --- POST OFFICE SMALL SAVINGS SCHEMES DIRECTORY ---
const POST_OFFICE_SCHEMES = [
  {
    schemeName: 'Post Office Time Deposit (POTD)',
    rate: '6.9% – 7.5% p.a.',
    tenure: '1, 2, 3, or 5 Years',
    compounding: 'Compounded Quarterly, Paid Annually',
    minDeposit: '₹1,000 (No upper limit)',
    taxBenefit: '5-Year POTD qualifies under Section 80C',
    process: 'Open via India Post IPPB App or visit any Head/Sub Post Office with Form 1, Aadhaar, and PAN.',
  },
  {
    schemeName: 'Senior Citizen Savings Scheme (SCSS)',
    rate: '8.2% p.a.',
    tenure: '5 Years (Extendable by 3 years)',
    compounding: 'Paid Quarterly on 1st of April, July, Oct, Jan',
    minDeposit: '₹1,000 to ₹30,00,000',
    taxBenefit: 'Qualifies for 80C deduction; Age 60+ eligible',
    process: 'Submit SCSS application form at Post Office or designated bank branches with age proof.',
  },
  {
    schemeName: 'Monthly Income Scheme (POMIS)',
    rate: '7.4% p.a.',
    tenure: '5 Years',
    compounding: 'Credited Monthly to Post Office Savings Account',
    minDeposit: '₹1,000 (Max ₹9L Single, ₹15L Joint)',
    taxBenefit: 'Interest is taxable; no TDS deducted at source',
    process: 'Submit joint/single account form with KYC documents at Post Office branch.',
  },
  {
    schemeName: 'National Savings Certificate (NSC - VIII Issue)',
    rate: '7.7% p.a.',
    tenure: '5 Years Lock-in',
    compounding: 'Compounded Annually, Paid at Maturity',
    minDeposit: '₹1,000 (No upper limit)',
    taxBenefit: 'Section 80C tax rebate on principal & reinvested interest',
    process: 'Purchase via Post Office e-Banking portal or offline at nearest post office.',
  },
  {
    schemeName: 'Public Provident Fund (PPF)',
    rate: '7.1% p.a.',
    tenure: '15 Years',
    compounding: 'Compounded Annually (EEE Tax Exempt)',
    minDeposit: '₹500 to ₹1,50,000 per financial year',
    taxBenefit: 'Triple Tax Exemption (EEE): Principal, Interest & Maturity 100% Tax-Free',
    process: 'Open online via Post Office IPPB or any major scheduled commercial bank netbanking.',
  },
  {
    schemeName: 'Sukanya Samriddhi Yojana (SSY)',
    rate: '8.2% p.a.',
    tenure: 'Until girl child turns 21 or gets married',
    compounding: 'Compounded Annually',
    minDeposit: '₹250 to ₹1,50,000 per financial year',
    taxBenefit: 'Triple Tax Exemption (EEE) for parents of girl children under 10 years',
    process: 'Submit girl child birth certificate and parent KYC at any Post Office counter.',
  },
  {
    schemeName: 'Kisan Vikas Patra (KVP)',
    rate: '7.5% p.a.',
    tenure: 'Doubles money in 115 Months (9 Yrs & 7 Mos)',
    compounding: 'Compounded Annually, Paid on Maturity',
    minDeposit: '₹1,000 (No maximum limit)',
    taxBenefit: 'Taxable according to investor tax slab',
    process: 'Available online via DOP internet banking or across all Post Office counters.',
  },
  {
    schemeName: 'Mahila Samman Savings Certificate',
    rate: '7.5% p.a.',
    tenure: '2 Years Fixed',
    compounding: 'Compounded Quarterly',
    minDeposit: '₹1,000 to ₹2,00,000 (For women only)',
    taxBenefit: 'Standard interest taxation',
    process: 'Submit Application Form-1 at Post Office with KYC before March deadline.',
  },
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
    term: 'short',
    payoutType: 'both',
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

const BENCHMARK_AVENUES = [
  {
    name: 'Bank Fixed Deposit (FD)',
    rateRange: '6.5% – 7.5%',
    minRate: 0.065,
    maxRate: 0.075,
    risk: 'Low (DICGC Insured up to ₹5L)',
    tag: 'Guaranteed',
  },
  {
    name: 'Post Office Time Deposit',
    rateRange: '6.9% – 7.5%',
    minRate: 0.069,
    maxRate: 0.075,
    risk: 'Sovereign (Zero Risk)',
    tag: 'Government',
  },
  {
    name: 'High-Yield Savings Account',
    rateRange: '3.5% – 6.0%',
    minRate: 0.035,
    maxRate: 0.060,
    risk: 'Low (Instant Liquidity)',
    tag: 'Liquid',
  },
  {
    name: 'Short-Term Debt Mutual Fund',
    rateRange: '6.5% – 7.2%',
    minRate: 0.065,
    maxRate: 0.072,
    risk: 'Low to Moderate Risk',
    tag: 'Flexible',
  },
  {
    name: 'NIFTY 50 Index Fund',
    rateRange: '11.0% – 13.0%',
    minRate: 0.110,
    maxRate: 0.130,
    risk: 'Market Linked (5+ yrs)',
    tag: 'Equity',
  },
];

export default function IncomeStreamsView() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed Deposit & Post Office Directory Views
  const [activeDirectoryTab, setActiveDirectoryTab] = useState('none'); // 'none' | 'bank_fd' | 'post_office'

  // Interactive Filter States (initialized with defaults)
  const [isFilterSubmitted, setIsFilterSubmitted] = useState(false);
  const [invAmount, setInvAmount] = useState('35000');
  const [targetProfit, setTargetProfit] = useState('1000');
  const [profitCadence, setProfitCadence] = useState('year'); // 'month' or 'year'
  const [timeHorizon, setTimeHorizon] = useState('any'); // 'any', 'short', 'medium', 'long'

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setIsFilterSubmitted(true);
  };

  const handleResetFilter = () => {
    setIsFilterSubmitted(false);
    setInvAmount('35000');
    setTargetProfit('1000');
    setProfitCadence('year');
    setTimeHorizon('any');
  };

  // Safe numerical conversions
  const numPrincipal = Math.max(Number(invAmount) || 0, 1);
  const numTargetProfit = Math.max(Number(targetProfit) || 0, 0);
  const annualizedTarget = profitCadence === 'month' ? numTargetProfit * 12 : numTargetProfit;

  // Rate calculations
  const requiredReturnRate = ((annualizedTarget / numPrincipal) * 100).toFixed(2);
  const rateNum = Number(requiredReturnRate);

  // Capital suggestion
  const realisticSafeRate = 0.075;
  const suggestedPrincipalAtSafeRate = Math.round(annualizedTarget / realisticSafeRate);
  const isHighProfitExceeded = rateNum > 12.0;

  const handleApplySuggestedAmount = (amt) => {
    setInvAmount(String(amt));
  };

  // Filtered & ranked streams
  const processedStreams = useMemo(() => {
    const list = INCOME_STREAMS.map((item) => {
      let isMatch = false;
      const avgYield = (item.yieldMin + item.yieldMax) / 2;
      const estAnnual = Math.round((numPrincipal * avgYield) / 100);
      const estMonthly = Math.round(estAnnual / 12);

      if (isFilterSubmitted && numPrincipal > 0 && annualizedTarget > 0) {
        const matchesAmount = numPrincipal >= item.minAmount;
        const matchesYield = (item.yieldMax / 100) * numPrincipal >= annualizedTarget;
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

    return list.sort((a, b) => {
      if (isFilterSubmitted) {
        if (a.isMatch && !b.isMatch) return -1;
        if (!a.isMatch && b.isMatch) return 1;
      }
      return 0;
    });
  }, [numPrincipal, annualizedTarget, profitCadence, timeHorizon, isFilterSubmitted]);

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
      {/* 1. Header Banner */}
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

        {/* Directory Quick-Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              setActiveDirectoryTab((prev) => (prev === 'bank_fd' ? 'none' : 'bank_fd'))
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors cursor-pointer ${activeDirectoryTab === 'bank_fd'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
              }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bank FD Rates & Process</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveDirectoryTab((prev) => (prev === 'post_office' ? 'none' : 'post_office'))
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors cursor-pointer ${activeDirectoryTab === 'post_office'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            <span>Post Office Schemes</span>
          </button>
        </div>
      </div>

      {/* --- DIRECTORY SECTION 1: ALL BANK FD RATES & PROCESS --- */}
      {activeDirectoryTab === 'bank_fd' && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-[#0c1322] p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Top Bank Fixed Deposit Rates & Online Opening Process
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All scheduled banks are covered up to ₹5,00,000 principal + interest under DICGC insurance.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveDirectoryTab('none')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {BANK_FD_RATES.map((b, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#080d19] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {b.bank}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {b.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 uppercase font-sans font-bold">General Public</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{b.generalRate}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 uppercase font-sans font-bold">Senior Citizens</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{b.seniorRate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <strong className="text-slate-700 dark:text-slate-300">Best Tenure:</strong> {b.tenure} • <strong className="text-slate-700 dark:text-slate-300">Min:</strong> ₹{b.minDeposit.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-[#0c1322] border border-slate-100 dark:border-slate-800/60 text-[11px] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Online Process:</span>
                  {b.process.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DIRECTORY SECTION 2: ALL POST OFFICE SCHEMES & RATES --- */}
      {activeDirectoryTab === 'post_office' && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-[#0c1322] p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Post Office Small Savings Schemes (Govt. Guaranteed)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Backed by Sovereign Guarantee with zero default risk and periodic quarterly interest revisions.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveDirectoryTab('none')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Scheme Name</th>
                  <th className="pb-3">Interest Rate (% p.a.)</th>
                  <th className="pb-3">Tenure / Horizon</th>
                  <th className="pb-3">Deposit Limits</th>
                  <th className="pb-3">Tax Benefits / Rules</th>
                  <th className="pb-3 pr-2">Opening Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {POST_OFFICE_SCHEMES.map((sch, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-slate-100">
                      {sch.schemeName}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {sch.rate}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">
                      {sch.tenure}
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-400">
                      {sch.minDeposit}
                    </td>
                    <td className="py-3.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {sch.taxBenefit}
                    </td>
                    <td className="py-3.5 pr-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {sch.process}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Interactive Match Filter Form */}
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
              placeholder="35000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Desired Profit (₹)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={targetProfit}
              onChange={(e) => setTargetProfit(e.target.value)}
              placeholder="1000"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
              required
            />
          </div>

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
      </div>

      {/* 3. Feasibility Breakdown Card */}
      {isFilterSubmitted && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-sm p-6 space-y-5 animate-fadeIn">
          {/* Formula Ribbon */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To earn <strong className="text-slate-900 dark:text-white">₹{annualizedTarget.toLocaleString('en-IN')} per year</strong> on an investment of <strong className="text-slate-900 dark:text-white">₹{numPrincipal.toLocaleString('en-IN')}</strong>, your required annual return rate is:
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Formula:</span>
              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <span>({annualizedTarget.toLocaleString('en-IN')} / {numPrincipal.toLocaleString('en-IN')}) × 100 =</span>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-md ${isHighProfitExceeded
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  }`}>
                  {requiredReturnRate}% p.a.
                </span>
              </div>
            </div>
          </div>

          {/* Capital Suggestion Callout */}
          {isHighProfitExceeded ? (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 text-xs text-slate-800 dark:text-slate-200 flex items-start space-x-3">
              <div className="mt-0.5 flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Capital Adjustment Suggestion: </strong>
                  To get a profit of <strong className="text-amber-700 dark:text-amber-300">₹{annualizedTarget.toLocaleString('en-IN')}/year</strong>, earning <strong className="text-slate-900 dark:text-white">{requiredReturnRate}% p.a.</strong> is beyond standard guaranteed yields.
                  At realistic safe market rates (~<strong>7.5% p.a.</strong> in FDs), your investment amount needs to be approximately <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">₹{suggestedPrincipalAtSafeRate.toLocaleString('en-IN')}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySuggestedAmount(suggestedPrincipalAtSafeRate)}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline pt-0.5 cursor-pointer"
                >
                  <span>Set investment amount to ₹{suggestedPrincipalAtSafeRate.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-3">
              <div className="mt-0.5 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                Because <strong className="text-slate-900 dark:text-white">{requiredReturnRate}%</strong> is very low compared to standard market yields, you can achieve this easily with virtually <strong className="text-slate-900 dark:text-white">zero risk</strong> using standard guaranteed instruments. In fact, most standard avenues will deliver <strong className="text-emerald-600 dark:text-emerald-400">₹{Math.round(numPrincipal * 0.065).toLocaleString('en-IN')} to ₹{Math.round(numPrincipal * 0.075).toLocaleString('en-IN')}+ per year</strong>, significantly exceeding your target.
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Comparison of Suitable Options
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">Investment Avenue</th>
                    <th className="pb-3">Typical Yield (% p.a.)</th>
                    <th className="pb-3">Annual Profit on ₹{numPrincipal.toLocaleString('en-IN')}</th>
                    <th className="pb-3">Risk Level</th>
                    <th className="pb-3 text-right pr-2">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {BENCHMARK_AVENUES.map((item, i) => {
                    const minProfit = Math.round(numPrincipal * item.minRate);
                    const maxProfit = Math.round(numPrincipal * item.maxRate);
                    const beatsTarget = minProfit >= annualizedTarget;

                    return (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </td>
                        <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {item.rateRange}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          ₹{minProfit.toLocaleString('en-IN')} – ₹{maxProfit.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">
                          {item.risk}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {beatsTarget ? (
                            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                              Surpasses Target (+₹{(minProfit - annualizedTarget).toLocaleString('en-IN')})
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                              Below Target
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
      )}

      {/* 4. Interactive Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* 5. Income Stream Cards Grid */}
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
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                      {item.assetClass}
                    </span>

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

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {item.returnHorizon}
                    </span>
                  </div>

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

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.summary}
                  </p>

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

      {/* 6. Strategic Allocation Guidance */}
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