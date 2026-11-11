import React from 'react';
import {
  LayoutDashboard,
  FileText,
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
      id: 'document',
      label: t('document', 'Document'),
      icon: FileText,
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
            (item.id === 'document' && (activeTab === 'document' || activeTab === 'documents')) ||
            (item.id === 'live_worth' && (activeTab === 'live_worth' || activeTab === 'live-worth')) ||
            (item.id === 'income-streams' && (activeTab === 'income-streams' || activeTab === 'income_streams')) ||
            (item.id === 'goal_target' && (activeTab === 'goal-target' || activeTab === 'goal_target')) ||
            (item.id === 'bills_reminders' && (activeTab === 'bill-reminder' || activeTab === 'bills-reminders')) ||
            (item.id === 'split_collect' && (activeTab === 'split-collect' || activeTab === 'split_collect')) ||
            (item.id === 'organisation_maintainer' && (activeTab === 'organisation_maintainer' || activeTab === 'organisation-maintainer'));

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                  {item.label}
                </span>
              </div>

              {isActive ? (
                <span className="w-2 h-2 rounded-full bg-white shadow-xs flex-shrink-0" />
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
          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
            activeTab === 'contact_us' || activeTab === 'contact'
              ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <Headset
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                activeTab === 'contact_us' || activeTab === 'contact' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span
              className={`text-xs truncate ${
                activeTab === 'contact_us' || activeTab === 'contact' ? 'text-white font-bold' : 'text-slate-300 font-medium'
              }`}
            >
              {t('contact_us', 'Contact Us')}
            </span>
          </div>
          {(activeTab === 'contact_us' || activeTab === 'contact') && (
            <span className="w-2 h-2 rounded-full bg-white shadow-xs flex-shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <SettingsIcon
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                activeTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span
              className={`text-xs truncate ${
                activeTab === 'settings' ? 'text-white font-bold' : 'text-slate-300 font-medium'
              }`}
            >
              {t('settings', 'Settings')}
            </span>
          </div>
          {activeTab === 'settings' && (
            <span className="w-2 h-2 rounded-full bg-white shadow-xs flex-shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
