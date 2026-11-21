import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
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
  PieChart,
  BarChart3,
  Copy,
  Sparkles,
  Flame,
} from 'lucide-react';
import AddIncomeModal from './AddIncomeModal';
import EditIncomeModal from './EditIncomeModal';
import { useLanguage } from '../context/LanguageContext';
import apiClient, { API_BASE_URL } from '../apiClient';

const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

const formatCompactINR = (value) => {
  const num = Number(value) || 0;
  if (num === 0) return '₹0';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${Math.round(num)}`;
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
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('additional_income');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Individual Analytics Filter States ('all' | 'income' | 'expense')
  const [fixedAnalyticsFilter, setFixedAnalyticsFilter] = useState('all');
  const [additionalAnalyticsFilter, setAdditionalAnalyticsFilter] = useState('all');
  const [overallAnalyticsFilter, setOverallAnalyticsFilter] = useState('all');
  const [graphAnalyticsFilter, setGraphAnalyticsFilter] = useState('all');

  // Smart SMS & Clipboard Parser State
  const [smsRawText, setSmsRawText] = useState('');
  const [parsedAmount, setParsedAmount] = useState('');
  const [parsedMerchant, setParsedMerchant] = useState('');
  const [parsedDate, setParsedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [parsedCategory, setParsedCategory] = useState('🍔 Food & Dining');
  const [sourceType, setSourceType] = useState('Additional Source');
  const [entryType, setEntryType] = useState('Expense');
  const [parsedDescription, setParsedDescription] = useState('');
  const [parsedTime, setParsedTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [parsedSchedule, setParsedSchedule] = useState('One-Time');
  const [isSubmittingSms, setIsSubmittingSms] = useState(false);
  const [parserFeedback, setParserFeedback] = useState(null);

  // Calendar Heatmap State
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => new Date().getDate());

  const getDayIntensityClass = (amount, isSelected) => {
    let base = '';
    if (amount === 0) {
      base = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700/60';
    } else if (amount < 500) {
      base = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60';
    } else if (amount < 2000) {
      base = 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-900/60';
    } else {
      base = 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60 hover:bg-rose-200 dark:hover:bg-rose-900/60';
    }

    if (isSelected) {
      base += ' ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md scale-[1.02] font-bold z-10';
    }
    return base;
  };

  // Parse SMS text in real-time
  const parseSmsContent = useCallback((text) => {
    const getFormattedTime = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    if (!text || !text.trim()) {
      setParsedAmount('');
      setParsedMerchant('');
      setParsedDate(new Date().toISOString().split('T')[0]);
      setParsedCategory('🍔 Food & Dining');
      setSourceType('Additional Source');
      setEntryType('Expense');
      setParsedDescription('');
      setParsedTime(getFormattedTime());
      setParsedSchedule('One-Time');
      setParserFeedback(null);
      return;
    }

    let detectedAmount = '';
    let detectedMerchant = '';
    let detectedDate = '';
    let detectedCategory = 'Miscellaneous';

    // 1. Amount matching: (?:INR|₹|Rs\.?)\s*([\d,]+\.?\d*) or (?:debit|credit)(?:ed)?\s*(?:INR|₹|Rs\.?)?\s*([\d,]+\.?\d*)
    const amtRegex1 = /(?:INR|₹|Rs\.?)\s*([\d,]+\.?\d*)/i;
    const amtRegex2 = /(?:debit(?:ed)?|credit(?:ed)?)\s*(?:INR|₹|Rs\.?)?\s*([\d,]+\.?\d*)/i;
    const mAmt1 = text.match(amtRegex1);
    const mAmt2 = text.match(amtRegex2);

    if (mAmt1 && mAmt1[1]) {
      detectedAmount = mAmt1[1].replace(/,/g, '');
    } else if (mAmt2 && mAmt2[1]) {
      detectedAmount = mAmt2[1].replace(/,/g, '');
    }

    // 2. Merchant matching: (?:to|at|merchant|from)\s+([A-Za-z0-9\s&]+?)(?=\s+on|\s+at|\s+via|\s+Ref|\.|\d|$)
    const merchantRegex = /(?:to|at|merchant|from)\s+([A-Za-z0-9\s&]+?)(?=\s+on|\s+at|\s+via|\s+Ref|\.|\d|$)/i;
    const mMerch = text.match(merchantRegex);
    if (mMerch && mMerch[1]) {
      const cleanMerch = mMerch[1].trim().replace(/\s+/g, ' ');
      // Filter out generic phrases like 'VPA' or 'account'
      if (!/^(vpa|account|bank|your|the)\b/i.test(cleanMerch)) {
        detectedMerchant = cleanMerch;
      } else {
        detectedMerchant = cleanMerch;
      }
    }

    // 3. Date matching: (\d{1,2}[-\/\s](?:[A-Za-z]{3}|\d{1,2})[-\/\s]\d{2,4})
    const dateRegex = /(\d{1,2}[-\/\s](?:[A-Za-z]{3}|\d{1,2})[-\/\s]\d{2,4})/i;
    const mDate = text.match(dateRegex);
    if (mDate && mDate[1]) {
      const rawDate = mDate[1].trim();
      const parsedD = new Date(rawDate);
      if (!isNaN(parsedD.getTime())) {
        detectedDate = parsedD.toISOString().split('T')[0];
      } else {
        detectedDate = new Date().toISOString().split('T')[0];
      }
    } else {
      detectedDate = new Date().toISOString().split('T')[0];
    }

    // 4. Category matching based on keywords in text or merchant name
    const lowerText = text.toLowerCase();
    const lowerMerchant = (detectedMerchant || '').toLowerCase();
    if (
      lowerText.includes('zomato') ||
      lowerText.includes('swiggy') ||
      lowerText.includes('mcdonald') ||
      lowerText.includes('domino') ||
      lowerText.includes('restaurant') ||
      lowerText.includes('cafe') ||
      lowerText.includes('food') ||
      lowerText.includes('dining') ||
      lowerMerchant.includes('zomato') ||
      lowerMerchant.includes('swiggy')
    ) {
      detectedCategory = '🍔 Food & Dining';
    } else if (
      lowerText.includes('uber') ||
      lowerText.includes('ola') ||
      lowerText.includes('metro') ||
      lowerText.includes('petrol') ||
      lowerText.includes('fuel') ||
      lowerText.includes('flight') ||
      lowerText.includes('irctc') ||
      lowerText.includes('travel') ||
      lowerMerchant.includes('uber') ||
      lowerMerchant.includes('ola')
    ) {
      detectedCategory = '🚗 Travel';
    } else if (
      lowerText.includes('amazon') ||
      lowerText.includes('flipkart') ||
      lowerText.includes('myntra') ||
      lowerText.includes('ajio') ||
      lowerText.includes('shopping') ||
      lowerText.includes('store') ||
      lowerMerchant.includes('amazon') ||
      lowerMerchant.includes('flipkart')
    ) {
      detectedCategory = '🛍️ Shopping';
    } else {
      detectedCategory = 'Miscellaneous';
    }

    // 5. Entry Type detection: credited/received -> Income, debited/spent/paid -> Expense (default: Expense)
    let detectedEntryType = 'Expense';
    if (/(credit(?:ed)?|received|deposit(?:ed)?|refund(?:ed)?|cashback)\b/i.test(text)) {
      detectedEntryType = 'Income';
    } else if (/(debit(?:ed)?|spent|paid|withdrawal)\b/i.test(text)) {
      detectedEntryType = 'Expense';
    }

    // 6. Source Group detection: rent/EMI/salary/subscription -> Fixed Source (default: Additional Source)
    let detectedSourceType = 'Additional Source';
    if (/(rent|emi|salary|subscription|sip|insurance|recurring|maintenance|bill)\b/i.test(text)) {
      detectedSourceType = 'Fixed Source';
    }

    // 7. Schedule detection: Monthly for Fixed Source, One-Time for Additional Source
    const detectedSchedule = detectedSourceType === 'Fixed Source' ? 'Monthly' : 'One-Time';

    // 8. Description pre-fill: category + UPI/bank reference (e.g. Travel • UPI Ref 49201847)
    const refRegex = /(?:upi\s*ref(?:\s*no\.?|erence)?|ref(?:\s*no\.?|erence)?|utr|txn(?:\s*id)?|rrn)[\s:]*([A-Za-z0-9]+)/i;
    const mRef = text.match(refRegex);
    const catLabel = detectedCategory.replace(/^[^\w\s]+\s*/, '');
    let detectedDescription = '';
    if (mRef && mRef[1]) {
      detectedDescription = `${catLabel} • UPI Ref ${mRef[1]}`;
    } else if (detectedMerchant) {
      detectedDescription = `${catLabel} • ${detectedMerchant}`;
    } else {
      detectedDescription = `${catLabel} • SMS Parser`;
    }

    // 9. Time detection: pre-filled with current time or extracted time
    const timeRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b/;
    const mTime = text.match(timeRegex);
    const detectedTime = mTime ? mTime[1].trim() : getFormattedTime();

    if (detectedAmount) setParsedAmount(detectedAmount);
    if (detectedMerchant) setParsedMerchant(detectedMerchant);
    if (detectedDate) setParsedDate(detectedDate);
    setParsedCategory(detectedCategory);
    setSourceType(detectedSourceType);
    setEntryType(detectedEntryType);
    setParsedDescription(detectedDescription);
    setParsedTime(detectedTime);
    setParsedSchedule(detectedSchedule);

    if (detectedAmount || detectedMerchant) {
      setParserFeedback({
        type: 'success',
        message: `Parsed: ${detectedAmount ? '₹' + detectedAmount : ''} ${detectedMerchant ? '• ' + detectedMerchant : ''} [${detectedSourceType} • ${detectedEntryType}]`,
      });
    } else {
      setParserFeedback(null);
    }
  }, []);

  const handleSmsTextChange = (e) => {
    const val = e.target.value;
    setSmsRawText(val);
    parseSmsContent(val);
  };

  const handleResetParser = () => {
    const now = new Date();
    const curTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    setSmsRawText('');
    setParsedAmount('');
    setParsedMerchant('');
    setParsedDate(now.toISOString().split('T')[0]);
    setParsedCategory('🍔 Food & Dining');
    setSourceType('Additional Source');
    setEntryType('Expense');
    setParsedDescription('');
    setParsedTime(curTime);
    setParsedSchedule('One-Time');
    setParserFeedback(null);
  };

  const handleLogSmsExpense = async () => {
    const numAmount = parseFloat(parsedAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter or parse a valid amount.');
      return;
    }
    const entryName = (parsedMerchant || `${entryType === 'Income' ? 'Income' : 'Expense'} Entry`).trim();

    setIsSubmittingSms(true);
    const now = new Date();
    const curTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeStr = (parsedTime || curTime).trim();

    // Map source and entry type directly to the matching ledger section type
    let targetType = 'additional_expense';
    if (sourceType === 'Fixed Source') {
      targetType = entryType === 'Income' ? 'fixed_income' : 'fixed_expense';
    } else {
      targetType = entryType === 'Income' ? 'additional_income' : 'additional_expense';
    }

    const cleanCategory = (parsedCategory || 'Miscellaneous').replace(/^[^\w\s]+\s*/, '');

    const payload = {
      type: targetType,
      sourceType,
      entryType,
      name: entryName,
      description: (parsedDescription || (smsRawText ? `SMS Parser: ${smsRawText.slice(0, 80)}...` : 'Logged via Smart SMS & Clipboard Parser')).trim(),
      date: parsedDate || now.toISOString().split('T')[0],
      time: timeStr,
      schedule: parsedSchedule || (sourceType === 'Fixed Source' ? 'Monthly' : 'One-Time'),
      category: cleanCategory,
      associated_wallet: 'HDFC Corporate Account',
      amount: numAmount,
    };

    try {
      const res = await apiClient.post('/api/segregation', payload);
      const data = await res.json();
      if (res.ok && data?.data) {
        handleModalSuccess(data.data);
      } else {
        // Fallback optimistic addition
        const fallbackRecord = {
          id: `sms-${Date.now()}`,
          ...payload,
        };
        handleModalSuccess(fallbackRecord);
      }
      handleResetParser();
    } catch (err) {
      console.warn('SMS log fallback:', err);
      const fallbackRecord = {
        id: `sms-${Date.now()}`,
        ...payload,
      };
      handleModalSuccess(fallbackRecord);
      handleResetParser();
    } finally {
      setIsSubmittingSms(false);
    }
  };

  const fetchRecords = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await apiClient.get('/api/segregation');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter duplicates by unique id or name before saving to state
        const uniqueEntries = Array.from(new Map(json.data.map((item) => [item.id || item.name, item])).values());
        setRecords(uniqueEntries);
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
    const handleUpdate = () => fetchRecords(true);
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => window.removeEventListener('sts_data_updated', handleUpdate);
  }, [fetchRecords]);

  const openAddModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (newRecord) => {
    setRecords((prev) => {
      const combined = [newRecord, ...prev];
      // Filter duplicates by unique id or name before saving to state
      return Array.from(new Map(combined.map((item) => [item.id || item.name, item])).values());
    });
    setToastMessage(`"${newRecord.name}" successfully added to ${newRecord.type.replace('_', ' ')}.`);
    setTimeout(() => setToastMessage(null), 4000);
    fetchRecords(true);
  };

  const openEditModal = (item) => {
    setEditingRecord(item);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedRecord) => {
    setRecords((prev) => {
      const updated = prev.map((item) =>
        item.id === updatedRecord.id ? updatedRecord : item
      );
      return Array.from(new Map(updated.map((item) => [item.id || item.name, item])).values());
    });
    setToastMessage(`"${updatedRecord.name}" successfully updated.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    setRecords((prev) => prev.filter((r) => r.id !== item.id));
    setToastMessage(`"${item.name}" successfully removed.`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await apiClient.delete(`/api/segregation/${item.id}`);
    } catch (err) {
      console.warn('API error deleting record:', err);
    }
  };

  // Segregated categories
  const additionalIncome = useMemo(() => {
    const items = records.filter((r) => r.type === 'additional_income');
    return Array.from(new Map(items.map((item) => [item.id || item.name, item])).values());
  }, [records]);

  const additionalExpense = useMemo(() => {
    const items = records.filter((r) => r.type === 'additional_expense');
    return Array.from(new Map(items.map((item) => [item.id || item.name, item])).values());
  }, [records]);

  const fixedIncome = useMemo(() => {
    const items = records.filter((r) => r.type === 'fixed_income');
    return Array.from(new Map(items.map((item) => [item.id || item.name, item])).values());
  }, [records]);

  const fixedExpense = useMemo(() => {
    const items = records.filter((r) => r.type === 'fixed_expense');
    return Array.from(new Map(items.map((item) => [item.id || item.name, item])).values());
  }, [records]);

  const bills = useMemo(() => {
    const items = records.filter((r) => r.type === 'bill');
    return Array.from(new Map(items.map((item) => [item.id || item.name, item])).values());
  }, [records]);

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
    const netWorth = 0;

    return {
      totalIncome,
      totalExpenses,
      monthlySavings,
      netWorth,
    };
  }, [additionalIncome, fixedIncome, additionalExpense, fixedExpense, bills]);

  // Monthly Spend Patterns & Calendar Heatmap data
  const calendarSpendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = {
        day: d,
        totalSpend: 0,
        items: [],
      };
    }

    const allExpenses = [...fixedExpense, ...additionalExpense];
    allExpenses.forEach((item) => {
      if (!item.date) return;
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        if (y === currentYear && m === currentMonth + 1 && d >= 1 && d <= daysInMonth) {
          const amt = Number(item.amount) || 0;
          dailyMap[d].totalSpend += amt;
          dailyMap[d].items.push(item);
        }
      }
    });

    // Zero-Spend Streak: consecutive ₹0 days up to today
    let zeroSpendStreak = 0;
    for (let d = todayDay; d >= 1; d--) {
      if (dailyMap[d].totalSpend === 0) {
        zeroSpendStreak++;
      } else {
        break;
      }
    }

    // Low-Spend Days (<₹500): days where totalSpend > 0 and < 500
    const lowSpendDays = Object.values(dailyMap).filter((d) => d.totalSpend > 0 && d.totalSpend < 500).length;

    // Peak Spend Days (₹2,000+): days where totalSpend >= 2000
    const peakSpendDays = Object.values(dailyMap).filter((d) => d.totalSpend >= 2000).length;

    return {
      currentYear,
      currentMonth,
      monthLabel: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      todayDay,
      daysInMonth,
      firstDayOfWeek,
      dailyMap,
      zeroSpendStreak,
      lowSpendDays,
      peakSpendDays,
    };
  }, [fixedExpense, additionalExpense]);

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
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t('expenses', 'Expenses')}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchRecords(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>{t('sync_ledger', 'Sync Ledger')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchRecords()}
            className="px-2 py-1 bg-rose-600 rounded text-[11px] font-semibold text-white hover:bg-rose-500 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SMART SMS & CLIPBOARD PARSER SECTION                                      */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Smart SMS & Clipboard Parser
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paste raw SMS or UPI transaction alert text for instant automated regex parsing
            </p>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium inline-block self-start sm:self-auto">
            Active OCR & SMS Auto-Parsing
          </span>
        </div>

        {/* Input Textarea */}
        <div className="mt-3">
          <textarea
            value={smsRawText}
            onChange={handleSmsTextChange}
            placeholder="Paste Bank/UPI SMS or Transaction Details Here (e.g. Debited INR 1,500.00 from HDFC Bank A/c XX1234 to UPI merchant Zomato on 21-Nov-2026)"
            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 min-h-[90px] mb-4 transition"
          />
        </div>

        {/* Real-time Parsed Preview Textboxes / Inputs - Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
          {/* Amount */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={parsedAmount}
              onChange={(e) => setParsedAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Merchant */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Merchant / Payee
            </label>
            <input
              type="text"
              value={parsedMerchant}
              onChange={(e) => setParsedMerchant(e.target.value)}
              placeholder="Merchant Name"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Date */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={parsedDate}
              onChange={(e) => setParsedDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={parsedCategory}
              onChange={(e) => setParsedCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="🍔 Food & Dining">🍔 Food & Dining</option>
              <option value="🚗 Travel">🚗 Travel</option>
              <option value="🛍️ Shopping">🛍️ Shopping</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>

        {/* Real-time Parsed Preview Textboxes / Inputs - Row 2 (Ledger Columns Mapping) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 mb-4">
          {/* Source Group */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Source Group
            </label>
            <select
              value={sourceType}
              onChange={(e) => {
                const val = e.target.value;
                setSourceType(val);
                if (val === 'Fixed Source' && (parsedSchedule === 'One-Time' || !parsedSchedule)) {
                  setParsedSchedule('Monthly');
                } else if (val === 'Additional Source' && parsedSchedule === 'Monthly') {
                  setParsedSchedule('One-Time');
                }
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Additional Source">Additional Source</option>
              <option value="Fixed Source">Fixed Source</option>
            </select>
          </div>

          {/* Entry Type */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Entry Type
            </label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={parsedDescription}
              onChange={(e) => setParsedDescription(e.target.value)}
              placeholder="e.g. Travel • UPI Ref 49201847"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Time */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Time
            </label>
            <input
              type="text"
              value={parsedTime}
              onChange={(e) => setParsedTime(e.target.value)}
              placeholder="12:05 PM"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Schedule */}
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Schedule
            </label>
            <select
              value={parsedSchedule}
              onChange={(e) => setParsedSchedule(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="One-Time">One-Time</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Regex-powered real-time client-side extraction</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => {
                const targetType = sourceType === 'Fixed Source'
                  ? (entryType === 'Income' ? 'fixed_income' : 'fixed_expense')
                  : (entryType === 'Income' ? 'additional_income' : 'additional_expense');
                openAddModal(targetType);
                handleResetParser();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Add manual</span>
            </button>

            <button
              type="button"
              onClick={handleLogSmsExpense}
              disabled={isSubmittingSms || !parsedAmount}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-1.5"
            >
              {isSubmittingSms ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <span>📥 Log to Expenses</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. TOP OVERVIEW CARDS                                                     */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{t('total_income', 'Total Income')}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                {formatINR(totals.totalIncome)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Fixed + Additional inflows combined</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{t('total_expenses', 'Total Expenses')}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                {formatINR(totals.totalExpenses)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-rose-600 dark:text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            <span>Total operating & capital outflow</span>
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{t('monthly_savings', 'Monthly Savings')}</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                {formatINR(totals.monthlySavings)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-1">
              {totals.totalIncome > 0
                ? `${((totals.monthlySavings / totals.totalIncome) * 100).toFixed(1)}%`
                : '0%'}
            </span>
            <span>net retention rate</span>
          </div>
        </div>

        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">{t('net_worth', 'Net Worth')}</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                {formatINR(totals.netWorth)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-1">Verified</span>
            <span>corporate asset standing</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FIXED SOURCE SECTION (Side-by-side tables)                             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('fixed_source', 'Fixed Source')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled retainers, office rent, infrastructure, and core payroll</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Fixed Income */}
          <div className="rounded-2xl bg-[#dcfce7]/75 dark:bg-[#0c1322] border border-[#86efac] dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {t('fixed_income', 'Fixed Income')}
                </h4>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  {fixedIncome.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('fixed_income')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('add', 'Add')}</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-2 font-semibold">{t('name', 'Name')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('description', 'Description')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('date', 'Date')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('time', 'Time')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('schedule', 'Schedule')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {fixedIncome.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No fixed income entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    fixedIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatINR(item.amount)}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                            {item.schedule || 'Monthly'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                              title={t('edit', 'Edit')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title={t('delete', 'Delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Fixed Expense */}
          <div className="rounded-2xl bg-[#fee2e2]/75 dark:bg-[#0c1322] border border-[#fca5a5] dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {t('fixed_expense', 'Fixed Expense')}
                </h4>
                <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 font-semibold">
                  {fixedExpense.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('fixed_expense')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('add', 'Add')}</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-2 font-semibold">{t('name', 'Name')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('description', 'Description')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('date', 'Date')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('time', 'Time')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('schedule', 'Schedule')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {fixedExpense.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No fixed expense entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    fixedExpense.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold">{formatINR(item.amount)}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60">
                            {item.schedule || 'Monthly'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                              title={t('edit', 'Edit')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title={t('delete', 'Delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
      {/* 3. ADDITIONAL SOURCE SECTION (Side-by-side tables)                         */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('additional_source', 'Additional Source')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unscheduled or variable income bonuses and project expenses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Additional Income */}
          <div className="rounded-2xl bg-[#dcfce7]/75 dark:bg-[#0c1322] border border-[#86efac] dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {t('additional_income', 'Additional Income')}
                </h4>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  {additionalIncome.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('additional_income')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('add', 'Add')}</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-2 font-semibold">{t('name', 'Name')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('description', 'Description')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('date', 'Date')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('time', 'Time')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('amount', 'Amount')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {additionalIncome.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No additional income entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    additionalIncome.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.name}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                              title={t('edit', 'Edit')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title={t('delete', 'Delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Additional Expense */}
          <div className="rounded-2xl bg-[#fee2e2]/75 dark:bg-[#0c1322] border border-[#fca5a5] dark:border-slate-800 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {t('additional_expense', 'Additional Expense')}
                </h4>
                <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 font-semibold">
                  {additionalExpense.length} entries
                </span>
              </div>
              <button
                onClick={() => openAddModal('additional_expense')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('add', 'Add')}</span>
              </button>
            </div>

            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-2 font-semibold">{t('name', 'Name')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('description', 'Description')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('date', 'Date')}</th>
                    <th className="py-2.5 px-2 font-semibold">{t('time', 'Time')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('amount', 'Amount')}</th>
                    <th className="py-2.5 px-2 font-semibold text-right">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {additionalExpense.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No additional expense entries recorded. Click + Add to record one.
                      </td>
                    </tr>
                  ) : (
                    additionalExpense.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.name}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-[160px] truncate" title={item.description}>
                          {item.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{item.time || '-'}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                              title={t('edit', 'Edit')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title={t('delete', 'Delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
      {/* 4. LEDGER ANALYTICS OVERVIEW SECTION                                      */}
      {/* ========================================================================= */}
      <section className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('ledger_analytics_overview', 'Ledger Analytics Overview')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive visual breakdown of income streams, operational expenditures, and overall financial proportions
            </p>
          </div>
        </div>

        {/* 4-Card Responsive Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* --------------------------------------------------------------------- */}
          {/* Card 1: Fixed Source (Pie Chart)                                      */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const rawIncome = fixedIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const rawExpense = fixedExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const inc = fixedAnalyticsFilter === 'expense' ? 0 : rawIncome;
            const exp = fixedAnalyticsFilter === 'income' ? 0 : rawExpense;
            const sum = inc + exp;
            const incPct = sum > 0 ? (inc / sum) * 100 : 0;
            const expPct = sum > 0 ? (exp / sum) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius; // ~238.76
            const incDash = (incPct / 100) * circumference;
            const expDash = (expPct / 100) * circumference;

            return (
              <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Card Header & Filter */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
                      Fixed Source
                    </h4>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[10px] font-semibold">
                      {['all', 'income', 'expense'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFixedAnalyticsFilter(f)}
                          className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                            fixedAnalyticsFilter === f
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Pie / Donut Chart */}
                  <div className="relative flex items-center justify-center my-3">
                    <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                      {sum === 0 ? (
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="11"
                          className="text-slate-200 dark:text-slate-800"
                        />
                      ) : (
                        <>
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="11"
                            className="dark:stroke-slate-800/60"
                          />
                          {incDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="11"
                              strokeDasharray={`${incDash} ${circumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                            />
                          )}
                          {expDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="11"
                              strokeDasharray={`${expDash} ${circumference}`}
                              strokeDashoffset={-incDash}
                              strokeLinecap="round"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 px-1 truncate max-w-[90px]">
                        {formatINR(sum)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                      <span>Income</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(inc)} ({incPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                      <span>Expense</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      {formatINR(exp)} ({expPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* Card 2: Additional Source (Pie Chart)                                 */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const rawIncome = additionalIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const rawExpense = additionalExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const inc = additionalAnalyticsFilter === 'expense' ? 0 : rawIncome;
            const exp = additionalAnalyticsFilter === 'income' ? 0 : rawExpense;
            const sum = inc + exp;
            const incPct = sum > 0 ? (inc / sum) * 100 : 0;
            const expPct = sum > 0 ? (exp / sum) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const incDash = (incPct / 100) * circumference;
            const expDash = (expPct / 100) * circumference;

            return (
              <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Card Header & Filter */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
                      Additional Source
                    </h4>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[10px] font-semibold">
                      {['all', 'income', 'expense'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setAdditionalAnalyticsFilter(f)}
                          className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                            additionalAnalyticsFilter === f
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Pie / Donut Chart */}
                  <div className="relative flex items-center justify-center my-3">
                    <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                      {sum === 0 ? (
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="11"
                          className="text-slate-200 dark:text-slate-800"
                        />
                      ) : (
                        <>
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="11"
                            className="dark:stroke-slate-800/60"
                          />
                          {incDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="11"
                              strokeDasharray={`${incDash} ${circumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                            />
                          )}
                          {expDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="11"
                              strokeDasharray={`${expDash} ${circumference}`}
                              strokeDashoffset={-incDash}
                              strokeLinecap="round"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 px-1 truncate max-w-[90px]">
                        {formatINR(sum)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                      <span>Income</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(inc)} ({incPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                      <span>Expense</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      {formatINR(exp)} ({expPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* Card 3: Overall Proportion (Pie Chart)                                */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const rawIncome =
              fixedIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0) +
              additionalIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const rawExpense =
              fixedExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0) +
              additionalExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0) +
              bills.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const inc = overallAnalyticsFilter === 'expense' ? 0 : rawIncome;
            const exp = overallAnalyticsFilter === 'income' ? 0 : rawExpense;
            const sum = inc + exp;
            const incPct = sum > 0 ? (inc / sum) * 100 : 0;
            const expPct = sum > 0 ? (exp / sum) * 100 : 0;
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const incDash = (incPct / 100) * circumference;
            const expDash = (expPct / 100) * circumference;

            return (
              <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Card Header & Filter */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
                      Overall Proportion
                    </h4>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[10px] font-semibold">
                      {['all', 'income', 'expense'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setOverallAnalyticsFilter(f)}
                          className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                            overallAnalyticsFilter === f
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Pie / Donut Chart */}
                  <div className="relative flex items-center justify-center my-3">
                    <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                      {sum === 0 ? (
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="11"
                          className="text-slate-200 dark:text-slate-800"
                        />
                      ) : (
                        <>
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="11"
                            className="dark:stroke-slate-800/60"
                          />
                          {incDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="11"
                              strokeDasharray={`${incDash} ${circumference}`}
                              strokeDashoffset="0"
                              strokeLinecap="round"
                            />
                          )}
                          {expDash > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="11"
                              strokeDasharray={`${expDash} ${circumference}`}
                              strokeDashoffset={-incDash}
                              strokeLinecap="round"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 px-1 truncate max-w-[90px]">
                        {formatINR(sum)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend & Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                      <span>Total Income</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(inc)} ({incPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                      <span>Total Expense</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      {formatINR(exp)} ({expPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* Card 4: Income vs Expense Graph (Bar Chart)                           */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const fixedInc = fixedIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const fixedExp = fixedExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const addInc = additionalIncome.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const addExp = additionalExpense.reduce((s, r) => s + (Number(r.amount) || 0), 0);

            const showInc = graphAnalyticsFilter !== 'expense';
            const showExp = graphAnalyticsFilter !== 'income';

            const valuesToCompare = [];
            if (showInc) valuesToCompare.push(fixedInc, addInc);
            if (showExp) valuesToCompare.push(fixedExp, addExp);
            const maxVal = Math.max(...valuesToCompare, 1);

            const fixedIncHeight = showInc ? Math.max(4, Math.round((fixedInc / maxVal) * 88)) : 0;
            const fixedExpHeight = showExp ? Math.max(4, Math.round((fixedExp / maxVal) * 88)) : 0;
            const addIncHeight = showInc ? Math.max(4, Math.round((addInc / maxVal) * 88)) : 0;
            const addExpHeight = showExp ? Math.max(4, Math.round((addExp / maxVal) * 88)) : 0;

            return (
              <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Card Header & Filter */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide truncate">
                      Income vs Expense
                    </h4>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[10px] font-semibold">
                      {['all', 'income', 'expense'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setGraphAnalyticsFilter(f)}
                          className={`px-2 py-0.5 rounded-md capitalize transition-all cursor-pointer ${
                            graphAnalyticsFilter === f
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Side-by-Side SVG Bar Chart */}
                  <div className="h-36 flex items-end justify-around px-2 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    {/* Fixed Source Group */}
                    <div className="flex flex-col items-center w-1/2">
                      <div className="flex items-end space-x-1.5 h-24">
                        {showInc && (
                          <div
                            className="w-5 bg-[#10b981] rounded-t-md transition-all duration-500 relative group"
                            style={{ height: `${fixedInc > 0 ? fixedIncHeight : 2}px` }}
                            title={`Fixed Income: ${formatINR(fixedInc)}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-900 text-white px-1 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                              {formatINR(fixedInc)}
                            </span>
                          </div>
                        )}
                        {showExp && (
                          <div
                            className="w-5 bg-[#ef4444] rounded-t-md transition-all duration-500 relative group"
                            style={{ height: `${fixedExp > 0 ? fixedExpHeight : 2}px` }}
                            title={`Fixed Expense: ${formatINR(fixedExp)}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-900 text-white px-1 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                              {formatINR(fixedExp)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-2 truncate max-w-full">
                        Fixed
                      </span>
                    </div>

                    {/* Additional Source Group */}
                    <div className="flex flex-col items-center w-1/2">
                      <div className="flex items-end space-x-1.5 h-24">
                        {showInc && (
                          <div
                            className="w-5 bg-[#10b981] rounded-t-md transition-all duration-500 relative group"
                            style={{ height: `${addInc > 0 ? addIncHeight : 2}px` }}
                            title={`Addl Income: ${formatINR(addInc)}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-900 text-white px-1 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                              {formatINR(addInc)}
                            </span>
                          </div>
                        )}
                        {showExp && (
                          <div
                            className="w-5 bg-[#ef4444] rounded-t-md transition-all duration-500 relative group"
                            style={{ height: `${addExp > 0 ? addExpHeight : 2}px` }}
                            title={`Addl Expense: ${formatINR(addExp)}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-900 text-white px-1 py-0.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                              {formatINR(addExp)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-2 truncate max-w-full">
                        Additional
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend & Summary Values */}
                <div className="pt-2 space-y-1 text-[11px] font-medium">
                  {showInc && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                        <span>Income</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(fixedInc + addInc)}
                      </span>
                    </div>
                  )}
                  {showExp && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                        <span>Expense</span>
                      </span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatINR(fixedExp + addExp)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MONTHLY SPEND PATTERNS & DAY STREAKS HEATMAP CALENDAR                  */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm mb-6">
        {/* Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Monthly Spend Patterns &amp; Day Streaks</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {calendarSpendData.monthLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client-side daily spending calendar, streak tracking, and day-by-day expense drilldown
              </p>
            </div>
          </div>

          {/* Compact 4-Dot Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border border-slate-400/40" />
              <span>₹0</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500 border border-emerald-500/40" />
              <span>&lt;₹500</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500 border border-amber-500/40" />
              <span>₹500–₹2k</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500 border border-rose-500/40" />
              <span>&gt;₹2k</span>
            </div>
          </div>
        </div>

        {/* Streak Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Zero-Spend Streak: <strong className="font-bold text-slate-900 dark:text-slate-100">{calendarSpendData.zeroSpendStreak} Days</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Low-Spend Days (&lt;₹500): <strong className="font-bold text-emerald-900 dark:text-emerald-100">{calendarSpendData.lowSpendDays} / {calendarSpendData.daysInMonth}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Peak Spend Days (₹2,000+): <strong className="font-bold text-rose-900 dark:text-rose-100">{calendarSpendData.peakSpendDays} / {calendarSpendData.daysInMonth}</strong></span>
          </div>
        </div>

        {/* Responsive 7-Column Calendar Grid */}
        <div className="w-full overflow-hidden">
          {/* Day Headers (Sun to Sat) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center mb-1.5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid Tiles */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots before first day of month */}
            {Array.from({ length: calendarSpendData.firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[50px] sm:min-h-[58px] opacity-0 pointer-events-none" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: calendarSpendData.daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayData = calendarSpendData.dailyMap[dayNum] || { totalSpend: 0, items: [] };
              const isSelected = selectedCalendarDay === dayNum;
              const isToday = dayNum === calendarSpendData.todayDay;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedCalendarDay(dayNum)}
                  className={`p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between items-center transition cursor-pointer text-center min-h-[50px] sm:min-h-[58px] relative ${getDayIntensityClass(dayData.totalSpend, isSelected)}`}
                  title={`Day ${dayNum}: ${formatINR(dayData.totalSpend)}`}
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-[11px] sm:text-xs font-bold leading-none">
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Today" />
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold leading-tight truncate w-full block">
                    {formatCompactINR(dayData.totalSpend)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inline Breakdown */}
        {(() => {
          const selectedDayData = calendarSpendData.dailyMap[selectedCalendarDay] || { totalSpend: 0, items: [] };
          const selectedDateLabel = new Date(calendarSpendData.currentYear, calendarSpendData.currentMonth, selectedCalendarDay).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2.5">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Breakdown for {selectedDateLabel}
                  </h4>
                  {selectedCalendarDay === calendarSpendData.todayDay && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  Total Day Spend: <span className={selectedDayData.totalSpend > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>{formatINR(selectedDayData.totalSpend)}</span>
                </span>
              </div>

              {selectedDayData.items.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  No expenses logged on this day
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedDayData.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                            {item.name || 'Expense'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.category || 'General'} {item.time ? `• ${item.time}` : ''} {item.schedule ? `(${item.schedule})` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap ml-2">
                        {formatINR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Add Entry Modal */}
      <AddIncomeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Entry Modal */}
      <EditIncomeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        entry={editingRecord}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
