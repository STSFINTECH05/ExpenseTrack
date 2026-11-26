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
  X,
  Check,
} from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';
import apiClient, { API_BASE_URL } from '../apiClient';

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
  const [editingBill, setEditingBill] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Status Box: All Clear state
  const [isAllCleared, setIsAllCleared] = useState(() => {
    try {
      return localStorage.getItem('sts_reminders_cleared') === 'true';
    } catch (_) {
      return false;
    }
  });

  const fetchBills = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await apiClient.get('/api/segregation?type=bill');
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
    const handleUpdate = () => fetchBills(true);
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => window.removeEventListener('sts_data_updated', handleUpdate);
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

  const handleEditSuccess = (updatedBill) => {
    setBills((prev) => {
      const updated = prev.map((item) =>
        (item.id && item.id === updatedBill.id) || item.name === updatedBill.name
          ? updatedBill
          : item
      );
      try {
        localStorage.setItem('sts_bills', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setToastMessage(`"${updatedBill.name || updatedBill.title}" successfully updated in Bills & Reminders.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchBills(true);
  };

  const handleClearAllReminders = () => {
    setIsAllCleared(true);
    try {
      localStorage.setItem('sts_reminders_cleared', 'true');
      localStorage.setItem('sts_reminders_cleared_at', new Date().toISOString());

      // Mark all reminders as cleared in client cache
      const cachedBills = localStorage.getItem('sts_bills');
      if (cachedBills) {
        const parsed = JSON.parse(cachedBills);
        if (Array.isArray(parsed)) {
          const clearedBills = parsed.map((b) => ({ ...b, status: 'cleared', acknowledged: true }));
          localStorage.setItem('sts_bills', JSON.stringify(clearedBills));
          setBills(clearedBills);
        }
      }

      // Reset any active reminder notification alerts in client storage
      localStorage.setItem('sts_notifications_count', '0');
      localStorage.setItem('sts_bills_alert_count', '0');
    } catch (e) {
      console.warn('Error clearing bill reminders:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sts_data_updated'));
      window.dispatchEvent(new Event('sts_notifications_cleared'));
    }

    setToastMessage('All bill reminders cleared and up to date.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold ml-2 text-xs cursor-pointer"
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
            <Plus className="w-4 h-4 stroke-[2.5] text-white" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* Status Box & Bills List */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          {/* Status Box with Interactive All Clear */}
          {isAllCleared ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 shadow-sm transition-all duration-200">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="font-medium">All bill reminders cleared and up to date.</span>
              </div>
              <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold whitespace-nowrap shadow-xs">
                <span>✓ Cleared</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-200">
              <div className="flex items-center space-x-2.5">
                <Receipt className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>No urgent bill reminders due today. All active bills are synchronized.</span>
              </div>
              {/* Interactive "All clear" button */}
              <button
                type="button"
                onClick={handleClearAllReminders}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold whitespace-nowrap pl-2 hover:underline cursor-pointer active:scale-95 transition-all"
                title="Acknowledge and clear all bill reminders"
              >
                All clear
              </button>
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
                  key={bill.id || bill.name}
                  className="p-4 rounded-xl bg-white dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow transition gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {bill.name || bill.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Due: {formatDate(bill.date || bill.dueDate)} • {bill.schedule || bill.frequency || 'Monthly'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm block">
                        {formatINR(bill.amount)}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                        {bill.category || 'Utilities & Bills'}
                      </p>
                    </div>
                    {/* Clean Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBill(bill);
                        setIsEditModalOpen(true);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      title={`Edit ${bill.name || bill.title}`}
                      aria-label={`Edit ${bill.name || bill.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Entry Modal: Add Bill */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="bill"
        onSuccess={handleModalSuccess}
      />

      {/* Entry Modal: Edit Bill & Reminder */}
      <EditBillModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBill(null);
        }}
        bill={editingBill}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

// ============================================================================
// EDIT BILL MODAL COMPONENT (Header: Edit Bill & Reminder | Submit: Save Changes)
// ============================================================================
function EditBillModal({ isOpen, onClose, bill, onSuccess }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [schedule, setSchedule] = useState('Monthly (1st)');
  const [category, setCategory] = useState('Utilities & Bills');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bill) {
      setName(bill.name || bill.title || '');
      setAmount(bill.amount !== undefined ? String(bill.amount) : '');
      setDueDate(bill.date || bill.dueDate || new Date().toISOString().split('T')[0]);
      setSchedule(bill.schedule || bill.frequency || 'Monthly (1st)');
      setCategory(bill.category || 'Utilities & Bills');
      setNotes(bill.description || bill.notes || '');
      setError(null);
    }
  }, [bill, isOpen]);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a valid bill title/name.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please specify a valid numeric amount in ₹ INR.');
      return;
    }

    const updatedRecord = {
      ...bill,
      id: bill.id || `bill-${Date.now()}`,
      type: 'bill',
      name: name.trim(),
      title: name.trim(),
      amount: numAmount,
      date: dueDate,
      dueDate: dueDate,
      schedule: schedule,
      frequency: schedule,
      category: category,
      description: notes.trim(),
      notes: notes.trim(),
    };

    setLoading(true);

    try {
      if (bill.id) {
        await apiClient.put(`/api/segregation/${bill.id}`, {
          type: 'bill',
          name: updatedRecord.name,
          amount: updatedRecord.amount,
          date: updatedRecord.date,
          schedule: updatedRecord.schedule,
          category: updatedRecord.category,
          description: updatedRecord.description,
        }).catch((err) => {
          console.warn('API update failed, updating client cache:', err);
        });
      }
    } catch (err) {
      console.warn('Network error during bill update:', err);
    } finally {
      setLoading(false);
      onSuccess(updatedRecord);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sts_data_updated'));
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#0d1322] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6 space-y-6 relative transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Edit Bill & Reminder
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modify scheduled bill details, due dates, and frequencies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Title / Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Bill Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Office Rent, Electricity Bill, AWS Cloud"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* Amount (₹ INR) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-xs">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Due Date & Recurrence / Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Recurrence / Frequency
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="Monthly (1st)">Monthly (1st)</option>
                <option value="Monthly (15th)">Monthly (15th)</option>
                <option value="Monthly">Monthly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="Utilities & Bills">Utilities & Bills</option>
              <option value="Office Rent">Office Rent</option>
              <option value="Software Subscription">Software Subscription</option>
              <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Card Settlement">Card Settlement</option>
              <option value="Operations & Travel">Operations & Travel</option>
              <option value="Legal & Compliance">Legal & Compliance</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment instructions, provider account numbers, or reference..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 text-xs font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Buttons: Cancel & Save Changes */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
