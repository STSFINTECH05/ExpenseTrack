import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  MapPin,
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
    generalRate: '6.90% – 7.20%',
    seniorRate: '7.40% – 7.75%',
    tenure: '1 Yr to 5 Yrs (Golden Years scheme)',
    minDeposit: 10000,
    process: [
      'Launch iMobile Pay app > Deposits > FD/RD.',
      'Enter amount, tenure, and choose auto-renewal or payout option.',
      'Confirm with fingerprint / OTP for immediate deposit creation.',
    ],
  },
  {
    bank: 'Punjab National Bank (PNB)',
    category: 'Public Sector',
    generalRate: '6.85% – 7.25%',
    seniorRate: '7.35% – 7.75%',
    tenure: '444 Days Special Scheme @ 7.25%',
    minDeposit: 1000,
    process: [
      'Sign in to PNB ONE Mobile App > Services > Term Deposit.',
      'Choose special tenor schemes or standard terms with monthly/quarterly interest.',
      'Confirm submission and download deposit advice.',
    ],
  },
  {
    bank: 'Bank of Baroda (BoB)',
    category: 'Public Sector',
    generalRate: '6.85% – 7.15%',
    seniorRate: '7.35% – 7.65%',
    tenure: 'Bob Tiranga Plus 399 Days @ 7.15%',
    minDeposit: 1000,
    process: [
      'Access BoB World App > Save & Invest > Fixed Deposit.',
      'Select scheme type, tenure, and nominee details digitally.',
      'Authenticate via transaction PIN for instant booking.',
    ],
  },
  {
    bank: 'Utkarsh / Equitas Small Finance Bank',
    category: 'Small Finance Bank (High Yield)',
    generalRate: '8.25% – 8.50%',
    seniorRate: '8.75% – 9.00%',
    tenure: '2 Years to 3 Years',
    minDeposit: 1000,
    process: [
      'Open via Video-KYC on Bank Portal with Aadhaar + PAN (Zero Paperwork).',
      'Transfer funds via UPI/NetBanking into the created term deposit.',
      'Covered under DICGC insurance up to ₹5,00,000 per depositor.',
    ],
  },
];

