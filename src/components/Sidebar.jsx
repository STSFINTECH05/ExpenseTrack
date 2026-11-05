import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Users2,
  Target,
  Bell,
  Headset,
  Settings as SettingsIcon,
  TrendingUp,
  Activity,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeTab, setActiveTab, backendHealth }) {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('Sidebar LanguageContext fallback:', err);
  }

  const primaryNavItems = [
    {
      id: 'dashboard',
      label: t('dashboard', 'Dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'segregation',
      label: t('expenses', 'Expenses'),
      icon: Layers,
    },
    {
      id: 'split_collect',
      label: t('split_collect', 'Split & Collect'),
      icon: Users2,
    },
    {
      id: 'goal_target',
      label: t('goal_target', 'Goal Target'),
      icon: Target,
    },
    {
      id: 'bills_reminders',
      label: t('bills_reminders', 'Bill & Reminder'),
      icon: Bell,
    },
    {
      id: 'income-streams',
      label: t('income_streams', 'Income Streams'),
      icon: TrendingUp,
    },
    {
      id: 'live_worth',
      label: t('live_worth', 'Live Worth'),
      icon: Activity,
    },
    {
      id: 'organisation_maintainer',
      label: t('organisation_maintainer', 'Organisation Maintainer'),
      icon: Building2,
    },
  ];

  return (
    <aside
      className="w-64 flex-shrink-0 bg-[#0d1322] border-r border-slate-800/80 flex flex-col justify-between overflow-y-auto"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Primary Navigation Links Grouped at Top */}
      <div className="p-3.5 space-y-1.5 flex-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'live_worth' && (activeTab === 'live_worth' || activeTab === 'live-worth')) ||
            (item.id === 'income-streams' && (activeTab === 'income-streams' || activeTab === 'income_streams')) ||
            (item.id === 'goal_target' && (activeTab === 'goal-target' || activeTab === 'goal_target')) ||
            (item.id === 'bills_reminders' && (activeTab === 'bill-reminder' || activeTab === 'bills-reminders')) ||
            (item.id === 'split_collect' && (activeTab === 'split-collect' || activeTab === 'split_collect')) ||
            (item.id === 'organisation_maintainer' && (activeTab === 'organisation_maintainer' || activeTab === 'organisation-maintainer'));

          const isStrategicAlert = item.id === 'bills_reminders' || item.id === 'live_worth';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#0a2f1d] text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-[#071f14]/70 border border-transparent hover:border-emerald-500/20'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition ${
                    isActive
                      ? 'bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-400/40'
                      : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'}`}>
                  {item.label}
                </span>
              </div>

              {/* Strategic markers in muted red or crimson */}
              {isActive ? (
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 via-rose-500 to-red-500 shadow-xs shadow-red-500/40 flex-shrink-0" />
              ) : isStrategicAlert ? (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 shadow-xs shadow-red-500/50 flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Pinned Links: Contact Us & Settings */}
      <div className="p-3.5 mt-auto pb-6 space-y-1.5 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('contact_us')}
          className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
            activeTab === 'contact_us' || activeTab === 'contact'
              ? 'bg-[#0a2f1d] text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-[#071f14]/70 border border-transparent hover:border-emerald-500/20'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 rounded-lg transition ${
                activeTab === 'contact_us' || activeTab === 'contact'
                  ? 'bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-400/40'
                  : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/60'
              }`}
            >
              <Headset className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-semibold ${
                activeTab === 'contact_us' || activeTab === 'contact' ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'
              }`}
            >
              {t('contact_us', 'Contact Us')}
            </span>
          </div>
          {(activeTab === 'contact_us' || activeTab === 'contact') && (
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 via-rose-500 to-red-500 shadow-xs shadow-red-500/40 flex-shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#0a2f1d] text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-[#071f14]/70 border border-transparent hover:border-emerald-500/20'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 rounded-lg transition ${
                activeTab === 'settings'
                  ? 'bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-400/40'
                  : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/60'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </div>
            <span
              className={`text-xs font-semibold ${
                activeTab === 'settings' ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'
              }`}
            >
              {t('settings', 'Settings')}
            </span>
          </div>
          {activeTab === 'settings' && (
            <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 via-rose-500 to-red-500 shadow-xs shadow-red-500/40 flex-shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
