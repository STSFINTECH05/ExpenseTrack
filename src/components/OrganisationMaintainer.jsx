import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Search,
  Trash2,
  IndianRupee,
  Phone,
  Briefcase,
  TrendingUp,
  Receipt,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function OrganisationMaintainer() {
  const [members, setMembers] = useState(() => {
    try {
      const stored = localStorage.getItem('sts_org_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Faculty');
  const [role, setRole] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [additionalSalary, setAdditionalSalary] = useState('');
  const [expenses, setExpenses] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Currency Formatter
  const formatINR = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2
    })}`;
  };

  // Add Member Handler
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !baseSalary) return;

    const newMember = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role: role.trim() || category,
      category,
      baseSalary: parseFloat(baseSalary) || 0,
      additionalSalary: parseFloat(additionalSalary) || 0,
      expenses: parseFloat(expenses) || 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setMembers([newMember, ...members]);

    // Reset Form
    setName('');
    setPhone('');
    setRole('');
    setBaseSalary('');
    setAdditionalSalary('');
    setExpenses('');
    setShowAddModal(false);
  };

  // Delete Member Handler
  const handleDeleteMember = (id) => {
    if (window.confirm('Are you sure you want to remove this employee record?')) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [members, searchQuery, categoryFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalHeadcount = members.length;
    const totalBase = members.reduce((sum, m) => sum + m.baseSalary, 0);
    const totalAdditional = members.reduce((sum, m) => sum + m.additionalSalary, 0);
    const totalExpenses = members.reduce((sum, m) => sum + m.expenses, 0);
    const netPayout = totalBase + totalAdditional + totalExpenses;

    return { totalHeadcount, totalBase, totalAdditional, totalExpenses, netPayout };
  }, [members]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Organisation Maintainer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Staff &amp; employee directory, payroll structures, allowances, and departmental expenses
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Staff / Employee</span>
        </button>
      </div>

      {/* 2. Top Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Headcount</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalHeadcount} <span className="text-xs font-normal text-slate-400">Members</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Base Monthly Payroll */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Base Payroll</p>
            <h3 className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {formatINR(metrics.totalBase)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Additional Salary / Grants */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Allowances &amp; Extra</p>
            <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatINR(metrics.totalAdditional)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Net Monthly Outflow */}
        <div className="p-4 rounded-2xl bg-[#0c1322] border border-slate-800 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Net Outflow</p>
            <h3 className="text-xl font-black font-mono text-emerald-400 mt-1">
              {formatINR(metrics.netPayout)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Controls: Search, Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Faculty', 'Administrative Staff', 'Technical Staff', 'Support Employee'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${categoryFilter === cat
                ? 'bg-[#0d5236] text-white shadow-xs font-bold'
                : 'bg-white dark:bg-[#0c1322] text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, role..."
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30 transition shadow-xs"
          />
        </div>
      </div>

      {/* 4. Table / Directory View */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-[#080d19]/40">
                <th className="py-3.5 pl-4">Staff / Employee</th>
                <th className="py-3.5">Category &amp; Role</th>
                <th className="py-3.5">Base Salary</th>
                <th className="py-3.5">Additional Comp</th>
                <th className="py-3.5">Expense / Claim</th>
                <th className="py-3.5">Net Monthly Payout</th>
                <th className="py-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No staff or employee records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const net = member.baseSalary + member.additionalSalary + member.expenses;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors"
                    >
                      {/* Name & Phone */}
                      <td className="py-3 pl-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{member.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{member.phone}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Role */}
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {member.category}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{member.role}</p>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatINR(member.baseSalary)}
                      </td>

                      {/* Additional Salary */}
                      <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {member.additionalSalary > 0 ? `+${formatINR(member.additionalSalary)}` : '—'}
                      </td>

                      {/* Expenses / Reimbursements */}
                      <td className="py-3 font-mono text-amber-600 dark:text-amber-400">
                        {member.expenses > 0 ? `+${formatINR(member.expenses)}` : '—'}
                      </td>

                      {/* Net Monthly Payout */}
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(net)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right pr-4">
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          title="Remove record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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
      </div>

      {/* 5. Add Employee / Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1322] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Add New Staff / Employee
                  </h3>
                  <p className="text-xs text-slate-500">Record salary and compensation structures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Employee / Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98401 23456"
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  />
                </div>
              </div>

              {/* Category & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Administrative Staff">Administrative Staff</option>
                    <option value="Technical Staff">Technical Staff</option>
                    <option value="Support Employee">Support Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Lab In-Charge, Asst. Professor"
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  />
                </div>
              </div>

              {/* Base Salary */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Base Monthly Salary (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                />
              </div>

              {/* Additional Salary & Expenses Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Additional Salary / Bonus (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={additionalSalary}
                    onChange={(e) => setAdditionalSalary(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Overtime, research grant, bonus</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Additional Expenses / Claim (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Travel reimbursement, supplies</p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}