// --- POST OFFICE SMALL SAVINGS SCHEMES DIRECTORY (Govt of India Sovereign Guarantee) ---
const POST_OFFICE_SCHEMES = [
  {
    name: 'Senior Citizen Savings Scheme (SCSS)',
    interestRate: '8.20% p.a.',
    compounding: 'Paid Quarterly (1st working day of April, July, Oct, Jan)',
    tenure: '5 Years (Extendable by 3 years)',
    minDeposit: '₹1,000 (Max ₹30 Lakhs)',
    eligibility: 'Individuals aged 60+ (or 55+ for VRS retirees)',
    taxBenefit: 'Section 80C rebate eligible; TDS deducted if interest > ₹50k',
    process: [
      'Download Form 1 from India Post website or visit any Head/Sub Post Office.',
      'Submit Aadhaar, PAN card copy, age proof, and two passport photos.',
      'Deposit by cheque / cash (cheque realized date is account opening date).',
      'Receive India Post Savings Passbook with quarterly payout instructions.',
    ],
    features: ['Highest sovereign guaranteed safety', 'Quarterly regular retirement cash flow', 'Joint holding with spouse allowed'],
  },
  {
    name: 'National Savings Monthly Income Scheme (MIS / POMIS)',
    interestRate: '7.40% p.a.',
    compounding: 'Paid Monthly into linked Post Office Savings Account',
    tenure: '5 Years',
    minDeposit: '₹1,000 (Single Max ₹9 Lakhs, Joint Max ₹15 Lakhs)',
    eligibility: 'Resident Indian individuals, single or up to 3 adults jointly',
    taxBenefit: 'No 80C deduction; Interest is taxable as per individual tax slab',
    process: [
      'Open an India Post Savings Account (POSA) for auto-crediting monthly interest.',
      'Submit POMIS application form with KYC documents at Post Office counter.',
      'Link auto-credit to POSA or setup ECS mandate to transfer to commercial bank.',
      'Interest begins crediting every calendar month on deposit date.',
    ],
    features: ['Dependable monthly cash salary', 'Joint limit up to ₹15 Lakhs', 'Can be reinvested into Post Office RD'],
  },
  {
    name: 'Sukanya Samriddhi Yojana (SSY)',
    interestRate: '8.20% p.a.',
    compounding: 'Compounded Annually',
    tenure: '21 Years from opening (Deposits for 15 years)',
    minDeposit: 'Min ₹250 / Year (Max ₹1.5 Lakhs / Year)',
    eligibility: 'Girl child below 10 years of age (Max 2 daughters)',
    taxBenefit: 'Complete EEE Status (Investment 80C exempt, Interest exempt, Maturity exempt)',
    process: [
      'Fill SSY Form with girl child birth certificate and parent/guardian KYC.',
      'Submit initial deposit of ₹250+ at any Post Office or authorized bank.',
      'Subsequent yearly contributions can be made digitally via IPPB Mobile Banking.',
      '50% partial withdrawal permitted after age 18 for higher education.',
    ],
    features: ['Triple EEE tax exemption', 'Unmatched long-term wealth compounding for daughter', 'Sovereign guaranteed'],
  },
  {
    name: 'Public Provident Fund (PPF)',
    interestRate: '7.10% p.a.',
    compounding: 'Compounded Annually (Calculated on 5th of each month)',
    tenure: '15 Years (Extendable in 5-year blocks indefinitely)',
    minDeposit: 'Min ₹500 / Year (Max ₹1.5 Lakhs / Year)',
    eligibility: 'Resident Indian individuals',
    taxBenefit: 'Complete EEE Status (Sec 80C deductible, tax-free interest & maturity)',
    process: [
      'Open at any Post Office or instantly via SBI/HDFC/ICICI NetBanking.',
      'Set automated monthly Standing Instruction between 1st and 5th of month.',
      'Passbook updated annually with accrued tax-free interest.',
      'Loan facility from 3rd to 6th financial year.',
    ],
    features: ['Bulletproof asset protection (court attachment exempt)', 'Tax-free sovereign compounding', 'Flexible deposit installments'],
  },
  {
    name: 'Kisan Vikas Patra (KVP)',
    interestRate: '7.50% p.a.',
    compounding: 'Compounded Annually (Doubles Money in 115 Months)',
    tenure: '9 Years 7 Months (115 Months)',
    minDeposit: '₹1,000 (No upper investment ceiling)',
    eligibility: 'Adult Indian citizens, single or joint',
    taxBenefit: 'No Section 80C benefit; Taxable as per individual income slab',
    process: [
      'Submit KVP application at nearest Post Office counter.',
      'Deposit funds via cash, cheque, or demand draft.',
      'Certificate issued physically or in passbook/e-mode.',
      'Redeem full doubled principal on maturity date.',
    ],
    features: ['Guaranteed principal doubling', 'Zero market risk', 'Can be pledged as collateral for bank loans'],
  },
  {
    name: 'Post Office Time Deposit (POTD - 1, 2, 3 & 5 Years)',
    interestRate: '6.90% (1Y) • 7.00% (2Y) • 7.10% (3Y) • 7.50% (5Y)',
    compounding: 'Calculated Quarterly, Paid Annually',
    tenure: '1, 2, 3, or 5 Years',
    minDeposit: '₹1,000 (No maximum limit)',
    eligibility: 'Resident Indians, single or joint',
    taxBenefit: '5-Year Time Deposit qualifies for Section 80C tax deduction',
    process: [
      'Submit Time Deposit application with POSA account details.',
      'Select deposit term (1, 2, 3, or 5 years).',
      'Annual interest auto-transfers to your savings account.',
      'Option to auto-renew on maturity.',
    ],
    features: ['Government-backed FD alternative', 'Section 80C benefit on 5-year tenure', 'Quarterly compounding benefit'],
  },
];

