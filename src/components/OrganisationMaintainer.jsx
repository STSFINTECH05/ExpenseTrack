import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  UserPlus,
  Search,
  Trash2,
  Phone,
  Briefcase,
  GraduationCap,
  Shield,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  IndianRupee,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Currency Formatter for Indian Rupees (₹XX,XXX.00)
const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

// Initial Sample Staff & Faculty Members
const INITIAL_MEMBERS = [
  {
    id: 'org_mem_1',
    name: 'Dr. Rajesh Kumar',
    contact: '+91 98450 12345',
    role: 'Faculty',
    baseSalary: 125000,
    additionalAllowance: 15000, // Research Grant / HOD Allowance
    additionalExpense: 4500, // Travel Reimbursement
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'org_mem_2',
    name: 'Ananya Sharma',
    contact: '+91 98201 54321',
    role: 'Administrative Staff',
    baseSalary: 65000,
    additionalAllowance: 5000, // Performance Incentive
    additionalExpense: 2000, // Office Reimbursement
    createdAt: '2026-02-01T10:15:00Z',
  },
  {
    id: 'org_mem_3',
    name: 'Vikramaditya Rao',
    contact: '+91 97110 98765',
    role: 'Technical Staff',
    baseSalary: 85000,
    additionalAllowance: 8000, // Cloud Ops & On-Call Allowance
    additionalExpense: 3500, // Equipment Allowance
    createdAt: '2026-02-18T11:45:00Z',
  },
  {
    id: 'org_mem_4',
    name: 'Muthu Vel',
    contact: '+91 94440 22334',
    role: 'Support Employee',
    baseSalary: 32000,
    additionalAllowance: 3000, // Overtime Allowance
    additionalExpense: 1200, // Field Conveyance
    createdAt: '2026-03-05T14:20:00Z',
  },
];

const ROLE_OPTIONS = [
  'Faculty',
  'Administrative Staff',
  'Technical Staff',
  'Support Employee',
];

