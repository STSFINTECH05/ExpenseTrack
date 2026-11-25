import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  History,
  Copy,
  Trash2,
  Share2,
  Check,
  ChevronDown,
  Calendar as CalendarIcon,
  Calculator as CalculatorIcon,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Plus,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import apiClient from '../apiClient';

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

const formatINRCurrencyNoDecimals = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
};

// Seed scheduled bills matching Bills & Reminders
const DEFAULT_BILLS = [
  { id: 'slice-bill-1', name: 'Slice Bill', title: 'Slice Bill', amount: 600, date: '2026-11-10', schedule: 'Monthly', category: 'Credit Card' },
  { id: 'slice-bill-2', name: 'Slice Bill', title: 'Slice Bill', amount: 600, date: '2026-11-11', schedule: 'Monthly', category: 'Card Settlement' },
  { id: 'aws-cloud-1', name: 'AWS Cloud Services', title: 'AWS Cloud Services', amount: 2400, date: '2026-11-15', schedule: 'Monthly', category: 'Infrastructure' },
  { id: 'airtel-wifi-1', name: 'Airtel Fiber Broadband', title: 'Airtel Fiber Broadband', amount: 999, date: '2026-11-22', schedule: 'Monthly', category: 'Utilities' },
];

export default function SlideOverUtilityDrawer({
  isOpen,
  onClose,
  activeTab = 'calc', // 'calc' | 'calendar' | 'notes'
  setActiveTab,
}) {
  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Allow body scroll so user can scroll dashboard alongside panel, or keep overflow intact
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop visible only on mobile screens (< sm) so desktop reflows smoothly without blocking clicks */}
      <div
        className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer select-none"
        onClick={onClose}
        aria-label="Close utility drawer"
      />

      {/* Slide-over panel positioned strictly below the fixed top header */}
      <aside
        className="fixed top-16 bottom-0 right-0 w-full sm:w-[360px] md:w-[380px] h-[calc(100vh-64px)] bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl z-40 flex flex-col justify-between overflow-hidden animate-slideLeft transition-colors duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {activeTab === 'calc' && <CalculatorDrawerContent onClose={onClose} />}
        {activeTab === 'calendar' && <CalendarDrawerContent onClose={onClose} />}
        {activeTab === 'notes' && <NotesDrawerContent onClose={onClose} />}
      </aside>
    </>
  );
}