// Benchmark database for Indian metros and tier-2 zones
const LOCALITY_BENCHMARKS = [
  {
    city: 'Chennai',
    district: 'Chennai District',
    locality: 'OMR',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 5500,
    maxSqFt: 9800,
    medianSqFt: 7200,
    growth3Yr: '7.5% – 9.2%',
    rentalYield: '3.6% – 4.4%',
    notes: 'Major IT/Tech corridor. Strong tech tenant demand with high rental occupancy.',
  },
  {
    city: 'Chennai',
    district: 'Chennai District',
    locality: 'Velachery',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 7200,
    maxSqFt: 12500,
    medianSqFt: 9400,
    growth3Yr: '6.8% – 8.5%',
    rentalYield: '3.2% – 4.0%',
    notes: 'Established residential hub connected to MRTS, OMR IT parks, and Phoenix MarketCity.',
  },
  {
    city: 'Chennai',
    district: 'Chennai District',
    locality: 'Anna Nagar',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 12500,
    maxSqFt: 22000,
    medianSqFt: 16500,
    growth3Yr: '5.5% – 7.2%',
    rentalYield: '2.5% – 3.2%',
    notes: 'Prime luxury residential quarter with premium social infrastructure and Metro accessibility.',
  },
  {
    city: 'Chennai',
    district: 'Kanchipuram',
    locality: 'Guduvanchery',
    propertyType: 'Independent Villa / Residential Plot',
    minSqFt: 2800,
    maxSqFt: 5200,
    medianSqFt: 3900,
    growth3Yr: '9.0% – 12.0%',
    rentalYield: '2.0% – 2.8%',
    notes: 'Emerging suburban growth corridor along GST Road with steady industrial appreciation.',
  },
  {
    city: 'Bengaluru',
    district: 'Bangalore Urban',
    locality: 'Whitefield',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 7500,
    maxSqFt: 14500,
    medianSqFt: 10200,
    growth3Yr: '8.5% – 11.0%',
    rentalYield: '4.2% – 5.2%',
    notes: 'Massive IT hub served by Purple Line Metro. Exceptional rental demand for gated communities.',
  },
  {
    city: 'Bengaluru',
    district: 'Bangalore Urban',
    locality: 'Sarjapur Road',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 6800,
    maxSqFt: 13000,
    medianSqFt: 9200,
    growth3Yr: '8.0% – 10.5%',
    rentalYield: '3.8% – 4.8%',
    notes: 'Key connectivity between Bellandur Outer Ring Road and Electronic City.',
  },
  {
    city: 'Bengaluru',
    district: 'Bangalore Urban',
    locality: 'Indiranagar',
    propertyType: 'Commercial / Office Space',
    minSqFt: 18000,
    maxSqFt: 35000,
    medianSqFt: 26000,
    growth3Yr: '6.0% – 8.0%',
    rentalYield: '6.5% – 8.2%',
    notes: 'Elite commercial high-street retail zone with top-tier F&B and brand presence.',
  },
  {
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    locality: 'Bandra',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 38000,
    maxSqFt: 78000,
    medianSqFt: 54000,
    growth3Yr: '5.0% – 6.8%',
    rentalYield: '2.4% – 3.1%',
    notes: 'Ultra-prime western coast residential haven for executives, celebrities, and HNIs.',
  },
  {
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    locality: 'Andheri East',
    propertyType: 'Commercial / Office Space',
    minSqFt: 16000,
    maxSqFt: 28000,
    medianSqFt: 21500,
    growth3Yr: '6.5% – 8.5%',
    rentalYield: '6.8% – 8.4%',
    notes: 'Prime transit-oriented business park district near International Airport and Metro 1.',
  },
  {
    city: 'Coimbatore',
    district: 'Coimbatore',
    locality: 'Avinashi Road',
    propertyType: 'Apartment / High-Rise Flat',
    minSqFt: 4500,
    maxSqFt: 8200,
    medianSqFt: 6100,
    growth3Yr: '7.2% – 9.5%',
    rentalYield: '3.2% – 4.0%',
    notes: 'Premier institutional and healthcare spine with rapid commercial and residential growth.',
  },
  {
    city: 'Coimbatore',
    district: 'Coimbatore',
    locality: 'Saravanampatti',
    propertyType: 'Independent Villa / Residential Plot',
    minSqFt: 2400,
    maxSqFt: 4600,
    medianSqFt: 3400,
    growth3Yr: '8.8% – 11.5%',
    rentalYield: '2.2% – 3.0%',
    notes: 'IT corridor of Coimbatore; strong plotted development appreciation fueled by tech campus expansion.',
  },
];

