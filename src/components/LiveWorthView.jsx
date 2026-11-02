import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  Zap,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
  User,
  ShieldCheck,
  Crown,
  Award,
  DollarSign,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Seconds in a normal calendar year (365 days * 24 hrs * 3600 sec)
const SECONDS_PER_YEAR = 365 * 24 * 3600; // 31,536,000 seconds

// Preset Wealth Profiles
const WEALTH_TIERS = [
  { min: 0, max: 500000, name: 'Pioneer Tier', color: 'emerald', badge: 'Tier I' },
  { min: 500000, max: 2500000, name: 'Silver Velocity', color: 'teal', badge: 'Tier II' },
  { min: 2500000, max: 10000000, name: 'Gold Capitalist', color: 'amber', badge: 'Tier III' },
  { min: 10000000, max: 50000000, name: 'Platinum Sovereign', color: 'indigo', badge: 'Tier IV' },
  { min: 50000000, max: Infinity, name: 'Diamond Vanguard', color: 'rose', badge: 'Tier V' },
];

export default function LiveWorthView({ currentUser }) {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('LiveWorthView LanguageContext fallback:', err);
  }

  // 1. Base Worth / Principal (defaults to ₹25,00,000 or saved value)
  const [baseWorth, setBaseWorth] = useState(() => {
    try {
      const saved = localStorage.getItem('sts_live_worth_base');
      const val = parseFloat(saved);
      return !isNaN(val) && val >= 0 ? val : 2500000;
    } catch {
      return 2500000;
    }
  });

  // 2. Annual Inflow / Rate parameters
  const [annualRate, setAnnualRate] = useState(() => {
    try {
      const saved = localStorage.getItem('sts_live_worth_rate');
      const val = parseFloat(saved);
      return !isNaN(val) && val > 0 ? val : 1200000; // default ₹12,00,000 / year
    } catch {
      return 1200000;
    }
  });

  // Mode: 'income' (flat ₹/year) or 'percent' (% annual yield on base worth)
  const [rateMode, setRateMode] = useState(() => {
    try {
      return localStorage.getItem('sts_live_worth_mode') || 'income';
    } catch {
      return 'income';
    }
  });

  const [yieldPercent, setYieldPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('sts_live_worth_yield_pct');
      const val = parseFloat(saved);
      return !isNaN(val) && val > 0 ? val : 12.5; // default 12.5%
    } catch {
      return 12.5;
    }
  });

  // Top-Right Input field state for "Enter the worth"
  const [inputWorth, setInputWorth] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Profile data
  const [profileName, setProfileName] = useState(() => {
    try {
      return localStorage.getItem('sts_live_worth_name') || currentUser?.name || 'STS Private Client';
    } catch {
      return currentUser?.name || 'STS Private Client';
    }
  });

  // Animation & calculation refs
  const startTimestampRef = useRef(Date.now());
  const baseWorthRef = useRef(baseWorth);

  // Effective annual growth amount in INR
  const effectiveAnnualGrowth = useMemo(() => {
    if (rateMode === 'percent') {
      return (baseWorth * (yieldPercent / 100));
    }
    return annualRate;
  }, [rateMode, yieldPercent, baseWorth, annualRate]);

  // Per-second, hourly, daily velocities
  const perSecondVelocity = effectiveAnnualGrowth / SECONDS_PER_YEAR;
  const perHourVelocity = perSecondVelocity * 3600;
  const perDayVelocity = perSecondVelocity * 86400;

  // Live display worth value (high precision)
  const [currentWorth, setCurrentWorth] = useState(baseWorth);

  // Sync ref when baseWorth changes
  useEffect(() => {
    baseWorthRef.current = baseWorth;
    startTimestampRef.current = Date.now();
  }, [baseWorth]);

  // Real-time dynamic counter ticking loop (every 50ms for ultra-smooth high-precision velocity)
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTimestampRef.current;
      const elapsedSec = elapsedMs / 1000;
      const computed = baseWorthRef.current + (elapsedSec * perSecondVelocity);
      setCurrentWorth(computed);
    }, 50);

    return () => clearInterval(interval);
  }, [perSecondVelocity]);

  // Handle setting new base worth from top-right input form
  const handleSetWorth = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = parseFloat(inputWorth);
    if (isNaN(val) || val < 0) {
      setToastMessage('Please enter a valid net worth amount (₹)');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setBaseWorth(val);
    try {
      localStorage.setItem('sts_live_worth_base', String(val));
    } catch (err) {
      console.warn(err);
    }

    setInputWorth('');
    setToastMessage(`Base worth updated to ₹${val.toLocaleString('en-IN')}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Derive current tier based on base worth
  const currentTier = useMemo(() => {
    return (
      WEALTH_TIERS.find((t) => currentWorth >= t.min && currentWorth < t.max) ||
      WEALTH_TIERS[0]
    );
  }, [currentWorth]);

  // Split current worth into Integer & Fractional precision string (4 decimals for dynamic ticking)
  const { integerPart, fractionPart } = useMemo(() => {
    const fixedStr = currentWorth.toFixed(4);
    const parts = fixedStr.split('.');
    const intNum = parseInt(parts[0], 10) || 0;
    const formattedInt = new Intl.NumberFormat('en-IN').format(intNum);
    return {
      integerPart: formattedInt,
      fractionPart: parts[1] || '0000',
    };
  }, [currentWorth]);

  // User initials
  const userInitials = useMemo(() => {
    if (profileName) {
      const parts = profileName.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return profileName.slice(0, 2).toUpperCase();
    }
    return 'STS';
  }, [profileName]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & TOP RIGHT INPUT AREA                      */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-[#0d5236] via-emerald-700 to-teal-600 bg-clip-text text-transparent">
              LIVE WORTH
            </h2>
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Dynamic real-time wealth velocity and continuous per-second accumulation engine.
          </p>
        </div>

        {/* Top-Right: Input field + button for "Enter the worth" */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSetWorth} className="flex items-center space-x-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={inputWorth}
                onChange={(e) => setInputWorth(e.target.value)}
                placeholder="Enter base worth..."
                className="w-40 sm:w-48 pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-90 transition active:scale-95 cursor-pointer flex items-center space-x-1.5 flex-shrink-0"
              style={{ backgroundColor: '#0d5236' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enter the worth</span>
            </button>
          </form>

          {/* Quick Velocity Configuration Trigger */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
            title="Configure Inflow & Yield Rates"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CENTER / HERO AREA: LARGE CIRCULAR DISPLAY CONTAINER   */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center justify-center pt-2 sm:pt-4">
        {/* Circular Card Outer Glow & Border */}
        <div className="relative group">
          {/* Animated Ambient Glow Ring */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-emerald-600/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />

          {/* Main Circular Container */}
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-[420px] md:h-[420px] rounded-full bg-white dark:bg-[#0d1322] border-4 border-emerald-500/35 dark:border-emerald-500/30 shadow-2xl flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden transition-transform duration-300">
            {/* High-tech radial background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* A. Header/Title: "Update Your Profile" with Avatar & Level/Tier */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="relative z-10 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer group/btn shadow-xs mb-3"
              title="Click to update profile & tier level"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0d5236] to-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                {userInitials}
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover/btn:text-emerald-700 dark:group-hover/btn:text-emerald-400 tracking-wide">
                Update Your Profile • {currentTier.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-emerald-600 transition-transform group-hover/btn:translate-x-0.5" />
            </button>

            {/* B. Main Dynamic Real-Time Counter */}
            <div className="relative z-10 my-1 sm:my-2">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                Total Live Net Worth
              </span>
              <div className="font-mono font-black tracking-tight flex items-baseline justify-center">
                <span className="text-2xl sm:text-3xl md:text-4xl text-[#0d5236] dark:text-emerald-400 mr-1 font-bold">
                  ₹
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                  {integerPart}
                </span>
                <span className="text-base sm:text-xl md:text-2xl text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                  .{fractionPart}
                </span>
              </div>
            </div>

            {/* C. Subtext: "Per second worth calculating" with Live Pulsing Emerald Indicator */}
            <div className="relative z-10 mt-3 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold tracking-tight">
                Per second worth calculating
              </span>
            </div>

            {/* Continuous velocity tag */}
            <div className="relative z-10 mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">
              +₹{perSecondVelocity.toFixed(4)} / sec velocity
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STATS GRID BELOW THE CIRCLE                             */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {/* Card 1: Worth / Second */}
        <div className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Worth / Second
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-[#0d5236] dark:text-emerald-400">
            +₹{perSecondVelocity.toFixed(4)}
          </p>
          <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Clock-tick micro accretion</span>
          </div>
        </div>

        {/* Card 2: Worth / Hour */}
        <div className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Worth / Hour
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            +₹{perHourVelocity.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Accumulated every 60 minutes
          </div>
        </div>

        {/* Card 3: Worth / Day */}
        <div className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Worth / Day
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            +₹{perDayVelocity.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            24-hour continuous yield rate
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. WEALTH VELOCITY CONFIGURATION DRAWER / MODAL           */}
      {/* ========================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#0d5236] dark:text-emerald-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Wealth Growth Parameters
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Mode Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Velocity Inflow Calculation Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRateMode('income');
                      localStorage.setItem('sts_live_worth_mode', 'income');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      rateMode === 'income'
                        ? 'bg-[#0d5236] text-white border-transparent'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Annual Inflow (₹/yr)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRateMode('percent');
                      localStorage.setItem('sts_live_worth_mode', 'percent');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      rateMode === 'percent'
                        ? 'bg-[#0d5236] text-white border-transparent'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Annual Yield (%)
                  </button>
                </div>
              </div>

              {rateMode === 'income' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Annual Inflow / Income (₹ / Year)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1000"
                      value={annualRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setAnnualRate(val);
                        localStorage.setItem('sts_live_worth_rate', String(val));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Divided across 31,536,000 seconds per year (+₹{(annualRate / SECONDS_PER_YEAR).toFixed(4)}/sec).
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Annual Compound Yield (% / Year)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={yieldPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setYieldPercent(val);
                        localStorage.setItem('sts_live_worth_yield_pct', String(val));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Compounding on your base worth (₹{(baseWorth * (yieldPercent / 100)).toLocaleString('en-IN')} / year).
                  </p>
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Quick Velocity Inflow Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '₹6L / yr', rate: 600000, desc: '+₹0.019/s' },
                    { label: '₹12L / yr', rate: 1200000, desc: '+₹0.038/s' },
                    { label: '₹24L / yr', rate: 2400000, desc: '+₹0.076/s' },
                    { label: '₹60L / yr', rate: 6000000, desc: '+₹0.190/s' },
                  ].map((p) => (
                    <button
                      key={p.rate}
                      type="button"
                      onClick={() => {
                        setRateMode('income');
                        setAnnualRate(p.rate);
                        localStorage.setItem('sts_live_worth_mode', 'income');
                        localStorage.setItem('sts_live_worth_rate', String(p.rate));
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-400 text-left transition"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.label}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition"
                style={{ backgroundColor: '#0d5236' }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. "UPDATE YOUR PROFILE" MODAL                            */}
      {/* ========================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md mx-4 p-5 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#0d5236] dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Your Profile
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Display / Investor Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. STS Lead Investor"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Wealth Tier
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {currentTier.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Tier range: ₹{currentTier.min.toLocaleString('en-IN')} – {currentTier.max === Infinity ? 'Uncapped' : `₹${currentTier.max.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                    {currentTier.badge}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('sts_live_worth_name', profileName);
                  } catch (e) {
                    console.warn(e);
                  }
                  setShowProfileModal(false);
                  setToastMessage('Profile details updated successfully');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition"
                style={{ backgroundColor: '#0d5236' }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
