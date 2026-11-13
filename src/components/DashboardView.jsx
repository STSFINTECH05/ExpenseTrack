import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
  Layers,
  PieChart,
  Target,
  Flag,
  Bell,
  Clock,
  Users,
  Split,
  Lock,
  Wallet,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import apiClient, { API_BASE_URL } from '../apiClient';

const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
};

export default function DashboardView({ setActiveTab, onNavigateToSegregation, onNavigate }) {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('DashboardView LanguageContext fallback:', err);
  }

  // Unified navigation dispatcher supporting exact required signatures
  const handleNavigate = (tabId) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    } else if (typeof onNavigate === 'function') {
      onNavigate(tabId);
    } else if (tabId === 'segregation' && typeof onNavigateToSegregation === 'function') {
      onNavigateToSegregation();
    }
  };

  // =========================================================================
  // 1. File Upload State (Card 1)
  // =========================================================================
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Invalid file type. Please upload a PDF or CSV bank statement.');
      setUploadStatus('error');
      setSelectedFile(null);
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setUploadStatus('uploading');
    setUploadProgress(10);

    let current = 10;
    const interval = setInterval(() => {
      current += 25;
      if (current >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadStatus('success');
      } else {
        setUploadProgress(current);
      }
    }, 180);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const removeFile = (e) => {
    e?.stopPropagation();
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // =========================================================================
  // 2. Dynamic Financial Data Hooks & Synchronization (Card 2)
  // =========================================================================
  const [billsList, setBillsList] = useState([]);
  const [splitsData, setSplitsData] = useState(null);
  const [goalsList, setGoalsList] = useState([]);

  useEffect(() => {
    const loadLocalData = () => {
      // 1. Bills
      try {
        const storedBills = localStorage.getItem('sts_bills');
        if (storedBills) {
          const parsed = JSON.parse(storedBills);
          if (Array.isArray(parsed) && parsed.length > 0) setBillsList(parsed);
        }
      } catch (e) {}

      // 2. Splits
      try {
        const storedSplits = localStorage.getItem('sts_splits');
        if (storedSplits) {
          const parsed = JSON.parse(storedSplits);
          if (parsed) setSplitsData(parsed);
        }
      } catch (e) {}

      // 3. Goals
      try {
        const storedGoals = localStorage.getItem('sts_goals');
        if (storedGoals) {
          const parsed = JSON.parse(storedGoals);
          if (Array.isArray(parsed) && parsed.length > 0) setGoalsList(parsed);
        }
      } catch (e) {}
    };

    loadLocalData();

    // Also fetch initial data from backend APIs if available
    const fetchApiBacking = async () => {
      try {
        const [billsRes, walletsRes, splitsRes] = await Promise.allSettled([
          apiClient.get('/api/segregation?type=bill'),
          apiClient.get('/api/wallets'),
          apiClient.get('/api/splits/groups'),
        ]);

        if (billsRes.status === 'fulfilled' && billsRes.value.ok) {
          const json = await billsRes.value.json();
          const items = json.data || (Array.isArray(json) ? json : []);
          setBillsList(Array.isArray(items) ? items : []);
        }

        if (walletsRes.status === 'fulfilled' && walletsRes.value.ok) {
          const json = await walletsRes.value.json();
          const items = json.data || (Array.isArray(json) ? json : []);
          setGoalsList(Array.isArray(items) ? items : []);
        }

        if (splitsRes.status === 'fulfilled' && splitsRes.value.ok) {
          const json = await splitsRes.value.json();
          const items = json.data || (Array.isArray(json) ? json : []);
          setSplitsData(Array.isArray(items) ? items : []);
        }
      } catch (e) {}
    };

    fetchApiBacking();

    const handleUpdate = () => {
      loadLocalData();
      fetchApiBacking();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('sts_data_updated', handleUpdate);
    };
  }, []);

  // Compute: Earliest Bill to Pay
  const earliestBill = useMemo(() => {
    if (!Array.isArray(billsList) || billsList.length === 0) {
      return null;
    }

    // Filter unpaid bills
    const unpaidBills = billsList.filter((b) => {
      const status = (b.status || '').toUpperCase();
      return status !== 'PAID';
    });

    if (unpaidBills.length === 0) {
      return null;
    }

    const parsed = unpaidBills.map((b) => {
      const rawDate = b.date || b.dueDate || b.due_date || '';
      let d = rawDate ? new Date(rawDate) : null;
      if (!d || isNaN(d.getTime())) {
        d = null;
      }
      return {
        name: b.name || b.title || 'Scheduled Bill',
        amount: Number(b.amount) || 0,
        dateObj: d,
        rawDate,
      };
    });

    // Sort by due date (earliest first, null dates at the end)
    parsed.sort((a, b) => {
      if (!a.dateObj && !b.dateObj) return 0;
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return a.dateObj.getTime() - b.dateObj.getTime();
    });

    const item = parsed[0];
    if (!item) return null;

    const dateStr = item.dateObj
      ? item.dateObj.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'No date';

    return {
      name: item.name,
      amount: item.amount,
      dateStr,
    };
  }, [billsList]);

  // Compute: Settlement Balances (Split & Collect)
  const settlementBalances = useMemo(() => {
    let owedToYou = 0;
    let youOwe = 0;

    if (Array.isArray(splitsData) && splitsData.length > 0) {
      splitsData.forEach((item) => {
        if (typeof item.owedToYou === 'number') owedToYou += item.owedToYou;
        if (typeof item.youOwe === 'number') youOwe += item.youOwe;

        if (Array.isArray(item.debts)) {
          item.debts.forEach((debt) => {
            const amt = Number(debt.amount) || 0;
            const toLower = (debt.to || '').toLowerCase();
            const fromLower = (debt.from || '').toLowerCase();
            if (toLower === 'you' || toLower.includes('sts')) owedToYou += amt;
            if (fromLower === 'you' || fromLower.includes('sts')) youOwe += amt;
          });
        }

        if (Array.isArray(item.expenses) && Array.isArray(item.participants) && item.participants.length > 0) {
          const total = item.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const share = total / item.participants.length;
          const paidByYou = item.expenses
            .filter((e) => (e.paidBy || '').toLowerCase() === 'you')
            .reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const net = paidByYou - share;
          if (net > 0) owedToYou += net;
          else if (net < 0) youOwe += Math.abs(net);
        }
      });
    } else if (splitsData && typeof splitsData === 'object') {
      if (typeof splitsData.owedToYou === 'number') {
        owedToYou = splitsData.owedToYou;
      }
      if (typeof splitsData.youOwe === 'number') {
        youOwe = splitsData.youOwe;
      }
    }

    return {
      owedToYou: Math.round(owedToYou),
      youOwe: Math.round(youOwe),
    };
  }, [splitsData]);

  // Compute: Highest Progress Goal (Goal Target)
  const highestProgressGoal = useMemo(() => {
    if (!Array.isArray(goalsList) || goalsList.length === 0) {
      return null;
    }

    const computed = goalsList.map((g) => {
      const saved = Number(g.saved || g.saved_amount || g.currentAmount || 0);
      const target = Number(g.target || g.target_amount || g.targetCap || 0);
      const percentage = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      return {
        name: g.name || g.purpose || g.title || 'Goal',
        saved,
        target,
        percentage,
      };
    });

    computed.sort((a, b) => b.percentage - a.percentage);

    return computed[0] || null;
  }, [goalsList]);

  // Quick Action Modules definition (Red & Green Visual Identity)
  const quickModules = [
    {
      id: 'segregation',
      title: 'Segregation',
      subtitle: 'Income & Expense',
      icon: Layers,
      accentBg: 'bg-emerald-500/15',
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-500/50',
    },
    {
      id: 'goal-target',
      title: 'Goal Target',
      subtitle: 'Savings & Ceilings',
      icon: Target,
      accentBg: 'bg-emerald-500/15',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-500/50',
    },
    {
      id: 'bill-reminder',
      title: 'Bill & Reminder',
      subtitle: 'Recurring Dues',
      icon: Bell,
      accentBg: 'bg-red-500/15',
      accentColor: 'text-red-600 dark:text-red-400',
      borderHover: 'hover:border-red-500/50',
    },
    {
      id: 'split-collect',
      title: 'Split & Collect',
      subtitle: 'Shared Balances',
      icon: Users,
      accentBg: 'bg-red-500/15',
      accentColor: 'text-red-600 dark:text-red-400',
      borderHover: 'hover:border-red-500/50',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header bar */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('dashboard', 'Dashboard')}
        </h1>
      </div>

      {/* Main Two Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ========================================================================= */}
        {/* CARD 1: Upload Last 12 Months Bank Statement                              */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex-shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Upload Last 12 Months Bank Statement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Automated transaction extraction for all recognized banks
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Badges */}
            <div className="flex items-center gap-2 mt-4 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Supported formats:
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </span>
            </div>

            {/* File Dropzone */}
            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="bank-statement-upload"
              />

              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-7 sm:p-9 text-center transition-all duration-200 flex flex-col items-center justify-center ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] shadow-md shadow-emerald-500/10'
                      : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="p-3.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-800/50">
                    <UploadCloud className="w-7 h-7 animate-pulse" />
                  </div>

                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
                      Click to browse
                    </span>{' '}
                    or drag & drop your statement here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload your 12-month PDF or CSV statement (up to 25MB)
                  </p>

                  <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400 bg-white/70 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Password-protected bank statements are supported</span>
                  </div>
                </div>
              ) : (
                /* Selected File Card State */
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex-shrink-0">
                        {selectedFile.name.endsWith('.csv') ? (
                          <FileSpreadsheet className="w-6 h-6" />
                        ) : (
                          <FileText className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatFileSize(selectedFile.size)} • Statement Ready
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar / Success */}
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Parsing bank statements...</span>
                        <span className="font-mono font-bold text-emerald-500">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">
                        Statement parsed successfully! Ready for ledger synchronization.
                      </span>
                    </div>
                  )}

                  {/* Action row when file is loaded */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      Choose different file
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('segregation')}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span>View Extracted Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer Security Guarantee */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>256-Bit Bank-Grade Encryption</span>
            </div>
            <span className="text-[11px] text-slate-500">100% Confidential</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: I Will Enter Manually (Enhanced with Live Widgets & 4-Button Grid)*/}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-5">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    I Will Enter Manually
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time financial widgets & instant module shortcuts
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* LIVE DYNAMIC HIGHLIGHTS SECTION                                     */}
            {/* =================================================================== */}
            <div className="space-y-3">
              {/* Highlight 1: Earliest Bill to Pay (Bill & Reminder) */}
              <div
                onClick={() => handleNavigate('bill-reminder')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate('bill-reminder')}
                className="p-3 sm:p-3.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/15 transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-sm"
                title="Click to view Bill & Reminder"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                    {earliestBill && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${earliestBill ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                  </span>
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-200 truncate">
                    <span className="font-black text-rose-700 dark:text-rose-300">Earliest Due:</span>{' '}
                    {earliestBill ? (
                      `${earliestBill.name} (${formatINR(earliestBill.amount)}) • Due ${earliestBill.dateStr}`
                    ) : (
                      'No upcoming bills'
                    )}
                  </p>
                </div>
                {earliestBill && (
                  <div className="flex items-center space-x-1 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-500/15 group-hover:bg-rose-500/25 px-2 py-0.5 rounded transition">
                    <span>Pay</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>

              {/* Highlight 2: Settlement Balances (Split & Collect) */}
              <div
                onClick={() => handleNavigate('split-collect')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate('split-collect')}
                className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 hover:border-emerald-500/40 hover:bg-slate-100/70 dark:hover:bg-slate-850 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm group"
                title="Click to view Split & Collect"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Settlement Balances:
                  </span>
                </div>

                <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                  {/* Vibrant Green Pill: Owed to you */}
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 group-hover:border-emerald-500/50 transition">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                    <span>Owed to you: {formatINR(settlementBalances.owedToYou)}</span>
                  </span>

                  {/* Amber/Red Pill: You owe */}
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 group-hover:border-rose-500/50 transition">
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                    <span>You owe: {formatINR(settlementBalances.youOwe)}</span>
                  </span>
                </div>
              </div>

              {/* Highlight 3: Highest Progress Goal (Goal Target) */}
              <div
                onClick={() => handleNavigate('goal-target')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleNavigate('goal-target')}
                className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 hover:border-emerald-500/40 hover:bg-slate-100/70 dark:hover:bg-slate-850 transition-all duration-200 cursor-pointer space-y-2 shadow-sm group"
                title="Click to view Goal Target"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-sm">🏆</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      Leading Goal: {highestProgressGoal ? highestProgressGoal.name : 'No active goals'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 flex-shrink-0">
                    {highestProgressGoal ? highestProgressGoal.percentage : 0}% completed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500 group-hover:brightness-110"
                    style={{ width: `${Math.min(100, Math.max(0, highestProgressGoal ? highestProgressGoal.percentage : 0))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Saved: {formatINR(highestProgressGoal ? highestProgressGoal.saved : 0)}</span>
                  <span>Target: {formatINR(highestProgressGoal ? highestProgressGoal.target : 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* MODULE QUICK-ACTION BUTTONS (Structured 4-Button Grid)             */}
          {/* =================================================================== */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Quick Launch Modules
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {quickModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleNavigate(mod.id)}
                    className={`p-3 sm:p-3.5 rounded-xl text-left bg-slate-50/90 dark:bg-[#0b101c] border border-slate-200/90 dark:border-slate-800/90 ${mod.borderHover} hover:bg-white dark:hover:bg-slate-850 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex flex-col justify-between group`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`p-2 rounded-lg ${mod.accentBg} ${mod.accentColor} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {mod.title}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {mod.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
