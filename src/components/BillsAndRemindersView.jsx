import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Receipt,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Wallet,
} from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Currency Formatter for Indian Rupees (₹)
const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
};

// Date Formatter
const formatDate = (dateString) => {
  if (!dateString) return 'Pending Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export default function BillsAndRemindersView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBills = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/segregation?type=bill`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const uniqueEntries = Array.from(new Map(json.data.map((item) => [item.id || item.name, item])).values());
        setBills(uniqueEntries);
        try {
          localStorage.setItem('sts_bills', JSON.stringify(uniqueEntries));
        } catch (e) {}
      } else if (Array.isArray(json)) {
        const billItems = json.filter((r) => r.type === 'bill');
        const uniqueEntries = Array.from(new Map(billItems.map((item) => [item.id || item.name, item])).values());
        setBills(uniqueEntries);
        try {
          localStorage.setItem('sts_bills', JSON.stringify(uniqueEntries));
        } catch (e) {}
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
      setError('Unable to load bills from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleModalSuccess = (newRecord) => {
    setBills((prev) => {
      const combined = [newRecord, ...prev];
      const unique = Array.from(new Map(combined.map((item) => [item.id || item.name, item])).values());
      try {
        localStorage.setItem('sts_bills', JSON.stringify(unique));
      } catch (e) {}
      return unique;
    });
    setToastMessage(`"${newRecord.name}" successfully added to Bills & Reminders.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchBills(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-cyan-600 hover:text-cyan-800 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Card Container */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm relative overflow-hidden transition-colors">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            {/* Bell icon in a rounded container */}
            <div className="p-3.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 flex-shrink-0">
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Bills & Reminders
                </h2>
                {/* Badge: AUTOMATION ACTIVE */}
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 tracking-wider">
                  AUTOMATION ACTIVE
                </span>
                {refreshing && (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin ml-1" />
                )}
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Scheduled payment alerts, utility renewals, and statutory compliance due dates
              </p>
            </div>
          </div>

          {/* Action Button: + Add Bill (single + only) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-cyan-600/20 self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* Status Box & Bills List */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          {/* Status Box */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Receipt className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <span>No urgent bill reminders due today. All active bills are synchronized.</span>
            </div>
            {/* Right side link/tag: "All clear" */}
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap pl-2">
              All clear
            </span>
          </div>

          {/* Bills List / Grid */}
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-600 dark:text-cyan-400 mb-2" />
              <span>Checking scheduled bills & automation status...</span>
            </div>
          ) : bills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow transition"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{bill.name}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Due: {formatDate(bill.date)} • {bill.schedule}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 text-sm">
                      {formatINR(bill.amount)}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{bill.category}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Entry Modal */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="bill"
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
