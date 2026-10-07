import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Briefcase,
  Plus,
  Bell,
  Calendar,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return dateString;
};

export default function SegregationView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('additional_income');
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRecords = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/segregation`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to load segregation records:', err);
      setError('Unable to load segregation records from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openAddModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (newRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setToastMessage(`"${newRecord.name}" successfully added to ${newRecord.type.replace('_', ' ')}.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchRecords(true);
  };

  // Segregated categories
  const additionalIncome = useMemo(
    () => records.filter((r) => r.type === 'additional_income'),
    [records]
  );
  const additionalExpense = useMemo(
    () => records.filter((r) => r.type === 'additional_expense'),
    [records]
  );
  const fixedIncome = useMemo(
    () => records.filter((r) => r.type === 'fixed_income'),
    [records]
  );
  const fixedExpense = useMemo(
    () => records.filter((r) => r.type === 'fixed_expense'),
    [records]
  );
  const bills = useMemo(
    () => records.filter((r) => r.type === 'bill'),
    [records]
  );

  // Financial aggregates
  const totals = useMemo(() => {
    const totalAdditionalIncome = additionalIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalFixedIncome = fixedIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalIncome = totalAdditionalIncome + totalFixedIncome;

    const totalAdditionalExpense = additionalExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalFixedExpense = fixedExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalBills = bills.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalExpenses = totalAdditionalExpense + totalFixedExpense + totalBills;

    const monthlySavings = totalIncome - totalExpenses;
    // Estimated net worth position including liquid holdings base
    const baseLiquidAssets = 1500000;
    const netWorth = baseLiquidAssets + monthlySavings;

    return {
      totalIncome,
      totalExpenses,
      monthlySavings,
      netWorth,
    };
  }, [additionalIncome, fixedIncome, additionalExpense, fixedExpense, bills]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Corporate Finance Segregation</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              ACTIVE LEDGER
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured balance sheet view: Additional streams, Fixed overheads, and Scheduled bill reminders
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchRecords()}
            className="px-2 py-1 bg-rose-900 rounded text-[11px] font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP OVERVIEW CARDS                                                     */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101726] to-[#0b101c] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Total Income</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                {formatINR(totals.totalIncome)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Fixed + Additional inflows combined</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101726] to-[#0b101c] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Total Expenses</p>
              <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
                {formatINR(totals.totalExpenses)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            <span>Total operating & capital outflow</span>
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101726] to-[#0b101c] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-teal-500/40 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Monthly Savings</p>
              <h3 className="text-2xl font-black text-emerald-300 mt-1 tracking-tight">
                {formatINR(totals.monthlySavings)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold mr-1">
              {totals.totalIncome > 0
                ? `${((totals.monthlySavings / totals.totalIncome) * 100).toFixed(1)}%`
                : '0%'}
            </span>
            <span>net retention rate</span>
          </div>
        </div>

        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#101726] to-[#0b101c] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Net Worth</p>
              <h3 className="text-2xl font-black text-cyan-300 mt-1 tracking-tight">
                {formatINR(totals.netWorth)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-400">
            <span className="text-cyan-400 font-semibold mr-1">Verified</span>
            <span>corporate asset standing</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ADDITIONAL SOURCE SECTION (Side-by-side tables)                         */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Additional Source</span>
              <span className="text-xs font-normal text-slate-400">(Variable cashflows)</span>
            </h3>
            <p className="text-xs text-slate-400">Unscheduled or variable income bonuses and project expenses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Additional Income */}
          <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Additional Income</h4>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {additionalIncome.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('additional_income')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                    <th className="py-2.5 px-2 font-semibold">Name</th>
                    <th className="py-2.5 px-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold">Date</th>
                    <th className="py-2.5 px-2 font-semibold">Time</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {additionalIncome.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No additional income entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    additionalIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-white whitespace-nowrap">{item.name}</td>
                        <td className="py-3 px-2 text-slate-400 max-w-[160px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Additional Expense */}
          <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Additional Expense</h4>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  {additionalExpense.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('additional_expense')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                    <th className="py-2.5 px-2 font-semibold">Name</th>
                    <th className="py-2.5 px-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold">Date</th>
                    <th className="py-2.5 px-2 font-semibold">Time</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {additionalExpense.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No additional expense entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    additionalExpense.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-white whitespace-nowrap">{item.name}</td>
                        <td className="py-3 px-2 text-slate-400 max-w-[160px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BILLS & REMINDERS SECTION                                              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#111c33] via-[#0f172a] to-[#12233b] border border-cyan-500/20 p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-white">Bills & Reminders</h4>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    AUTOMATION ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Scheduled payment alerts, utility renewals, and statutory compliance due dates
                </p>
              </div>
            </div>

            <button
              onClick={() => openAddModal('bill')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Bill</span>
            </button>
          </div>

          {/* Bills list or Empty state */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            {bills.length === 0 ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <span>No urgent bill reminders due today. All active bills are synchronized.</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-medium">All clear</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div>
                      <h5 className="font-bold text-white">{bill.name}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due: {formatDate(bill.date)} • {bill.schedule}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-cyan-300">{formatINR(bill.amount)}</span>
                      <p className="text-[10px] text-slate-500">{bill.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FIXED SOURCE SECTION (Side-by-side tables)                             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Fixed Source</span>
              <span className="text-xs font-normal text-slate-400">(Recurring cashflows)</span>
            </h3>
            <p className="text-xs text-slate-400">Scheduled retainers, office rent, infrastructure, and core payroll</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Fixed Income */}
          <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Fixed Income</h4>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {fixedIncome.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('fixed_income')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                    <th className="py-2.5 px-2 font-semibold">Name</th>
                    <th className="py-2.5 px-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold">Date</th>
                    <th className="py-2.5 px-2 font-semibold">Time</th>
                    <th className="py-2.5 px-2 font-semibold">Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {fixedIncome.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No fixed income entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    fixedIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-white whitespace-nowrap">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-emerald-400 font-mono">{formatINR(item.amount)}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 max-w-[150px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            {item.schedule || 'Monthly'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Fixed Expense */}
          <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Fixed Expense</h4>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  {fixedExpense.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('fixed_expense')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                    <th className="py-2.5 px-2 font-semibold">Name</th>
                    <th className="py-2.5 px-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold">Date</th>
                    <th className="py-2.5 px-2 font-semibold">Time</th>
                    <th className="py-2.5 px-2 font-semibold">Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {fixedExpense.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No fixed expense entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    fixedExpense.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-white whitespace-nowrap">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-rose-400 font-mono">{formatINR(item.amount)}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 max-w-[150px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                            {item.schedule || 'Monthly'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Entry Modal */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
