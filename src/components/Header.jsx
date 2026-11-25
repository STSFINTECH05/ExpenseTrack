import React, { useState, useRef, useEffect, useMemo } from 'react';
import stsLogo from '../assets/sts-fintech-logofinal-removebg-preview.png';
import {
  Search,
  Bell,
  MoreVertical,
  User,
  Menu,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  HelpCircle,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Calculator as CalculatorIcon,
  Calendar as CalendarIcon,
  Crown,
  StickyNote,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Compass,
} from 'lucide-react';
import apiClient from '../apiClient';
import CalculatorModal from './CalculatorModal';
import CalendarModal from './CalendarModal';
import NotesModal from './NotesModal';
import LanguageDropdown from './LanguageDropdown';
import { useLanguage } from '../context/LanguageContext';

export default function Header({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeMainTab = 'Expense',
  setActiveMainTab,
  activeTab,
  setActiveTab,
  searchQuery = '',
  setSearchQuery,
  backendHealth,
  onToggleSidebar,
  currentUser,
  onOpenSettings,
  onOpenSubscription,
  onSignOut,
  onOpenUtility,
  onToggleUtilityDock,
  isUtilityDockOpen = false,
}) {
  let t = (key, fallback) => fallback || key;
  try {
    const lang = useLanguage();
    if (lang && typeof lang.t === 'function') {
      t = lang.t;
    }
  } catch (err) {
    console.warn('Header LanguageContext fallback:', err);
  }
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropdownDismissed, setIsDropdownDismissed] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const moreMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-focus search input when expanded
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Active subscription remaining days calculation
  const calculateDaysLeft = () => {
    try {
      const stored = localStorage.getItem('sts_active_subscription');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.daysLeft === 'number') {
          return Math.max(0, parsed.daysLeft);
        }
        if (parsed?.activatedAt) {
          const activatedTime = new Date(parsed.activatedAt).getTime();
          if (!isNaN(activatedTime)) {
            const diffMs = Date.now() - activatedTime;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return Math.max(0, 30 - diffDays);
          }
        }
      }
    } catch (e) {
      console.warn('Error calculating days left in Header:', e);
    }
    return 30;
  };

  const [daysLeft, setDaysLeft] = useState(calculateDaysLeft);

  useEffect(() => {
    const handleSubChange = () => {
      setDaysLeft(calculateDaysLeft());
    };
    window.addEventListener('sts_subscription_changed', handleSubChange);
    window.addEventListener('storage', handleSubChange);
    return () => {
      window.removeEventListener('sts_subscription_changed', handleSubChange);
      window.removeEventListener('storage', handleSubChange);
    };
  }, []);

  // Fetch segregation records and payments to populate global transaction search
  useEffect(() => {
    let isMounted = true;
    const loadSearchData = async () => {
      try {
        const [segRes, payRes] = await Promise.all([
          apiClient.get('/api/segregation').catch(() => null),
          apiClient.get('/api/payments').catch(() => null),
        ]);

        const items = [];
        if (segRes && segRes.ok) {
          const segJson = await segRes.json().catch(() => null);
          if (segJson && segJson.success && Array.isArray(segJson.data)) {
            segJson.data.forEach((r) => {
              items.push({
                id: `seg-${r.id || r.name}`,
                title: r.name || 'Untitled Entry',
                amount: Number(r.amount) || 0,
                category: (r.type || 'entry').replace('_', ' '),
                date: r.date || '',
                type: r.type?.includes('income') ? 'income' : 'expense',
                targetTab: 'segregation',
              });
            });
          }
        }

        if (payRes && payRes.ok) {
          const payJson = await payRes.json().catch(() => null);
          const payList = payJson?.success && Array.isArray(payJson?.data)
            ? payJson.data
            : Array.isArray(payJson)
            ? payJson
            : [];
          payList.forEach((p) => {
            items.push({
              id: `pay-${p.id || p.title}`,
              title: p.title || 'Payment',
              amount: Number(p.amount) || 0,
              category: p.category || 'Direct Payment',
              date: p.created_at ? p.created_at.split('T')[0] : '',
              type: 'expense',
              targetTab: 'dashboard',
            });
          });
        }

        if (isMounted && items.length > 0) {
          setTransactions(items);
        }
      } catch (err) {
        console.warn('Failed to load search data:', err);
      }
    };

    loadSearchData();
    const handleUpdate = () => loadSearchData();
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('sts_data_updated', handleUpdate);
    };
  }, []);

  // Active subscription plan helper
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
      console.warn('Header plan check:', e);
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

  // Defined quick navigation modules
  const navigationModules = useMemo(
    () => {
      const allModules = [
        { id: 'dashboard', label: 'Dashboard', keywords: ['dashboard', 'home', 'overview', 'summary', 'metrics'] },
        { id: 'financial_intelligence', label: 'Financial Intelligence', keywords: ['intelligence', 'analytics', 'savings rate', 'kpi', 'reports'] },
        { id: 'ai_financial_assistant', label: 'AI Financial Assistant', keywords: ['ai', 'assistant', 'chatbot', 'bot', 'advisor'] },
        { id: 'segregation', label: 'Expenses', keywords: ['expenses', 'segregation', 'fixed income', 'fixed expense', 'additional', 'ledger'] },
        { id: 'split_collect', label: 'Split & Collect', keywords: ['split', 'collect', 'shared', 'group', 'tickets'] },
        { id: 'goal_target', label: 'Goal Target', keywords: ['goal', 'target', 'savings', 'milestone', 'vault'] },
        { id: 'bills_reminders', label: 'Bill & Reminder', keywords: ['bill', 'bills', 'reminder', 'reminders', 'due', 'utility'] },
        { id: 'income-streams', label: 'Income Streams', keywords: ['income', 'streams', 'revenue', 'freelance', 'salary'] },
        { id: 'live_worth', label: 'Live Worth', keywords: ['live worth', 'net worth', 'assets', 'investments', 'stocks', 'gold'] },
        { id: 'organisation_maintainer', label: 'Organisation Maintainer', keywords: ['organisation', 'organization', 'staff', 'maintainer', 'payroll', 'employee'] },
        { id: 'contact_us', label: 'Contact Us', keywords: ['contact', 'help', 'support', 'email', 'phone'] },
        { id: 'settings', label: 'Settings', keywords: ['settings', 'preferences', 'profile', 'security', 'account'] },
      ];

      return allModules.filter((m) => {
        if (activePlan !== 'elite') {
          if (m.id === 'financial_intelligence' || m.id === 'income-streams') {
            return false;
          }
        }
        if (activePlan === 'silver') {
          return ['dashboard', 'segregation', 'split_collect', 'goal_target', 'bills_reminders', 'contact_us', 'settings'].includes(m.id);
        }
        return true;
      });
    },
    [activePlan]
  );

  // Filter matching navigation sections and transactions
  const searchResults = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return { modules: [], transactions: [] };

    const matchingModules = navigationModules.filter((m) =>
      m.label.toLowerCase().includes(q) || m.keywords.some((kw) => kw.includes(q))
    );

    const matchingTransactions = transactions.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.date && t.date.toLowerCase().includes(q)) ||
      String(t.amount).includes(q)
    );

    return {
      modules: matchingModules.slice(0, 4),
      transactions: matchingTransactions.slice(0, 6),
    };
  }, [searchQuery, navigationModules, transactions]);

  // Compute initials and identity dynamically based on currentUser
  const userEmail = currentUser?.email || 'admin@stsfintech.com';
  const displayEmail = userEmail && userEmail.length > 8 
    ? `${userEmail.slice(0, 8)}......` 
    : userEmail;
  const userName = currentUser?.name || 'Admin STS';
  const userRole = currentUser?.role || 'Finance Lead';
  const userInitials = useMemo(() => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return currentUser.name.slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      const namePart = currentUser.email.split('@')[0];
      return namePart.slice(0, 2).toUpperCase();
    }
    return 'SA';
  }, [currentUser]);

  // Sync avatar from localStorage or currentUser
  const [userAvatar, setUserAvatar] = useState(() => {
    try {
      return localStorage.getItem('sts_user_avatar') || currentUser?.avatar || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAvatarSync = () => {
      try {
        const stored = localStorage.getItem('sts_user_avatar') || currentUser?.avatar || null;
        setUserAvatar(stored);
      } catch (e) {
        console.warn(e);
      }
    };
    handleAvatarSync();
    window.addEventListener('sts_avatar_changed', handleAvatarSync);
    window.addEventListener('storage', handleAvatarSync);
    return () => {
      window.removeEventListener('sts_avatar_changed', handleAvatarSync);
      window.removeEventListener('storage', handleAvatarSync);
    };
  }, [currentUser]);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!searchQuery || !searchQuery.trim()) {
          setIsSearchOpen(false);
        }
        setIsDropdownDismissed(true);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDropdownDismissed(false);
        setShowMoreMenu(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]);

  const handleNavigateToModule = (moduleId) => {
    if (setActiveMainTab) setActiveMainTab('Expense');
    if (activePlan !== 'elite' && (moduleId === 'financial_intelligence' || moduleId === 'income-streams')) {
      if (setActiveTab) setActiveTab('subscription');
    } else {
      if (setActiveTab) setActiveTab(moduleId);
    }
    setIsSearchOpen(false);
    setIsDropdownDismissed(false);
  };

  const handleSelectTransaction = (item) => {
    if (setActiveMainTab) setActiveMainTab('Expense');
    if (setActiveTab) setActiveTab(item.targetTab || 'segregation');
    setIsSearchOpen(false);
    setIsDropdownDismissed(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchResults.modules.length > 0) {
        handleNavigateToModule(searchResults.modules[0].id);
      } else if (searchResults.transactions.length > 0) {
        handleSelectTransaction(searchResults.transactions[0]);
      } else {
        // Default to Expenses / Segregation
        if (setActiveMainTab) setActiveMainTab('Expense');
        if (setActiveTab) setActiveTab('segregation');
        setIsSearchOpen(false);
      }
    }
  };

  return (
    <header
      className="sticky top-0 z-40 bg-[#F2FBF7] dark:bg-[#18181B] backdrop-blur-xl border-b border-emerald-200/70 dark:border-zinc-800 shadow-xs w-full max-w-full transition-colors duration-200"
      style={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Full width horizontal flex container matching layout requirements */}
      <div
        className="px-2.5 sm:px-4 h-16 w-full flex items-center justify-between relative"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* ========================================================= */}
        {/* LEFT SECTION: Company Logo & Branding                     */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-shrink-0">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white bg-emerald-100/60 dark:bg-zinc-800 hover:bg-emerald-100 border border-emerald-200/80 dark:border-zinc-700/80 hover:border-emerald-300 dark:hover:border-zinc-600 transition cursor-pointer flex-shrink-0"
            aria-label="Toggle Navigation Menu"
            title="Open Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clickable Logo & Branding that toggles the sidebar */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center text-left focus:outline-none group cursor-pointer select-none overflow-visible py-1"
            title="Toggle Sidebar"
          >
            <img
              src={stsLogo}
              alt="STS FINTECH PVT LTD"
              className="h-7 sm:h-12 md:h-14 lg:h-16 w-auto max-w-[120px] sm:max-w-[180px] md:max-w-[210px] object-contain scale-100 md:scale-105 origin-left group-hover:scale-105 md:group-hover:scale-110 transition-all drop-shadow-xs shrink-0"
            />
          </button>
        </div>

        {/* ========================================================= */}
        {/* CENTER SECTION: Navigation Links ("Expense" & "Social")   */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center mx-1 sm:mx-2 md:mx-4">
          <nav
            className="flex items-center space-x-0.5 sm:space-x-1 bg-emerald-100/70 dark:bg-zinc-800/80 p-0.5 sm:p-1 rounded-xl border border-emerald-200/80 dark:border-zinc-700/80 shadow-inner"
            aria-label="Primary Navigation"
          >
            {/* Expense Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Expense')}
              className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Expense'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-200/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              Expense
            </button>

            {/* Wallet Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Wallet')}
              className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Wallet'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-200/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              Wallet
            </button>

            {/* Social Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Social')}
              className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Social'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-200/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              Social
            </button>
          </nav>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SECTION: Search Bar, Notifications, Profile, More   */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 flex-shrink-0">
          {/* 1. Search Bar */}
          <div className="relative" ref={searchContainerRef}>
            {!isSearchOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsDropdownDismissed(false);
                }}
                className="w-8 h-8 rounded-full bg-emerald-100/60 dark:bg-zinc-800/80 hover:bg-emerald-100 dark:hover:bg-zinc-700/80 border border-emerald-200/80 dark:border-zinc-700/70 hover:border-emerald-300 dark:hover:border-zinc-600 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-emerald-900 dark:hover:text-white transition shadow-xs cursor-pointer group"
                title="Search transactions"
                aria-label="Open search"
              >
                <Search className="w-4 h-4 text-slate-700 dark:text-zinc-300 group-hover:text-emerald-900 dark:group-hover:text-white transition-colors" />
              </button>
            ) : (
              /* Desktop inline search or Mobile full-width overlay bar */
              <div className="fixed md:relative inset-x-2 top-2 md:inset-auto md:top-auto z-50 md:z-auto flex items-center animate-fadeIn bg-white dark:bg-zinc-900 md:bg-transparent p-1.5 md:p-0 rounded-2xl md:rounded-none border border-emerald-200 dark:border-zinc-700 md:border-transparent shadow-2xl md:shadow-none">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 absolute left-4 md:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    if (setSearchQuery) setSearchQuery(e.target.value);
                    setIsDropdownDismissed(false);
                  }}
                  onFocus={() => {
                    setIsDropdownDismissed(false);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search transactions..."
                  className="w-full md:w-44 md:sm:w-56 md:lg:w-64 bg-white dark:bg-zinc-800/95 border border-emerald-200 dark:border-zinc-700 rounded-xl pl-9 md:pl-8 pr-8 py-2 md:py-1.5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (setSearchQuery) setSearchQuery('');
                    setIsSearchOpen(false);
                    setIsDropdownDismissed(false);
                  }}
                  className="absolute right-3.5 md:right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 p-1 md:p-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-zinc-700/60 transition cursor-pointer flex items-center justify-center"
                  title="Close search"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
                </button>
              </div>
            )}

            {/* Search Results Dropdown Popover */}
            {isSearchOpen && !isDropdownDismissed && searchQuery && searchQuery.trim() && (
              <div className="fixed md:absolute inset-x-2 md:inset-x-auto right-0 sm:left-0 sm:right-auto top-16 md:top-auto md:mt-2 w-auto md:w-80 max-w-[95vw] md:max-w-[90vw] rounded-2xl bg-white dark:bg-[#18181B] border border-emerald-200 dark:border-zinc-700 shadow-2xl py-3 px-3 z-50 animate-fadeIn divide-y divide-emerald-100 dark:divide-zinc-800">
                {/* Navigation Modules Section */}
                {searchResults.modules.length > 0 && (
                  <div className="pb-2.5">
                    <div className="flex items-center space-x-1.5 px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      <Compass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Navigation Modules</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.modules.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleNavigateToModule(m.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-zinc-800/90 text-slate-700 dark:text-zinc-200 hover:text-emerald-900 dark:hover:text-white transition flex items-center justify-between group cursor-pointer"
                        >
                          <span className="text-xs font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {m.label}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions Section */}
                {searchResults.transactions.length > 0 && (
                  <div className={searchResults.modules.length > 0 ? 'pt-2.5 pb-1' : 'pb-1'}>
                    <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      <span>Matching Transactions</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal">
                        {searchResults.transactions.length} found
                      </span>
                    </div>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {searchResults.transactions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTransaction(item)}
                          className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-zinc-800/90 transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-zinc-700/60"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                              <span className="capitalize">{item.category}</span>
                              {item.date && <span>• {item.date}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className={`text-xs font-mono font-bold ${
                                item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-200'
                              }`}
                            >
                              ₹{Number(item.amount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchResults.modules.length === 0 && searchResults.transactions.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                    <p className="font-semibold text-slate-700 dark:text-zinc-300">No matching transactions found</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Try searching with a title, category, or module name
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Global Language Selector Dropdown [ 🌐 English ▾ ] (hidden on mobile < sm to guarantee space for core actions) */}
          <div className="hidden sm:block">
            <LanguageDropdown variant="header" />
          </div>

          {/* 2. Notification Icon Button (compact on mobile) */}
          <div className="relative hidden xs:block" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-zinc-200 hover:text-emerald-900 dark:hover:text-white bg-emerald-100/60 dark:bg-zinc-800/80 hover:bg-emerald-100 dark:hover:bg-zinc-700/80 border border-emerald-200/80 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-zinc-600 transition shadow-xs cursor-pointer"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-slate-700 dark:text-zinc-200" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-xs shadow-red-500 animate-pulse" />
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0d1322] border border-emerald-200 dark:border-slate-800 shadow-2xl py-3 px-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/30 px-1.5 py-0.5 rounded">
                    Alert
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-slate-900/80 border border-emerald-100 dark:border-slate-800 text-[11px]">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">System Ledger Online</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      STS FINTECH database sync connected successfully.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-slate-900/80 border border-emerald-100 dark:border-slate-800 text-[11px]">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Payment Audit</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Segregation ledger auto-balanced for current cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Plans Circular Remaining Days Badge / Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSubscription) {
                onOpenSubscription();
              } else if (setActiveTab) {
                setActiveTab('subscription');
              }
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-all duration-200 cursor-pointer group shadow-xs hover:scale-105 active:scale-95 ${
              daysLeft > 0
                ? 'border-2 border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-400/10'
                : 'border-2 border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 bg-transparent'
            } ${
              activeTab === 'subscription'
                ? 'ring-2 ring-amber-500/60 ring-offset-1 ring-offset-emerald-50 dark:ring-offset-zinc-900 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                : ''
            }`}
            title={`${daysLeft} days left`}
            aria-label={`Subscription Plans (${daysLeft} days left)`}
          >
            {daysLeft}
          </button>

          {/* 3. Login Details / User Profile with Floating Dropdown Menu */}
          <div className="relative pl-1 sm:pl-2 border-l border-emerald-200/80 dark:border-zinc-700" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-emerald-100/60 dark:hover:bg-zinc-800 transition group cursor-pointer text-left"
              aria-label="User account menu"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/50 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-red-500 p-[1.5px] shadow-sm flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                    {userInitials}
                  </div>
                </div>
              )}
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 leading-tight" title={userEmail}>
                  {displayEmail}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 transition-transform hidden sm:block ${
                  showProfileMenu ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'group-hover:text-slate-800 dark:group-hover:text-white'
                }`}
              />
            </button>

            {/* Floating Profile Dropdown Menu Popup */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0d1322] border border-emerald-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn divide-y divide-emerald-100 dark:divide-slate-800/80">
                {/* Account Details Header */}
                <div className="p-3">
                  <div className="flex items-center space-x-3">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/60 shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 via-emerald-400 to-red-500 p-[1.5px] shadow-md flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-slate-100 dark:bg-[#090d16] flex items-center justify-center font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {userInitials}
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={userEmail}>
                        {userEmail}
                      </p>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Active Session
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manage Account Link (Navigates directly to Settings view) */}
                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-slate-700 dark:text-slate-200 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-slate-800/80 flex items-center space-x-2.5 transition group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100/70 dark:bg-slate-800 text-emerald-800 dark:text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-900 dark:group-hover:text-white">
                        {t('manage_account', 'Manage Account')}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Profile, password & theme</p>
                    </div>
                  </button>
                </div>

                {/* Sign Out Link (Clears active session & redirects to /login) */}
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onSignOut) onSignOut();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center space-x-2.5 transition group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/25 transition">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                        {t('sign_out', 'Sign Out')}
                      </p>
                      <p className="text-[10px] text-rose-500/70 dark:text-rose-400/70">Clear session & log out</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. More Options / Right Utility Dock Toggle Button (⋮) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (onToggleUtilityDock) {
                  onToggleUtilityDock();
                } else {
                  setShowMoreMenu(!showMoreMenu);
                }
              }}
              className={`p-2 rounded-xl transition shadow-xs cursor-pointer ${
                isUtilityDockOpen
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600'
                  : 'text-slate-700 hover:text-emerald-900 dark:text-zinc-200 dark:hover:text-white bg-emerald-100/60 hover:bg-emerald-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-emerald-200/80 hover:border-emerald-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
              title="Toggle Utility Sidebar (⋮)"
              aria-label="Toggle Utility Sidebar"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Financial Calendar Modal Integrated with Bill & Reminder */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      {/* Quick Notes & Records Modal */}
      <NotesModal
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
      />
    </header>
  );
}
