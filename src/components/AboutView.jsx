import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Users2,
  PieChart,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Building2,
  CheckCircle2,
  Globe,
  HeartHandshake,
} from 'lucide-react';
import stsLogo from '../assets/sts-fintech-logo.png';

export default function AboutView({ onBackToDashboard, onNavigateToAuth, currentUser }) {
  const pillars = [
    {
      icon: Layers,
      title: 'Smart Tracking',
      description:
        'Effortless segregation of income streams and daily operational expenses. Gain immediate clarity with auto-categorization and smart ledger balancing.',
      badge: 'Income & Expense Segregation',
      color: 'emerald',
    },
    {
      icon: Users2,
      title: 'Collaborative Splits',
      description:
        'Fair group expense sharing with direct split-and-collect tracking. Settle shared peer tabs, team outings, and collaborative bills with zero friction.',
      badge: 'Peer & Group Finance',
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Growth & Live Worth',
      description:
        'Clear visibility into long-term savings goals, recurring bills, and real-time net worth calculation that updates dynamically as your assets evolve.',
      badge: 'Real-Time Valuation',
      color: 'teal',
    },
    {
      icon: ShieldCheck,
      title: 'Security & Privacy',
      description:
        'Dedicated multi-user data isolation, encrypted authorization tokens, and bank-grade privacy standards that keep your financial records strictly confidential.',
      badge: 'Isolated & Encrypted',
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-full pb-16 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a2318] to-[#07130e] text-white p-8 sm:p-12 border border-emerald-500/30 shadow-xl mb-10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Brand Tag */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Built under usemeta</span>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-lg border border-emerald-400/40 bg-white p-1 flex-shrink-0 flex items-center justify-center">
              <img
                src={stsLogo}
                alt="STS FINTECH Logo"
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                About STS FINTECH
              </h1>
              <p className="text-sm text-emerald-300 font-medium">
                Modern Financial Intelligence & Collaborative Ledger
              </p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed mt-4">
            <strong className="text-white font-bold">STS FINTECH</strong> was created under <strong className="text-emerald-300">usemeta</strong> to simplify personal and collaborative financial management. We believe financial tracking should be effortless, beautifully organized, and empowering for everyone.
          </p>
        </div>
      </div>

      {/* Core Purpose Section */}
      <div className="mb-12 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            <HeartHandshake className="w-4 h-4" />
            <span>Our Core Purpose</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            Removing the chaos from your financial life
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Managing personal money, shared obligations, and future goals often turns into a fragmented maze of spreadsheets, messaging apps, and missed deadlines.
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
            Our mission is to <strong className="text-slate-900 dark:text-slate-100">remove the chaos of tracking daily expenses, recurring bills, shared peer group splits, and net worth growth into one secure, unified workspace.</strong> Every payment recorded, every bill scheduled, and every asset valued works together in real time to give you complete financial peace of mind.
          </p>
        </div>
      </div>

      {/* Key Pillars Grid */}
      <div className="mb-12">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Core Foundations
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Built on Four Powerful Pillars
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Designed from the ground up for individual clarity and seamless collaborative teamwork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {pillar.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Commitment Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#0a2318]/60 dark:to-[#07130e]/80 border border-emerald-200 dark:border-emerald-800/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Your Data. Strictly Isolated. Never Compromised.
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Every ledger, split room, and asset valuation belongs exclusively to your authenticated account.
            </p>
          </div>
        </div>

        {onBackToDashboard ? (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 flex-shrink-0"
          >
            <span>Back to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : onNavigateToAuth ? (
          <button
            type="button"
            onClick={() => onNavigateToAuth('signup')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 flex-shrink-0"
          >
            <span>Get Started with STS FINTECH</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
