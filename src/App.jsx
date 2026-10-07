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
  Menu,
  X,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import SegregationView from './components/SegregationView';
import SplitAndCollectPlaceholder from './components/SplitAndCollectPlaceholder';

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
  // Navigation State: 'segregation' is active by default
  const [activeTab, setActiveTab] = useState('segregation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Payments State (for Direct Payments view)
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

      await fetchPayments(true);

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
      {/* Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0d1322]/90 backdrop-blur-xl border-b border-slate-800 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/20">
                <div className="h-full w-full bg-[#0d1322] rounded-[9px] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  STS FINTECH - Expense & Payment Tracking
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  STS FINTECH PRIVATE LIMITED • CLIKS Enterprise Ledger
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline text-slate-300 font-medium">
                {backendHealth?.status === 'healthy' ? 'Core Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            backendHealth={backendHealth}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 bg-[#0d1322] h-full shadow-2xl">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                backendHealth={backendHealth}
              />
            </div>
          </div>
        )}

        {/* Primary Main View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* TAB 1: SEGREGATION (Active Default) */}
          {activeTab === 'segregation' && <SegregationView />}

          {/* TAB 2: SPLIT & COLLECT (Placeholder) */}
          {activeTab === 'split_collect' && <SplitAndCollectPlaceholder />}

          {/* TAB 3: DIRECT PAYMENTS (Preserved feature) */}
          {activeTab === 'payments' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Direct Outflow & Payment Processing</h2>
                  <p className="text-xs text-slate-400">Direct vendor payouts, compliance settlement, and payment dispatch</p>
                </div>
                <button
                  onClick={() => fetchPayments(true)}
                  disabled={refreshing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync Payments</span>
                </button>
              </div>

              {/* Metric Cards Row */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl">
                  <p className="text-xs font-medium uppercase text-slate-400">Total Outflow</p>
                  <h3 className="text-2xl font-black text-white mt-1">{formatINR(stats.totalAmount)}</h3>
                  <p className="text-xs text-slate-400 mt-3 font-semibold text-emerald-400">
                    {stats.totalCount} transactions
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl">
                  <p className="text-xs font-medium uppercase text-slate-400">Settled (Completed)</p>
                  <h3 className="text-2xl font-black text-white mt-1">{formatINR(stats.completedAmount)}</h3>
                  <p className="text-xs text-slate-400 mt-3 font-semibold text-emerald-400">
                    {stats.completedCount} payments
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl">
                  <p className="text-xs font-medium uppercase text-slate-400">In Pipeline (Pending)</p>
                  <h3 className="text-2xl font-black text-white mt-1">{formatINR(stats.pendingAmount)}</h3>
                  <p className="text-xs text-slate-400 mt-3 font-semibold text-amber-400">
                    {stats.pendingCount} awaiting
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0e1626] border border-slate-800 p-5 shadow-xl">
                  <p className="text-xs font-medium uppercase text-slate-400">Average Ticket</p>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {formatINR(stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-3 text-cyan-400">Real-time mean</p>
                </div>
              </section>

              {/* Form & Real-time transactions list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <section className="lg:col-span-5 bg-[#111827]/90 rounded-2xl border border-slate-800 p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Record New Payment</h2>
                        <p className="text-xs text-slate-400">Direct vendor payment entry</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">INR (₹)</span>
                  </div>

                  {formSuccess && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
                      {formSuccess}
                    </div>
                  )}

                  {formError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Payment Title / Description
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. AWS Cloud Services"
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {presetTitles.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setTitle(preset)}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 hover:text-white"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                        Amount in INR (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['completed', 'pending', 'processing'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            className={`py-2 rounded-xl text-xs font-semibold capitalize border ${
                              status === s
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Recording...' : 'Authorize Payment'}
                    </button>
                  </form>
                </section>

                <section className="lg:col-span-7 bg-[#111827]/90 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">Direct Payment Records</h3>
                    <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg text-xs">
                      {['all', 'completed', 'pending'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStatusFilter(tab)}
                          className={`px-2.5 py-1 rounded capitalize ${
                            statusFilter === tab ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto">
                    {filteredPayments.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-[#0d1322] border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(item.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-mono text-emerald-400">{formatINR(item.amount)}</p>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-[#070b14] py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>STS FINTECH PRIVATE LIMITED • Financial Segregation Platform</span>
        <span className="font-mono text-[11px] text-slate-600">Core API: {API_BASE_URL}</span>
      </footer>
    </div>
  );
}
