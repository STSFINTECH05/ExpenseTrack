import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeTab, setActiveTab, backendHealth, currentUser }) {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('Sidebar LanguageContext fallback:', err);
  }

  const getNormalizedPlan = () => {
    try {
      const userPlan = currentUser?.subscription?.name || currentUser?.subscription?.id || currentUser?.subscription || currentUser?.plan;
      if (typeof userPlan === 'string') {
        const lower = userPlan.toLowerCase();
        if (lower.includes('silver')) return 'silver';
        if (lower.includes('elite')) return 'elite';
        if (lower.includes('gold')) return 'gold';
      }
      const stored = localStorage.getItem('sts_active_subscription');
      if (stored) {
        const parsed = JSON.parse(stored);
        const str = (parsed?.id || parsed?.name || '').toLowerCase();
        if (str.includes('silver')) return 'silver';
        if (str.includes('elite')) return 'elite';
        if (str.includes('gold')) return 'gold';
      }
    } catch (e) {
      console.warn('Sidebar plan check:', e);
    }
    return 'gold';
  };

  const [activePlan, setActivePlan] = useState(getNormalizedPlan);

  useEffect(() => {
    setActivePlan(getNormalizedPlan());
  }, [currentUser]);

  useEffect(() => {
    const handleSubChange = () => {
      setActivePlan(getNormalizedPlan());
    };
    window.addEventListener('sts_subscription_changed', handleSubChange);
    window.addEventListener('storage', handleSubChange);
    return () => {
      window.removeEventListener('sts_subscription_changed', handleSubChange);
      window.removeEventListener('storage', handleSubChange);
    };
  }, [currentUser]);

  const primaryNavItems = [
    {
      id: 'dashboard',
      label: t('dashboard', 'Dashboard'),
    },
    {
      id: 'financial_intelligence',
      label: t('financial_intelligence', 'Financial Intelligence'),
    },
    {
      id: 'ai_financial_assistant',
      label: t('ai_financial_assistant', 'AI Financial Assistant'),
    },
    {
      id: 'segregation',
      label: t('expenses', 'Expenses'),
    },
    {
      id: 'split_collect',
      label: t('split_collect', 'Split & Collect'),
    },
    {
      id: 'goal_target',
      label: t('goal_target', 'Goal Target'),
    },
    {
      id: 'bills_reminders',
      label: t('bills_reminders', 'Bill & Reminder'),
    },
    {
      id: 'income-streams',
      label: t('income_streams', 'Income Streams'),
    },
    {
      id: 'live_worth',
      label: t('live_worth', 'Live Worth'),
    },
    {
      id: 'organisation_maintainer',
      label: t('organisation_maintainer', 'Organisation Maintainer'),
    },
  ];

  const visibleNavItems = primaryNavItems.filter((item) => {
    // Both Financial Intelligence and Income Streams are hidden for Silver and Gold, accessible exclusively on Elite
    if (activePlan !== 'elite') {
      if (item.id === 'financial_intelligence' || item.id === 'income-streams') {
        return false;
      }
    }

    if (activePlan === 'silver') {
      return [
        'dashboard',
        'segregation',
        'split_collect',
        'goal_target',
        'bills_reminders',
      ].includes(item.id);
    }
    // Gold plan (and non-silver/non-elite)
    if (activePlan === 'gold') {
      return item.id !== 'income-streams' && item.id !== 'financial_intelligence';
    }
    // Elite plan: show all
    return true;
  });

  return (
    <aside
      className="w-full h-full md:w-64 flex-shrink-0 bg-[#18181B] border-r border-zinc-800 flex flex-col justify-between overflow-y-auto"
      style={{ minHeight: '100%' }}
    >
      {/* Primary Navigation Links Grouped at Top */}
      <div className="p-3.5 space-y-1.5 flex-1">
        {visibleNavItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'financial_intelligence' && (activeTab === 'financial_intelligence' || activeTab === 'financial-intelligence')) ||
            (item.id === 'ai_financial_assistant' && (activeTab === 'ai_financial_assistant' || activeTab === 'ai-financial-assistant' || activeTab === 'ai_chatbot' || activeTab === 'ai-chatbot')) ||
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
              className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#0a2f1d] text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-[#071f14]/70 border border-transparent hover:border-emerald-500/20'
              }`}
            >
              <div className="flex items-center min-w-0">
                <span className={`text-xs font-semibold truncate ${isActive ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'}`}>
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Pinned Links: Contact Us & Settings */}
      <div className="p-3.5 mt-auto pb-6 space-y-1.5 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('contact_us')}
          className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
            activeTab === 'contact_us' || activeTab === 'contact'
              ? 'bg-[#0a2f1d] text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-[#071f14]/70 border border-transparent hover:border-emerald-500/20'
          }`}
        >
          <div className="flex items-center min-w-0">
            <span
              className={`text-xs font-semibold ${
                activeTab === 'contact_us' || activeTab === 'contact' ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'
              }`}
            >
              {t('contact_us', 'Contact Us')}
            </span>
          </div>
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
          <div className="flex items-center min-w-0">
            <span
              className={`text-xs font-semibold ${
                activeTab === 'settings' ? 'text-emerald-300 font-bold' : 'text-slate-300 group-hover:text-slate-100'
              }`}
            >
              {t('settings', 'Settings')}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
