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
  Pencil,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';
import EditIncomeModal from './EditIncomeModal';
import { getAuthHeaders, API_BASE_URL, getCurrentUser } from '../utils/api';

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
  const [dismissedAlertDate, setDismissedAlertDate] = useState(() => {
    try {
      return localStorage.getItem('sts_bills_alert_dismissed') || null;
    } catch (e) {
      return null;
    }
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const currentUser = getCurrentUser();
  const storageKey = currentUser?.email ? `sts_bills_${currentUser.email}` : 'sts_bills';

  // Overdue / Urgent Bills Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentBills = bills.filter((b) => {
    if (!b.date) return false;
    const isPaid = b.status?.toUpperCase() === 'PAID' || b.is_paid === true || b.isPaid === true;
    if (isPaid) return false;
    const dueDateStr = String(b.date).slice(0, 10);
    return dueDateStr <= todayStr;
  });

  const isAlertDismissed = dismissedAlertDate === todayStr;

  const handleDismissAlert = () => {
    try {
      localStorage.setItem('sts_bills_alert_dismissed', todayStr);
    } catch (e) {}
    setDismissedAlertDate(todayStr);
  };

  const fetchBills = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/segregation?type=bill`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const uniqueEntries = Array.from(new Map(json.data.map((item) => [item.id || item.name, item])).values());
        setBills(uniqueEntries);
        try {
          localStorage.setItem(storageKey, JSON.stringify(uniqueEntries));
        } catch (e) {}
      } else if (Array.isArray(json)) {
        const billItems = json.filter((r) => r.type === 'bill');
        const uniqueEntries = Array.from(new Map(billItems.map((item) => [item.id || item.name, item])).values());
        setBills(uniqueEntries);
        try {
          localStorage.setItem(storageKey, JSON.stringify(uniqueEntries));
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
  }, [storageKey]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleModalSuccess = (newRecord) => {
    setBills((prev) => {
      const combined = [newRecord, ...prev];
      const unique = Array.from(new Map(combined.map((item) => [item.id || item.name, item])).values());
      try {
        localStorage.setItem(storageKey, JSON.stringify(unique));
      } catch (e) {}
      return unique;
    });
    setToastMessage(`"${newRecord.name}" successfully added to Bills & Reminders.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchBills(true);
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updated) => {
    setBills((prev) => {
      const next = prev.map((b) => (b.id === updated.id ? updated : b));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setToastMessage(`"${updated.name}" successfully updated.`);
    setTimeout(() => setToastMessage(null), 4000);
    setIsEditModalOpen(false);
    setEditingBill(null);
  };

  const handleDeleteBill = async (bill) => {
    if (!window.confirm(`Are you sure you want to delete bill "${bill.name}"?`)) return;

    setBills((prev) => {
      const next = prev.filter((b) => b.id !== bill.id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setToastMessage(`"${bill.name}" successfully removed.`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await fetch(`${API_BASE_URL}/api/segregation/${bill.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.warn('API error deleting bill record:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 text-xs"
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
            {/* Bell icon in a rounded container with crimson red alert theme */}
            <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex-shrink-0">
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Bills & Reminders
                </h2>
                {/* Badge: AUTOMATION ACTIVE in vibrant Emerald */}
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 tracking-wider">
                  AUTOMATION ACTIVE
                </span>
                {refreshing && (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin ml-1" />
                )}
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Scheduled payment alerts, utility renewals, and statutory compliance due dates
              </p>
            </div>
          </div>

          {/* Action Button: + Add Bill (Solid vibrant green) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* Status Box & Bills List */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          {/* Status Box */}
          {urgentBills.length > 0 && !isAlertDismissed ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs sm:text-sm text-rose-800 dark:text-rose-200 shadow-sm animate-fadeIn">
              <div className="flex items-center space-x-2.5 min-w-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="font-medium truncate">
                  You have <strong className="font-bold">{urgentBills.length}</strong> overdue or urgent bill{urgentBills.length > 1 ? 's' : ''} requiring action.
                </span>
              </div>
              <div className="flex items-center space-x-2 pl-3 flex-shrink-0">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 cursor-default">
                  Action Required
                </span>
                <button
                  type="button"
                  onClick={handleDismissAlert}
                  className="p-1 rounded-md text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-100 hover:bg-rose-200/50 dark:hover:bg-rose-900/50 transition cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <Receipt className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>
                  {urgentBills.length > 0
                    ? `Active bills synchronized (${urgentBills.length} alert${urgentBills.length > 1 ? 's' : ''} reviewed).`
                    : 'No urgent bill reminders due today. All active bills are synchronized.'}
                </span>
              </div>
              {/* Right side static pill badge: "All clear" */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default select-none whitespace-nowrap pl-2">
                All clear
              </span>
            </div>
          )}

          {/* Bills List / Grid */}
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
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
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                        {formatINR(bill.amount)}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{bill.category}</p>
                    </div>
                    <div className="flex items-center space-x-1 pl-1 border-l border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleEditBill(bill)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                        title={`Edit ${bill.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBill(bill)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title={`Delete ${bill.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <Receipt className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No scheduled bills yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You have no upcoming bills or reminders scheduled. Add your first bill to start tracking upcoming dues and payment automation.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Bill</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entry Modal */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="bill"
        onSuccess={handleModalSuccess}
      />

      {/* Edit Modal */}
      <EditIncomeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBill(null);
        }}
        entry={editingBill}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