// ============================================================================
// 1. TAB 1: CALCULATOR (Header: CALCULATOR)
// ============================================================================
function CalculatorDrawerContent({ onClose }) {
  const [tape, setTape] = useState([]);
  const [activeExpr, setActiveExpr] = useState('');
  const [currentResult, setCurrentResult] = useState('0');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sciMode, setSciMode] = useState(false);
  const tapeEndRef = useRef(null);

  // Scroll to bottom of tape whenever it updates
  useEffect(() => {
    tapeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tape, activeExpr]);

  // Evaluate arithmetic expression safely
  const evaluate = useCallback((expr) => {
    if (!expr || expr.trim() === '') return '0';
    try {
      let sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/%/g, '/100');
      sanitized = sanitized.replace(/[+\-*/.]+$/, '');
      if (!sanitized) return '0';
      if (!/^[\d\s+\-*/.()]+$/.test(sanitized)) return 'Error';
      const val = Function(`"use strict"; return (${sanitized})`)();
      if (isNaN(val) || !isFinite(val)) return 'Error';
      const rounded = Math.round(val * 100000000) / 100000000;
      return String(rounded);
    } catch {
      return 'Error';
    }
  }, []);

  const handleInput = (val) => {
    setActiveExpr((prev) => {
      // Prevent consecutive operators
      if (['+', '-', '×', '÷'].includes(val)) {
        if (!prev) return '0' + val;
        if (['+', '-', '×', '÷'].includes(prev.slice(-1))) {
          return prev.slice(0, -1) + val;
        }
      }
      if (val === '.') {
        const lastNum = prev.split(/[+\-×÷]/).pop() || '';
        if (lastNum.includes('.')) return prev;
      }
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setActiveExpr((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setActiveExpr('');
    setCurrentResult('0');
    setTape([]);
  };

  const handleCalculate = () => {
    if (!activeExpr) return;
    const res = evaluate(activeExpr);
    if (res !== 'Error') {
      const entry = {
        id: Date.now() + Math.random(),
        expr: activeExpr,
        result: res,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setTape((prev) => [...prev, entry]);
      setCurrentResult(res);
      setActiveExpr('');
    } else {
      setCurrentResult('Error');
    }
  };

  // Tape Running Total: sum of all completed tape results + active expression result
  const tapeRunningTotal = useMemo(() => {
    let sum = tape.reduce((acc, curr) => {
      const n = parseFloat(curr.result);
      return !isNaN(n) ? acc + n : acc;
    }, 0);

    if (activeExpr) {
      const live = evaluate(activeExpr);
      const n = parseFloat(live);
      if (!isNaN(n)) sum += n;
    } else if (tape.length === 0 && currentResult !== '0' && currentResult !== 'Error') {
      const n = parseFloat(currentResult);
      if (!isNaN(n)) sum = n;
    }

    return sum;
  }, [tape, activeExpr, currentResult, evaluate]);

  // Quick Action Pills
  const handlePillAction = (action) => {
    const baseVal = parseFloat(currentResult !== '0' ? currentResult : (evaluate(activeExpr) || '0')) || 0;
    if (action === 'gst') {
      // +18% GST calculation
      const gstAmount = (baseVal * 0.18);
      const total = baseVal + gstAmount;
      const entry = {
        id: Date.now(),
        expr: `${baseVal} + 18% GST (₹${gstAmount.toFixed(2)})`,
        result: String(Math.round(total * 100) / 100),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTape((prev) => [...prev, entry]);
      setCurrentResult(String(Math.round(total * 100) / 100));
      setActiveExpr('');
    } else if (action === 'discount') {
      // 10% discount
      const disc = (baseVal * 0.10);
      const total = baseVal - disc;
      const entry = {
        id: Date.now(),
        expr: `${baseVal} - 10% Discount`,
        result: String(Math.round(total * 100) / 100),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTape((prev) => [...prev, entry]);
      setCurrentResult(String(Math.round(total * 100) / 100));
      setActiveExpr('');
    } else if (action === 'inr') {
      // Format as INR
      setCopied(true);
      navigator.clipboard?.writeText(formatINR(tapeRunningTotal));
      setTimeout(() => setCopied(false), 2000);
    } else if (action === 'compare') {
      // Compare last two tape items
      if (tape.length >= 2) {
        const last = parseFloat(tape[tape.length - 1].result) || 0;
        const prev = parseFloat(tape[tape.length - 2].result) || 0;
        const diff = last - prev;
        const pct = prev !== 0 ? ((diff / prev) * 100).toFixed(1) : '0';
        const entry = {
          id: Date.now(),
          expr: `Diff: ₹${last} vs ₹${prev}`,
          result: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct}%)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTape((p) => [...p, entry]);
      }
    }
  };

  const handleCopyTape = () => {
    const text = tape.map((t) => `${t.expr} = ${t.result}`).join('\n') + `\nTotal: ${formatINR(tapeRunningTotal)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
      {/* 1. Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/90">
        <div className="flex items-center space-x-2">
          <CalculatorIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">
            CALCULATOR
          </h2>
        </div>

        {/* Action icons: History, Copy/Share, Clear/Trash, Close */}
        <div className="flex items-center space-x-1 text-slate-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ${
              showHistory ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : ''
            }`}
            title="History Tape"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyTape}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Copy Tape"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
            title="Clear All Tape"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ml-1"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Tape History & Active Expression Screen */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50/40 dark:bg-[#090d16]/70 min-h-[140px] max-h-[220px]">
        {tape.length === 0 && !activeExpr && (
          <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-400 dark:text-zinc-500">
            <CalculatorIcon className="w-7 h-7 mb-1.5 stroke-[1.5] text-slate-300 dark:text-zinc-600" />
            <p className="text-xs font-semibold">Start typing to record Tape</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Live mathematical ledger calculations
            </p>
          </div>
        )}

        {/* History items */}
        {tape.map((item) => (
          <div
            key={item.id}
            className="p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs text-right animate-fadeIn"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">
              <span>{item.time}</span>
              <span className="font-mono truncate pl-2">{item.expr}</span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-800 dark:text-emerald-400">
              = {item.result}
            </div>
          </div>
        ))}

        {/* Live Active Expression & Result */}
        <div className="pt-2 text-right">
          <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
            SET BASE
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 min-h-[16px] truncate">
            {activeExpr || '0'}
          </div>
          <div className="text-2xl font-mono font-black text-slate-900 dark:text-white truncate">
            {activeExpr ? evaluate(activeExpr) : currentResult}
          </div>
        </div>
        <div ref={tapeEndRef} />
      </div>

      {/* 3. Quick Action Pills */}
      <div className="px-4 py-2 border-t border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => handlePillAction('gst')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition cursor-pointer whitespace-nowrap"
        >
          % GST
        </button>
        <button
          type="button"
          onClick={() => handlePillAction('discount')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition cursor-pointer whitespace-nowrap"
        >
          Discount
        </button>
        <button
          type="button"
          onClick={() => handlePillAction('inr')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 transition cursor-pointer whitespace-nowrap"
        >
          INR
        </button>
        <button
          type="button"
          onClick={() => handlePillAction('compare')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 transition cursor-pointer whitespace-nowrap"
        >
          Compare
        </button>
      </div>

      {/* 4. 5x4 Keypad Grid */}
      <div className="p-3 bg-slate-100/70 dark:bg-[#0c1220] grid grid-cols-4 gap-2">
        {/* Row 1: Clear, Backspace, /, x */}
        <button
          type="button"
          onClick={() => setActiveExpr('')}
          className="py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 active:scale-95 transition cursor-pointer"
        >
          AC
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="py-2.5 rounded-xl text-xs font-bold bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300/80 dark:border-zinc-700 hover:bg-slate-300 active:scale-95 transition cursor-pointer"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => handleInput('÷')}
          className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
        >
          ÷
        </button>
        <button
          type="button"
          onClick={() => handleInput('×')}
          className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
        >
          ×
        </button>

        {/* Row 2: 7, 8, 9, - */}
        <button
          type="button"
          onClick={() => handleInput('7')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleInput('8')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleInput('9')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleInput('-')}
          className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
        >
          -
        </button>

        {/* Row 3: 4, 5, 6, + */}
        <button
          type="button"
          onClick={() => handleInput('4')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleInput('5')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleInput('6')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleInput('+')}
          className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
        >
          +
        </button>

        {/* Row 4: 1, 2, 3, = (row-span-2) */}
        <button
          type="button"
          onClick={() => handleInput('1')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleInput('2')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleInput('3')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          3
        </button>
        <button
          type="button"
          onClick={handleCalculate}
          className="row-span-2 rounded-xl text-base font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 active:scale-95 transition flex items-center justify-center cursor-pointer"
        >
          =
        </button>

        {/* Row 5: SCI, 0, . */}
        <button
          type="button"
          onClick={() => setSciMode((p) => !p)}
          className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            sciMode
              ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
              : 'bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:bg-slate-300'
          }`}
          title="Toggle Scientific Math"
        >
          SCI
        </button>
        <button
          type="button"
          onClick={() => handleInput('0')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleInput('.')}
          className="py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
        >
          .
        </button>
      </div>

      {/* 5. Sticky Dark Bottom Bar: TAPE RUNNING TOTAL */}
      <div className="bg-[#0F172A] text-white p-4 border-t border-slate-800 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            TAPE RUNNING TOTAL
          </p>
          <p className="text-xl font-mono font-black text-emerald-400 tracking-tight">
            {formatINR(tapeRunningTotal)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            {tape.length} {tape.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. TAB 2: CALENDAR (Header: CALENDAR)
// ============================================================================
function CalendarDrawerContent({ onClose }) {
  // Default to Nov 2026 (Month index 10)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 1));
  const [bills, setBills] = useState([]);
  const [selectedDayBills, setSelectedDayBills] = useState(null);

  // Load bills from localStorage or defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sts_bills');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBills(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    setBills(DEFAULT_BILLS);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayBills(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayBills(null);
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      });
    }

    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const formattedMonth = String(month + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

      const dayBills = bills.filter((b) => {
        if (!b.date) return false;
        const bDate = b.date.split('T')[0];
        if (bDate === dateStr) return true;
        // Check recurring monthly
        const bDay = parseInt(bDate.split('-')[2], 10);
        return bDay === day && (b.schedule === 'Monthly' || !b.schedule);
      });

      cells.push({
        day,
        isCurrentMonth: true,
        dateStr,
        isToday: isCurrentYearMonth && today.getDate() === day,
        bills: dayBills,
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return cells;
  }, [year, month, bills]);

  return (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/90">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">
            CALENDAR
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Month Selector Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCurrentDate(new Date(2026, 10, 1))}
          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* 3. Monthly Calendar Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Day of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((d, i) => (
            <div
              key={i}
              className={`text-[10px] font-bold uppercase py-1 ${
                i === 0 || i === 6 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            const hasBills = cell.bills && cell.bills.length > 0;
            const isSelected = selectedDayBills?.day === cell.day && cell.isCurrentMonth;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth && hasBills) {
                    setSelectedDayBills({
                      day: cell.day,
                      month: monthNames[month],
                      year,
                      bills: cell.bills,
                    });
                  } else {
                    setSelectedDayBills(null);
                  }
                }}
                className={`min-h-[42px] rounded-xl p-1 flex flex-col items-center justify-between transition cursor-pointer ${
                  !cell.isCurrentMonth
                    ? 'text-slate-300 dark:text-zinc-600 bg-transparent'
                    : hasBills
                    ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold shadow-2xs'
                    : cell.isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold'
                    : isSelected
                    ? 'bg-slate-200 dark:bg-zinc-700 border border-slate-400'
                    : 'bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span className="text-[11px] leading-tight">{cell.day}</span>
                {hasBills && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-2xs" />
                )}
                {hasBills && (
                  <span className="text-[8px] font-mono leading-none font-bold text-rose-600 dark:text-rose-300 truncate max-w-full">
                    {cell.bills[0].amount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Details Card or List of Upcoming Bills */}
        <div className="pt-2">
          {selectedDayBills ? (
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 animate-fadeIn">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/80 dark:border-rose-900/40">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {selectedDayBills.month} {selectedDayBills.day}, {selectedDayBills.year}
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  {selectedDayBills.bills.length} Due
                </span>
              </div>
              <div className="space-y-1.5 mt-2">
                {selectedDayBills.bills.map((b) => (
                  <div key={b.id || b.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-100">{b.name || b.title}</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatINRCurrencyNoDecimals(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-rose-500" />
                  <span>Scheduled Reminders</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {bills.length} Active
                </span>
              </div>
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {bills.slice(0, 4).map((b) => (
                  <div
                    key={b.id || b.name}
                    className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-zinc-100 truncate">{b.name || b.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-400">Due: {b.date || 'Monthly'}</p>
                    </div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatINRCurrencyNoDecimals(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Summary Bar */}
      <div className="bg-[#0F172A] text-white p-4 border-t border-slate-800 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            MONTHLY SCHEDULED DUE
          </p>
          <p className="text-xl font-mono font-black text-rose-400 tracking-tight">
            {formatINRCurrencyNoDecimals(
              bills.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
            )}
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          November 2026
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 3. TAB 3: NOTES (Header: NOTES - Persisted in sts_quick_notes_v1)
// ============================================================================
function NotesDrawerContent({ onClose }) {
  const STORAGE_KEY = 'sts_quick_notes_v1';

  const [notes, setNotes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sts_user_notes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'n-1',
        title: 'GST Reconciliation',
        content: 'Review input tax credit for November cycle before invoice clearance.',
        timestamp: 'Nov 23, 2026',
        category: 'Finance',
      },
      {
        id: 'n-2',
        title: 'Cloud Server Migration',
        content: 'Evaluate AWS vs Render instance costs for STS FINTECH core backend.',
        timestamp: 'Nov 24, 2026',
        category: 'Tech',
      },
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [search, setSearch] = useState('');

  // Persist notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn(e);
    }
  }, [notes]);

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    const note = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'Untitled Quick Note',
      content: newContent.trim(),
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: 'Quick',
    };

    setNotes((prev) => [note, ...prev]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  return (
    <div className="flex flex-col h-full justify-between bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/90">
        <div className="flex items-center space-x-2">
          <StickyNote className="w-4 h-4 text-rose-500" />
          <h2 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">
            NOTES
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search & Add Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center space-x-2 bg-white dark:bg-zinc-900">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((p) => !p)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
            isAdding
              ? 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Close' : 'New'}</span>
        </button>
      </div>

      {/* 3. Notes List & Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-[#090d16]/70">
        {/* Add Note Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateNote}
            className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-900/60 shadow-md space-y-2 animate-fadeIn"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
              autoFocus
            />
            <textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write quick thoughts, memo, or reminder..."
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition"
              >
                Save Note
              </button>
            </div>
          </form>
        )}

        {filteredNotes.length === 0 && !isAdding && (
          <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-zinc-500">
            <StickyNote className="w-8 h-8 mb-1.5 stroke-[1.5] text-slate-300 dark:text-zinc-600" />
            <p className="text-xs font-semibold">No notes found</p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Tap &quot;+ New&quot; to write a quick memo
            </p>
          </div>
        )}

        {/* Existing Notes */}
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="p-3 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs hover:shadow-xs transition group"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate pr-2">
                {note.title}
              </h4>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-0.5 rounded cursor-pointer"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {note.content && (
              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 mt-2.5 pt-1.5 border-t border-slate-100 dark:border-zinc-700/50">
              <span>{note.timestamp}</span>
              <span className="font-semibold text-rose-500 dark:text-rose-400">{note.category || 'Memo'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Bottom Summary Bar */}
      <div className="bg-[#0F172A] text-white p-4 border-t border-slate-800 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            LOCAL SCRATCHPAD
          </p>
          <p className="text-sm font-bold text-rose-400 tracking-tight">
            Persisted in sts_quick_notes_v1
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>
    </div>
  );
}