export default function OrganisationMaintainer() {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('OrganisationMaintainer LanguageContext fallback:', err);
  }

  // Members State
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('sts_organisation_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading sts_organisation_members:', e);
    }
    return INITIAL_MEMBERS;
  });

  // Save to localStorage whenever members change
  useEffect(() => {
    try {
      localStorage.setItem('sts_organisation_members', JSON.stringify(members));
    } catch (e) {
      console.warn('Failed to persist organisation members:', e);
    }
  }, [members]);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    role: 'Faculty',
    baseSalary: '',
    additionalAllowance: '',
    additionalExpense: '',
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) setFormError(null);
  };

  const handleAddMember = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Please enter the employee or staff name.');
      return;
    }
    if (!formData.contact.trim()) {
      setFormError('Please enter a valid contact phone or mobile number.');
      return;
    }
    const base = parseFloat(formData.baseSalary);
    if (isNaN(base) || base < 0) {
      setFormError('Please enter a valid Base Monthly Salary in ₹.');
      return;
    }

    const allowance = parseFloat(formData.additionalAllowance) || 0;
    const expense = parseFloat(formData.additionalExpense) || 0;

    const newMember = {
      id: `org_mem_${Date.now()}`,
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      role: formData.role,
      baseSalary: base,
      additionalAllowance: allowance,
      additionalExpense: expense,
      createdAt: new Date().toISOString(),
    };

    setMembers((prev) => [newMember, ...prev]);
    showToast(`Added "${newMember.name}" to Organisation Maintainer.`);

    // Reset Form
    setFormData({
      name: '',
      contact: '',
      role: 'Faculty',
      baseSalary: '',
      additionalAllowance: '',
      additionalExpense: '',
    });
    setFormError(null);
  };

  const handleDeleteMember = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the organisation roster?`)) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showToast(`Removed "${name}" from organisation records.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset organisation records to default sample data?')) {
      setMembers(INITIAL_MEMBERS);
      showToast('Organisation records reset to defaults.');
    }
  };

  // Calculations for Top Metrics Strip
  const stats = useMemo(() => {
    let totalHeadcount = members.length;
    let basePayrollTotal = 0;
    let additionalCompExpensesTotal = 0;
    let netMonthlyOutflow = 0;

    members.forEach((m) => {
      const base = Number(m.baseSalary) || 0;
      const allowance = Number(m.additionalAllowance) || 0;
      const expense = Number(m.additionalExpense) || 0;
      const additional = allowance + expense;
      const net = base + additional;

      basePayrollTotal += base;
      additionalCompExpensesTotal += additional;
      netMonthlyOutflow += net;
    });

    return {
      totalHeadcount,
      basePayrollTotal,
      additionalCompExpensesTotal,
      netMonthlyOutflow,
    };
  }, [members]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      const matchesRole =
        selectedRoleFilter === 'All' || member.role === selectedRoleFilter;
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.contact.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [members, searchQuery, selectedRoleFilter]);

  // Role Badge Styling Helper
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Faculty':
        return {
          icon: GraduationCap,
          badgeClass:
            'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        };
      case 'Administrative Staff':
        return {
          icon: Shield,
          badgeClass:
            'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
        };
      case 'Technical Staff':
        return {
          icon: Wrench,
          badgeClass:
            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        };
      case 'Support Employee':
        return {
          icon: Briefcase,
          badgeClass:
            'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        };
      default:
        return {
          icon: Users,
          badgeClass:
            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER SECTION                                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Organisation Maintainer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage organizational staff, faculty, payroll structures, and additional compensations or expenses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isFormOpen ? 'Hide Entry Form' : 'Add New Member'}</span>
            {isFormOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
            title="Reset to default sample staff"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRICS STRIP                                                      */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Total Headcount
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-mono">
                {stats.totalHeadcount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Staff + Employees enrolled count</span>
          </div>
        </div>

        {/* Base Payroll Total (₹) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Base Payroll Total (₹)
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-mono">
                {formatINR(stats.basePayrollTotal)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span>Committed fixed salary baseline</span>
          </div>
        </div>

        {/* Additional Comp / Expenses Total (₹) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Additional Comp / Expenses Total (₹)
              </p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tracking-tight font-mono">
                {formatINR(stats.additionalCompExpensesTotal)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span>Allowances, bonuses & reimbursements</span>
          </div>
        </div>

        {/* Net Monthly Outflow (₹) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Net Monthly Outflow (₹)
              </p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 tracking-tight font-mono">
                {formatINR(stats.netMonthlyOutflow)}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-rose-600 dark:text-rose-400">
            <span>Total institutional payroll disbursement</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. STAFF / EMPLOYEE ENTRY FORM (Top Card)                                  */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <section className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm transition animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Staff / Employee Entry Form
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enroll staff and faculty members with tailored salary components and expense allocations
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              INR (₹)
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Dr. Rajesh Kumar, Admin Staff"
                  className="w-full bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  required
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="e.g., +91 98450 12345"
                  className="w-full bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition"
                />
              </div>

              {/* Category / Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Category / Role <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition font-medium"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role} className="bg-white dark:bg-[#0c1322] text-slate-900 dark:text-slate-100">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Base Monthly Salary */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Base Monthly Salary (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-mono font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleInputChange}
                    placeholder="e.g., 75000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition"
                  />
                </div>
              </div>

              {/* Additional Salary / Allowance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Additional Salary / Allowance (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-mono font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="additionalAllowance"
                    value={formData.additionalAllowance}
                    onChange={handleInputChange}
                    placeholder="Bonus, Overtime, Grant (e.g., 5000)"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">e.g., Bonus, Overtime, Research Grant</p>
              </div>

              {/* Additional Expense / Deductions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Additional Expense / Deductions (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-mono font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="additionalExpense"
                    value={formData.additionalExpense}
                    onChange={handleInputChange}
                    placeholder="Travel, Advance (e.g., 2000)"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white dark:focus:bg-[#0d1424] transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">e.g., Travel Expense Reimbursement, Advance Deduction</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    name: '',
                    contact: '',
                    role: 'Faculty',
                    baseSalary: '',
                    additionalAllowance: '',
                    additionalExpense: '',
                  })
                }
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Clear
              </button>

              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. SEARCH & TABLE / LIST VIEW                                             */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm space-y-4">
        {/* Table Top Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Organisation Roster & Payroll
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} displayed
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, phone, or role..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center overflow-x-auto space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
              {['All', ...ROLE_OPTIONS].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedRoleFilter === role
                      ? 'bg-white dark:bg-[#070b14] text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clean Fintech Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 font-semibold">Name</th>
                <th className="py-3 px-3 font-semibold">Contact Number</th>
                <th className="py-3 px-3 font-semibold">Role / Category</th>
                <th className="py-3 px-3 font-semibold text-right">Base Salary</th>
                <th className="py-3 px-3 font-semibold text-right">Additional Comp/Expense</th>
                <th className="py-3 px-3 font-semibold text-right">Net Payout</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        No organisation members found matching your search.
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRoleFilter('All');
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                        >
                          Clear search filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const roleStyle = getRoleBadgeStyle(member.role);
                  const RoleIcon = roleStyle.icon;
                  const addTotal =
                    (Number(member.additionalAllowance) || 0) +
                    (Number(member.additionalExpense) || 0);
                  const netPayout = (Number(member.baseSalary) || 0) + addTotal;

                  // Initials for avatar
                  const initials = member.name
                    ? member.name
                        .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '')
                        .trim()
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'OM';

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Name */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {member.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {member.id.replace('org_mem_', '#')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Number */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-xs">{member.contact}</span>
                        </div>
                      </td>

                      {/* Role / Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${roleStyle.badgeClass}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{member.role}</span>
                        </span>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatINR(member.baseSalary)}
                      </td>

                      {/* Additional Comp/Expense */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <p className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {formatINR(addTotal)}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          +₹{Number(member.additionalAllowance || 0).toLocaleString('en-IN')} allow. / +₹{Number(member.additionalExpense || 0).toLocaleString('en-IN')} exp.
                        </span>
                      </td>

                      {/* Net Payout */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-sm">
                        {formatINR(netPayout)}
                      </td>

                      {/* Action (Delete/Remove) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          title={`Remove ${member.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