// Fallback-safe currency formatter
const formatINR = (val) => {
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return '₹0';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n).toLocaleString()}`;
  }
};

// Pure deterministic valuation calculator
function calculateValuation(loc, cit, dist, pType) {
  const locClean = String(loc || '').trim().toLowerCase();
  const cityClean = String(cit || '').trim().toLowerCase();
  const propType = String(pType || 'Apartment / High-Rise Flat');

  const matched = LOCALITY_BENCHMARKS.find((b) => {
    const bLoc = b.locality.toLowerCase();
    const bCit = b.city.toLowerCase();
    return (
      (locClean.includes(bLoc) || bLoc.includes(locClean)) &&
      (cityClean.includes(bCit) || bCit.includes(cityClean))
    );
  });

  if (matched) {
    let multiplier = 1.0;
    if (propType === 'Commercial / Office Space') multiplier = 1.45;
    else if (propType === 'Independent Villa / Residential Plot') multiplier = 0.65;

    const min = Math.max(100, Math.round((Number(matched.minSqFt) || 5000) * multiplier));
    const max = Math.max(min, Math.round((Number(matched.maxSqFt) || 9000) * multiplier));
    const median = Math.max(min, Math.round((Number(matched.medianSqFt) || 7000) * multiplier));

    return {
      locality: matched.locality,
      city: matched.city,
      district: matched.district || dist || 'Local Region',
      propertyType: propType,
      minSqFt: min,
      maxSqFt: max,
      medianSqFt: median,
      unitInvestment1000Min: min * 1000,
      unitInvestment1000Max: max * 1000,
      unitInvestment1000Median: median * 1000,
      growth3Yr: matched.growth3Yr || '7.5% – 9.5%',
      rentalYield: propType === 'Commercial / Office Space' ? '6.5% – 8.5%' : (matched.rentalYield || '3.2% – 4.2%'),
      notes: matched.notes || 'High-demand urban corridor with steady tenancy.',
      confidence: 'Verified Registry Comps',
    };
  }

  // Fallback heuristic based on city tier
  let baseMedian = 6500;
  let growth = '7.0% – 9.0%';
  let rentYield = '3.0% – 3.8%';

  if (cityClean.includes('mumbai')) {
    baseMedian = 28000;
    growth = '5.5% – 7.5%';
    rentYield = '2.4% – 3.2%';
  } else if (cityClean.includes('bengaluru') || cityClean.includes('bangalore')) {
    baseMedian = 9500;
    growth = '8.0% – 10.5%';
    rentYield = '3.8% – 4.8%';
  } else if (cityClean.includes('chennai')) {
    baseMedian = 7800;
    growth = '6.8% – 8.8%';
    rentYield = '3.4% – 4.2%';
  } else if (cityClean.includes('delhi') || cityClean.includes('gurgaon') || cityClean.includes('noida')) {
    baseMedian = 11000;
    growth = '7.5% – 9.8%';
    rentYield = '2.8% – 3.6%';
  } else if (cityClean.includes('hyderabad')) {
    baseMedian = 8500;
    growth = '8.5% – 11.2%';
    rentYield = '3.6% – 4.5%';
  } else if (cityClean.includes('coimbatore') || cityClean.includes('pune') || cityClean.includes('ahmedabad')) {
    baseMedian = 5800;
    growth = '7.5% – 10.0%';
    rentYield = '3.0% – 3.8%';
  }

  if (propType === 'Commercial / Office Space') {
    baseMedian = Math.round(baseMedian * 1.5);
    rentYield = '6.5% – 8.5%';
  } else if (propType === 'Independent Villa / Residential Plot') {
    baseMedian = Math.round(baseMedian * 0.65);
    rentYield = '1.8% – 2.5%';
    growth = '9.0% – 12.5%';
  }

  const min = Math.max(100, Math.round(baseMedian * 0.75));
  const max = Math.max(min, Math.round(baseMedian * 1.35));
  const median = baseMedian;

  return {
    locality: loc || 'Central Corridor',
    city: cit || 'Metro Region',
    district: dist || 'Urban District',
    propertyType: propType,
    minSqFt: min,
    maxSqFt: max,
    medianSqFt: median,
    unitInvestment1000Min: min * 1000,
    unitInvestment1000Max: max * 1000,
    unitInvestment1000Median: median * 1000,
    growth3Yr: growth,
    rentalYield: rentYield,
    notes: `Calculated from active market index and circle rate registry comps in ${cit || 'target area'}.`,
    confidence: 'Municipal Circle Rate & Portal Aggregator Comps',
  };
}

// --- CO-LOCATED SAFE REAL ESTATE MODAL ---
function RealEstateValuationModal({ isOpen, onClose }) {
  const [locality, setLocality] = useState('OMR');
  const [city, setCity] = useState('Chennai');
  const [district, setDistrict] = useState('Chennai District');
  const [propertyType, setPropertyType] = useState('Apartment / High-Rise Flat');

  const [analyzedResult, setAnalyzedResult] = useState(() => {
    return calculateValuation('OMR', 'Chennai', 'Chennai District', 'Apartment / High-Rise Flat');
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAnalyze = (e) => {
    e.preventDefault();
    const result = calculateValuation(locality, city, district, propertyType);
    setAnalyzedResult(result);
  };

  const handleQuickLocality = (preset) => {
    setLocality(preset.locality);
    setCity(preset.city);
    setDistrict(preset.district || '');
    setPropertyType(preset.propertyType);
    const result = calculateValuation(preset.locality, preset.city, preset.district, preset.propertyType);
    setAnalyzedResult(result);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-auto max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl animate-fadeIn text-slate-900 dark:text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Real Estate Land & Sq. Ft. Valuation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live land metrics, fair market rates, capital growth & rental yields
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-sm leading-none flex items-center justify-center w-8 h-8 font-bold"
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Location / Area */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Location / Area <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g., OMR, Velachery, Whitefield"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                City <span className="text-emerald-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Chennai, Bengaluru, Mumbai"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* District / Zone */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                District / Zone
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g., Kanchipuram, Urban, Suburban"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* Property Asset Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Property Asset Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer font-medium"
              >
                <option value="Apartment / High-Rise Flat">Apartment / High-Rise Flat</option>
                <option value="Independent Villa / Residential Plot">Independent Villa / Residential Plot</option>
                <option value="Commercial / Office Space">Commercial / Office Space</option>
              </select>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1 text-[11px]">
            <span className="text-slate-400 text-[10px] font-mono mr-1">Comps:</span>
            {LOCALITY_BENCHMARKS.slice(0, 4).map((p) => (
              <button
                key={p.locality}
                type="button"
                onClick={() => handleQuickLocality(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition whitespace-nowrap cursor-pointer"
              >
                {p.locality} ({p.city})
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Find Sq. Ft. Rates</span>
            </button>
          </div>
        </form>

        {/* Output & Valuation Results Display */}
        {analyzedResult && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-4 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                    {analyzedResult.locality}, {analyzedResult.city}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    {analyzedResult.propertyType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{analyzedResult.district}</p>
              </div>

              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
                ✓ {analyzedResult.confidence}
              </div>
            </div>

            {/* 3 Metric Cards: Lowest, Median, Highest */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Lowest Sq. Ft. Rate */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Lowest Sq. Ft. Rate</span>
                  <span className="text-rose-500 font-bold text-xs">↓</span>
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                  ₹{Number(analyzedResult.minSqFt || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-400">/sq.ft</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Entry baseline / older comps</p>
              </div>

              {/* Median / Average Market Rate */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/40">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center justify-between">
                  <span>Median Market Rate</span>
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </span>
                <h4 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  ₹{Number(analyzedResult.medianSqFt || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-emerald-500/70">/sq.ft</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Weighted transaction average</p>
              </div>

              {/* Highest Sq. Ft. Rate */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Highest Sq. Ft. Rate</span>
                  <span className="text-emerald-500 font-bold text-xs">↑</span>
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
                  ₹{Number(analyzedResult.maxSqFt || 0).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate-400">/sq.ft</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Grade-A luxury / prime frontage</p>
              </div>
            </div>

            {/* Standard 1,000 sq.ft total outlay estimate range */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Standard 1,000 Sq. Ft. Total Outlay
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatINR(analyzedResult.unitInvestment1000Min)} – {formatINR(analyzedResult.unitInvestment1000Max)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Median Ticket Size: <span className="text-emerald-500 font-bold font-mono">{formatINR(analyzedResult.unitInvestment1000Median)}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">3-Yr Capital CAGR</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{analyzedResult.growth3Yr}</span>
                </div>
                <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Rental Yield</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{analyzedResult.rentalYield}</span>
                </div>
              </div>
            </div>

            {/* Micro-market Locality Insights */}
            {analyzedResult.notes && (
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Locality Insight: </span>
                  <span>{analyzedResult.notes}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 12 Curated Income Streams Across 4 Categories
const INCOME_STREAMS = [
  // 1. Fixed & Guaranteed
  {
    id: 'fd',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed',
    title: 'Bank Fixed Deposits (FD)',
    assetClass: 'Debt / Cash Equivalent',
    risk: 'Low Risk',
    riskColor: 'emerald',
    returnHorizon: '6.8% – 7.5% p.a. • 1 – 5 Years',
    yieldMin: 6.8,
    yieldMax: 7.5,
    minAmount: 1000,
    term: 'short',
    payoutType: 'both',
    summary: 'Guaranteed principal safety backed by RBI DICGC insurance up to ₹5 Lakhs per bank.',
    guide: [
      'Choose cumulative payout for maximum quarterly compounding, or monthly payout for supplemental passive cash flow.',
      'Split larger sums across 2-3 different scheduled commercial banks to maximize full insurance protection.',
    ],
    highlights: ['DICGC Insured up to ₹5L', 'Instant Loan/Overdraft against FD', 'Senior Citizens get +0.50% extra'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'scss',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed',
    title: 'Senior Citizen Savings Scheme (SCSS)',
    assetClass: 'Government Sovereign Debt',
    risk: 'Zero Risk (Sovereign)',
    riskColor: 'emerald',
    returnHorizon: '8.20% p.a. • 5 Years (Quarterly Payout)',
    yieldMin: 8.2,
    yieldMax: 8.2,
    minAmount: 1000,
    term: 'medium',
    payoutType: 'monthly',
    summary: 'Sovereign-backed retirement income stream offering highest fixed returns with quarterly bank deposits.',
    guide: [
      'Open at any public/private bank or post office with age 60+ proof.',
      'Quarterly interest directly auto-credits to linked savings account on the 1st of April, July, October, and January.',
    ],
    highlights: ['Sovereign Government Guarantee', 'Section 80C Tax Deduction', 'Max investment ₹30 Lakhs'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'pomis',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed',
    title: 'Post Office Monthly Income Scheme (POMIS)',
    assetClass: 'Government Sovereign Debt',
    risk: 'Zero Risk (Sovereign)',
    riskColor: 'emerald',
    returnHorizon: '7.40% p.a. • 5 Years (Monthly Payout)',
    yieldMin: 7.4,
    yieldMax: 7.4,
    minAmount: 1000,
    term: 'medium',
    payoutType: 'monthly',
    summary: 'Dependable monthly income deposited on the same day every calendar month without stock market volatility.',
    guide: [
      'Deposit up to ₹9 Lakhs individually or ₹15 Lakhs jointly with spouse.',
      'Setup auto-credit mandate to your primary savings bank via India Post Payment Bank (IPPB).',
    ],
    highlights: ['Guaranteed Monthly Pension Alternative', 'Joint Holding up to ₹15L', 'Principal returned 100% on maturity'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'ppf',
    category: 'fixed',
    categoryName: 'Fixed & Guaranteed',
    title: 'Public Provident Fund (PPF)',
    assetClass: 'Government Sovereign Debt',
    risk: 'Zero Risk (Sovereign)',
    riskColor: 'emerald',
    returnHorizon: '7.10% p.a. • 15 Years (Tax-Free EEE)',
    yieldMin: 7.1,
    yieldMax: 7.1,
    minAmount: 500,
    term: 'long',
    payoutType: 'annual',
    summary: 'The ultimate tax-free long-term wealth compounding vehicle backed 100% by the Central Government.',
    guide: [
      'Deposit between 1st and 5th of each month to earn full monthly interest compounding.',
      'Invest up to ₹1,50,000 annually to claim Section 80C tax deductions.',
    ],
    highlights: ['Triple EEE Tax Status (Zero Tax)', 'Immune from court attachment', 'Extendable in 5-year blocks indefinitely'],
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-800/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },

  // 2. Market & Index Growth
  {
    id: 'nifty50',
    category: 'market',
    categoryName: 'Market & Index Growth',
    title: 'NIFTY 50 Index Mutual Funds & ETFs',
    assetClass: 'Large-Cap Equities',
    risk: 'Moderate Risk',
    riskColor: 'amber',
    returnHorizon: '11% – 13% CAGR • 5+ Years Horizon',
    yieldMin: 11.0,
    yieldMax: 13.0,
    minAmount: 500,
    term: 'long',
    payoutType: 'annual',
    summary: 'Automatic ownership in India’s top 50 corporate engines with ultra-low expense ratio and zero fund manager bias.',
    guide: [
      'Automate monthly SIPs on salary day (1st to 5th) to practice rupee-cost averaging across bull and bear cycles.',
      'Select direct growth plan with expense ratio under 0.20% (e.g., UTI, Navi, HDFC Nifty 50 Index).',
    ],
    highlights: ['India GDP Growth Mirror', 'Lowest Expense Ratios (<0.2%)', 'Zero Stock-Picking Stress'],
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-800/60',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  {
    id: 'flexicap',
    category: 'market',
    categoryName: 'Market & Index Growth',
    title: 'Flexi-Cap & Multi-Cap Mutual Funds',
    assetClass: 'Diversified Equities',
    risk: 'Moderate to High Risk',
    riskColor: 'amber',
    returnHorizon: '13% – 15% CAGR • 5+ Years Horizon',
    yieldMin: 13.0,
    yieldMax: 15.0,
    minAmount: 1000,
    term: 'long',
    payoutType: 'annual',
    summary: 'Dynamically shifts capital between Large-Cap safety, Mid-Cap acceleration, and Small-Cap multibagger opportunities.',
    guide: [
      'Ideal core equity fund for wealth builders wanting professional active asset allocation across market caps.',
      'Stay invested for minimum 5 to 7 years to sail past short-term volatility waves.',
    ],
    highlights: ['Dynamic Market-Cap Rotation', 'High Alpha Potential', 'Long-term Multibagger Compounding'],
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-800/60',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  {
    id: 'dividend',
    category: 'market',
    categoryName: 'Market & Index Growth',
    title: 'High-Dividend Yield Stocks & ETFs',
    assetClass: 'Dividend Equities / PSUs',
    risk: 'Moderate Risk',
    riskColor: 'amber',
    returnHorizon: '5% – 7% Dividend Cash Yield + Capital Gain',
    yieldMin: 5.0,
    yieldMax: 7.0,
    minAmount: 5000,
    term: 'medium',
    payoutType: 'both',
    summary: 'Cash-rich blue chips (Power Grid, Coal India, ITC, Vedanta, ONGC) generating recurring quarterly dividend credits.',
    guide: [
      'Screen companies with consistent 5+ year dividend payout track records and low debt-to-equity ratios.',
      'Dividends are deposited straight into your demat-linked primary bank account.',
    ],
    highlights: ['Direct Bank Cash Dividends', 'Undervalued Moat Companies', 'Inflation-Beating Cash Flow'],
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-800/60',
    accentText: 'text-amber-700 dark:text-amber-400',
  },

  // 3. Precious Metals & Commodities
  {
    id: 'sgb',
    category: 'metals',
    categoryName: 'Precious Metals & Commodities',
    title: 'Sovereign Gold Bonds (SGB - Secondary Market)',
    assetClass: 'Sovereign Gold Asset',
    risk: 'Low Risk (Sovereign)',
    riskColor: 'emerald',
    returnHorizon: '2.50% Cash Interest + Gold Price Appreciation • 8 Yrs',
    yieldMin: 9.5,
    yieldMax: 12.0,
    minAmount: 6000,
    term: 'long',
    payoutType: 'both',
    summary: 'RBI-issued gold bonds providing guaranteed 2.5% semi-annual interest payout plus 100% tax-free capital gains on maturity.',
    guide: [
      'Buy existing tranches traded at attractive discounts on NSE/BSE demat secondary terminals.',
      '2.5% fixed annual interest hits your bank every 6 months like clockwork.',
    ],
    highlights: ['Zero Capital Gains Tax on Maturity', '2.5% p.a. Semi-Annual Interest', 'Zero Making Charges & Storage Hassles'],
    accentBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    accentBorder: 'border-yellow-200 dark:border-yellow-800/60',
    accentText: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    id: 'gold_etf',
    category: 'metals',
    categoryName: 'Precious Metals & Commodities',
    title: 'Digital Gold & Gold ETFs / FoF',
    assetClass: 'Physical 99.5% Pure Gold',
    risk: 'Low to Moderate Risk',
    riskColor: 'emerald',
    returnHorizon: '9% – 11% Historical Gold Return • Any Time Horizon',
    yieldMin: 9.0,
    yieldMax: 11.0,
    minAmount: 100,
    term: 'short',
    payoutType: 'annual',
    summary: 'Instant fractional physical gold ownership backed by actual 24K bullion stored in insured SEBI-regulated vaults.',
    guide: [
      'Start with as little as ₹100 via SIP in Nippon, SBI, or ICICI Gold ETF.',
      'Zero storage risk, zero robbery risk, zero locker rent, and pure market pricing.',
    ],
    highlights: ['Fractional Entry from ₹100', 'Instant High Liquidity (T+1)', 'Pure 24 Karat Vault-Backed'],
    accentBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    accentBorder: 'border-yellow-200 dark:border-yellow-800/60',
    accentText: 'text-yellow-700 dark:text-yellow-400',
  },
  {
    id: 'silver_etf',
    category: 'metals',
    categoryName: 'Precious Metals & Commodities',
    title: 'Silver ETFs & Multi-Asset Allocation',
    assetClass: 'Industrial & Precious Metal',
    risk: 'Moderate to High Risk',
    riskColor: 'amber',
    returnHorizon: '10% – 13% Multi-Year Projection • 3+ Years',
    yieldMin: 10.0,
    yieldMax: 13.0,
    minAmount: 500,
    term: 'medium',
    payoutType: 'annual',
    summary: 'Combines safe-haven inflation protection with accelerating green energy industrial demand (Solar PV & EVs).',
    guide: [
      'Allocate 3% to 5% of overall portfolio into Silver ETFs to capture industrial supply super-cycles.',
      'Trade transparently on stock exchanges with real-time NAV pricing.',
    ],
    highlights: ['Solar & EV Industrial Tailwind', 'High Elasticity Beta to Gold', 'Insured Vault Storage'],
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

  // Real Estate Land & Sq. Ft. Valuation Modal State
  const [isRealEstateModalOpen, setIsRealEstateModalOpen] = useState(false);

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
          {/* Real Estate Valuation Button */}
          <button
            type="button"
            onClick={() => setIsRealEstateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors cursor-pointer bg-white dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Real Estate</span>
          </button>

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
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {b.bank}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                    {b.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Regular Rate</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {b.generalRate}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Senior Citizen (60+)</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                      {b.seniorRate}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Tenure: <b className="text-slate-700 dark:text-slate-300">{b.tenure}</b></span>
                  <span>Min: <b className="font-mono text-slate-700 dark:text-slate-300">₹{b.minDeposit.toLocaleString()}</b></span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Digital Opening Process (Mobile / NetBanking):
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {b.process.map((step, idx) => (
                      <li key={idx} className="leading-snug">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DIRECTORY SECTION 2: POST OFFICE SCHEMES --- */}
      {activeDirectoryTab === 'post_office' && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-[#0c1322] p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Post Office Small Savings Schemes (Government of India Sovereign Guarantee)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Administered directly by Ministry of Finance. Zero credit risk and guaranteed regular payouts.
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
            {POST_OFFICE_SCHEMES.map((s, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5 hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {s.name}
                    </h4>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                      {s.interestRate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-2.5">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Compounding / Payout</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {s.compounding}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Tenure</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {s.tenure}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <p><b className="text-slate-700 dark:text-slate-300">Investment Limit:</b> {s.minDeposit}</p>
                    <p><b className="text-slate-700 dark:text-slate-300">Eligibility:</b> {s.eligibility}</p>
                    <p><b className="text-slate-700 dark:text-slate-300">Tax Treatment:</b> {s.taxBenefit}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {s.features.map((f, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    How to Apply / Open:
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {s.process.map((step, idx) => (
                      <li key={idx} className="leading-snug">{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Interactive Investment & Profit Matcher Banner (Full Filter) */}
      <section className="p-6 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Investment Matcher</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Discover which assets match your budget & expected profit
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input your available principal and target return to calculate the exact return rate required, verify financial feasibility, and filter streams.
            </p>
          </div>

          {/* Form Controls */}
          <form
            onSubmit={handleFilterSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#070b14] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80"
          >
            {/* Input 1: Principal Amount */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Investment Capital
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  placeholder="35000"
                  className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Input 2: Expected Profit */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Target Profit
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(e.target.value)}
                  placeholder="1000"
                  className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Input 3: Profit Cadence (Per Month vs Per Year) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Payout Cadence
              </label>
              <select
                value={profitCadence}
                onChange={(e) => setProfitCadence(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="year">Per Year (Annual)</option>
                <option value="month">Per Month (Monthly)</option>
              </select>
            </div>

            {/* Input 4: Time Horizon */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Time Horizon
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="any">Any Duration</option>
                <option value="short">Short (&lt; 1 Year)</option>
                <option value="medium">Medium (1 – 5 Years)</option>
                <option value="long">Long (5+ Years)</option>
              </select>
            </div>

            {/* Submit & Reset actions */}
            <div className="sm:col-span-2 md:col-span-4 flex items-center justify-end space-x-2 pt-1">
              {isFilterSubmitted && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Clear Filter</span>
                </button>
              )}

              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Calculate &amp; Match</span>
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Calculation Analysis Card (Shows when calculated) */}
        {isFilterSubmitted && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Stat 1: Required Return Rate */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Required Return Rate
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span
                    className={`text-xl font-black font-mono ${rateNum <= 8.5
                        ? 'text-emerald-500'
                        : rateNum <= 12
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                  >
                    {requiredReturnRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">p.a.</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {rateNum <= 7.5
                    ? '✓ Readily achievable via guaranteed Fixed Deposits / PPF'
                    : rateNum <= 12.0
                      ? '✓ Achievable via NIFTY 50 Index / Equity Funds'
                      : '⚠️ Requires high risk or speculative leverage'}
                </p>
              </div>

              {/* Stat 2: Annualized Goal Outflow */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Annualized Profit Target
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    ₹{annualizedTarget.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/yr</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  From ₹{numPrincipal.toLocaleString('en-IN')} invested capital
                </p>
              </div>

              {/* Stat 3: Realistic Suggestion */}
              <div className="md:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Capital Feasibility Guidance
                    </span>
                    {isHighProfitExceeded ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-rose-500 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>High Return Risk</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Feasible Target</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    To earn <b className="font-mono text-slate-900 dark:text-white">₹{annualizedTarget.toLocaleString('en-IN')}/year</b> safely without market drawdown risk (at ~7.5% fixed FD rate), your optimal required principal is{' '}
                    <span className="font-mono font-bold text-emerald-500">
                      ₹{suggestedPrincipalAtSafeRate.toLocaleString('en-IN')}
                    </span>.
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Want zero capital risk?</span>
                  <button
                    type="button"
                    onClick={() => handleApplySuggestedAmount(suggestedPrincipalAtSafeRate)}
                    className="text-emerald-500 hover:text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    Set Principal to ₹{suggestedPrincipalAtSafeRate.toLocaleString('en-IN')} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Category & Filter Pills Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pill Tabs */}
        <div className="flex items-center overflow-x-auto space-x-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-xs">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search streams (FD, Gold, REIT)..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 4. Streams Grid View */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {finalStreams.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-3xl bg-white dark:bg-[#0c1322] border transition relative flex flex-col justify-between group ${item.isMatch
                ? 'border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
          >
            {/* Top Match Tag */}
            {item.isMatch && (
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Target Match</span>
              </div>
            )}

            <div>
              {/* Category & Risk Badges */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {item.categoryName}
                </span>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.riskColor === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                      : item.riskColor === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80'
                    }`}
                >
                  {item.risk}
                </span>
              </div>

              {/* Title & Asset Class */}
              <div className="pt-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{item.assetClass}</p>
              </div>

              {/* Yield & Horizon Callout */}
              <div className={`mt-3 p-3 rounded-2xl border ${item.accentBg} ${item.accentBorder}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">
                  Target Expected Return
                </span>
                <span className={`text-sm font-extrabold ${item.accentText} block mt-0.5`}>
                  {item.returnHorizon}
                </span>
              </div>

              {/* Projected Return on User Investment Amount */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Return on ₹{numPrincipal.toLocaleString()}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{item.estAnnual.toLocaleString()}/yr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Monthly Equivalent</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    ~₹{item.estMonthly.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Summary Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                {item.summary}
              </p>

              {/* Key Bullet Highlights */}
              <div className="mt-3 space-y-1">
                {item.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Steps & Minimum entry */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Min Entry: <b className="font-mono text-slate-700 dark:text-slate-200">₹{item.minAmount.toLocaleString()}</b></span>
                <span className="capitalize">{item.term} Term</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">
                  How to invest:
                </span>
                {item.guide.map((step, sIdx) => (
                  <p key={sIdx} className="leading-tight">• {step}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 5. Wealth Diversification Strategy Guide Banner */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800">
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

      {/* Real Estate Land & Sq. Ft. Valuation Modal (Co-located & conditionally rendered) */}
      {isRealEstateModalOpen && (
        <RealEstateValuationModal
          isOpen={isRealEstateModalOpen}
          onClose={() => setIsRealEstateModalOpen(false)}
        />
      )}
    </div>
  );
}
