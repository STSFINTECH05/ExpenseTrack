import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  IndianRupee,
  ShieldCheck,
  Server,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Currency Formatter for Indian Rupees (₹)
const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

// Date Formatter
const formatDate = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export default function App() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('completed');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check Backend Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendHealth(data);
      } else {
        setBackendHealth({ status: 'offline', error: 'HTTP error' });
      }
    } catch (err) {
      setBackendHealth({ status: 'offline', error: err.message });
    }
  }, []);

  // Fetch Payments from Backend
  const fetchPayments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPayments(json.data);
      } else if (Array.isArray(json)) {
        setPayments(json);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError(err.message || 'Unable to connect to payment server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPayments, checkHealth]);

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Payment title cannot be empty.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: cleanTitle,
        amount: numericAmount,
        status,
      };

      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (data.errors && data.errors.join(', ')) || 'Failed to submit payment');
      }

      setFormSuccess(`Payment of ${formatINR(numericAmount)} successfully recorded!`);
      setTitle('');
      setAmount('');
      setStatus('completed');

      // Refresh payments list
      await fetchPayments(true);

      // Auto dismiss success notice after 5 seconds
      setTimeout(() => {
        setFormSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Submit payment error:', err);
      setFormError(err.message || 'Error occurred while saving transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCount = payments.length;
    const totalAmount = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const completedList = payments.filter((p) => (p.status || '').toLowerCase() === 'completed');
    const completedAmount = completedList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const pendingList = payments.filter((p) => (p.status || '').toLowerCase() === 'pending');
    const pendingAmount = pendingList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      totalCount,
      totalAmount,
      completedCount: completedList.length,
      completedAmount,
      pendingCount: pendingList.length,
      pendingAmount,
    };
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).includes(searchQuery);
      const matchesStatus =
        statusFilter === 'all' ||
        (p.status || '').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const presetTitles = [
    'Cloud Infrastructure (AWS/Render)',
    'Payment Gateway Fees',
    'PCI-DSS Compliance Audit',
    'Fintech Core Engine API',
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Ambient Glow Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0d1322]/80 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-[#0d1322] rounded-[10px] flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  STS FINTECH - Expense & Payment Tracking
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                <span>STS FINTECH PRIVATE LIMITED</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">FINANCIAL CORE V1.0</span>
              </p>
            </div>
          </div>

          {/* Backend Status Badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Backend:</span>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendHealth?.status === 'healthy'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`font-medium ${
                    backendHealth?.status === 'healthy'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {backendHealth?.status === 'healthy' ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            <button
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700 hover:border-slate-600 active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Metric Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Payments Volume */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Outflow</p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  {formatINR(stats.totalAmount)}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 flex items-center mr-1.5">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {stats.totalCount}
              </span>
              <span>total transactions recorded</span>
            </div>
          </div>

          {/* Completed Payments */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Settled (Completed)</p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  {formatINR(stats.completedAmount)}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="font-semibold text-emerald-400 mr-1.5">
                {stats.completedCount} Payments
              </span>
              <span>settled successfully</span>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">In Pipeline (Pending)</p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  {formatINR(stats.pendingAmount)}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="font-semibold text-amber-400 mr-1.5">
                {stats.pendingCount} Payments
              </span>
              <span>awaiting clearance</span>
            </div>
          </div>

          {/* Average Size */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Average Ticket</p>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                  {formatINR(stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0)}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold mr-1.5">Real-time</span>
              <span>mean per payment</span>
            </div>
          </div>
        </section>

        {/* Two-Column Grid: Form + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Payment Capture Form */}
          <section className="lg:col-span-5 bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Record New Payment</h2>
                  <p className="text-xs text-slate-400">Dispatch payment entry to PostgreSQL core</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                INR (₹)
              </span>
            </div>

            {/* Status Notifications */}
            {formSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-start space-x-3 text-emerald-300 text-xs animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Payment Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AWS Cloud Services, Vendor Invoice #34"
                  className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner"
                />

                {/* Quick Suggestion Pills */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 flex items-center mr-1">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5 text-slate-500" /> Presets:
                  </span>
                  {presetTitles.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTitle(preset)}
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-md border border-slate-700/60 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Amount in INR (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="font-bold text-slate-300 text-base">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner font-mono text-base font-semibold"
                  />
                </div>
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <p className="mt-1.5 text-xs text-emerald-400/90 font-medium pl-1">
                    Preview: {formatINR(amount)}
                  </p>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Transaction Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'completed', label: 'Completed', color: 'emerald' },
                    { key: 'pending', label: 'Pending', color: 'amber' },
                    { key: 'processing', label: 'Processing', color: 'cyan' },
                  ].map((s) => {
                    const isSelected = status === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setStatus(s.key)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 mt-4"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm & Authorize Payment</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Right Column: Real-time Transaction List */}
          <section className="lg:col-span-7 bg-[#111827]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
            {/* List Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white">Real-Time Transactions</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                    {filteredPayments.length} entries
                  </span>
                </div>
                <p className="text-xs text-slate-400">Retrieved directly from GET /api/payments</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                {['all', 'completed', 'pending'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-lg font-medium capitalize transition ${
                      statusFilter === tab
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error State Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => fetchPayments()}
                  className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-[11px] font-medium transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 animate-pulse flex items-center justify-between"
                  >
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-48" />
                      <div className="h-3 bg-slate-850 rounded w-28" />
                    </div>
                    <div className="h-6 bg-slate-800 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : filteredPayments.length === 0 ? (
              /* Empty State */
              <div className="py-12 text-center rounded-xl bg-slate-900/30 border border-slate-850 border-dashed">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">No payment transactions found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No records match your active search or filter criteria.'
                    : 'Submit the form on the left to record your first corporate payment.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-3 text-xs text-emerald-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              /* Transaction List Cards */
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredPayments.map((item) => {
                  const normalizedStatus = (item.status || 'completed').toLowerCase();
                  const isCompleted = normalizedStatus === 'completed';
                  const isPending = normalizedStatus === 'pending';
                  const isProcessing = normalizedStatus === 'processing';

                  return (
                    <div
                      key={item.id}
                      className="group p-4 rounded-xl bg-[#0d1322]/90 hover:bg-[#131c31] border border-slate-800/90 hover:border-slate-700 transition flex items-center justify-between gap-4 shadow-sm"
                    >
                      {/* Left: Info */}
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div
                          className={`mt-1 p-2 rounded-lg flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-cyan-500/10 text-cyan-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isPending ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              #{item.id}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge & Amount */}
                      <div className="text-right flex-shrink-0 space-y-1">
                        <div className="text-sm sm:text-base font-bold font-mono tracking-tight text-white group-hover:text-emerald-400 transition">
                          {formatINR(item.amount)}
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                              isCompleted
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {item.status || 'completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="mt-auto border-t border-slate-850 bg-[#070b14] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">STS FINTECH PRIVATE LIMITED</span>
            <span>•</span>
            <span>Enterprise Expense & Payment Tracking</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] text-slate-600">
              API Endpoint: {API_BASE_URL}
            </span>
            <span className="text-emerald-500/80 font-medium flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1" />
              Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
