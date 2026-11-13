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
} from 'lucide-react';
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
  const moreMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

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

  // Close dropdowns on outside click
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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 bg-yellow-50/95 backdrop-blur-xl border-b border-yellow-200 shadow-xs w-full max-w-full"
      style={{
        backgroundColor: '#FEFCE8',
        borderColor: '#FEF08A',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Full width horizontal flex container matching layout requirements */}
      <div
        className="px-4 h-16 w-full flex items-center justify-between"
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
        <div className="flex items-center space-x-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-yellow-100/80 border border-yellow-200/80 hover:border-yellow-300 transition cursor-pointer flex-shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-600" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clickable Logo & Branding that toggles the sidebar */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center text-left focus:outline-none group cursor-pointer select-none"
            title="Toggle Sidebar"
          >
            <img
              src={stsLogo}
              alt="STS FINTECH PVT LTD"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-all"
            />
          </button>
        </div>

        {/* ========================================================= */}
        {/* CENTER SECTION: Navigation Links ("Expense" & "Social")   */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center mx-2 sm:mx-4">
          <nav
            className="flex items-center space-x-1 bg-yellow-100/70 p-1 rounded-xl border border-yellow-200 shadow-inner"
            aria-label="Primary Navigation"
          >
            {/* Expense Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Expense')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Expense'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-yellow-200/60'
              }`}
            >
              Expense
            </button>

            {/* Wallet Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Wallet')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Wallet'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-yellow-200/60'
              }`}
            >
              Wallet
            </button>

            {/* Social Tab */}
            <button
              type="button"
              onClick={() => setActiveMainTab && setActiveMainTab('Social')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeMainTab === 'Social'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-500/50'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-yellow-200/60'
              }`}
            >
              Social
            </button>
          </nav>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SECTION: Search Bar, Notifications, Profile, More   */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* 1. Search Bar */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-36 lg:w-48 bg-white/90 border border-yellow-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Global Language Selector Dropdown [ 🌐 English ▾ ] */}
          <LanguageDropdown variant="light" />

          {/* 2. Notification Icon Button */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-yellow-100/80 border border-yellow-200/80 hover:border-yellow-300 transition shadow-xs"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-xs shadow-red-500 animate-pulse" />
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl py-3 px-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  <span className="text-[10px] text-red-400 font-semibold bg-red-950/80 border border-red-500/30 px-1.5 py-0.5 rounded">
                    Alert
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-slate-200">System Ledger Online</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      STS FINTECH database sync connected successfully.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                    <p className="font-semibold text-slate-200">Payment Audit</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Segregation ledger auto-balanced for current cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Plans Icon Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSubscription) {
                onOpenSubscription();
              } else if (setActiveTab) {
                setActiveTab('subscription');
              }
            }}
            className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer group shadow-xs ${
              activeTab === 'subscription'
                ? 'text-emerald-700 bg-emerald-100/80 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-700 hover:text-emerald-700 bg-white/80 hover:bg-yellow-100/80 border-yellow-200/80 hover:border-emerald-500/50'
            }`}
            title="Subscription Plans"
            aria-label="Subscription Plans"
          >
            <Crown className="w-4 h-4 transition-transform group-hover:scale-110 text-slate-700 group-hover:text-emerald-700" />
          </button>

          {/* 3. Login Details / User Profile with Floating Dropdown Menu */}
          <div className="relative pl-1 sm:pl-2 border-l border-yellow-200" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-yellow-100/80 transition group cursor-pointer text-left"
              aria-label="User account menu"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-600/50 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-red-500 p-[1.5px] shadow-sm flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[11px] text-emerald-700">
                    {userInitials}
                  </div>
                </div>
              )}
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight" title={userEmail}>
                  {displayEmail}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform hidden sm:block ${
                  showProfileMenu ? 'rotate-180 text-emerald-600' : 'group-hover:text-slate-900'
                }`}
              />
            </button>

            {/* Floating Profile Dropdown Menu Popup */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn divide-y divide-slate-800/80">
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
                        <div className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center font-bold text-sm text-emerald-400">
                          {userInitials}
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{userName}</p>
                      <p className="text-[11px] text-slate-400 truncate" title={userEmail}>
                        {userEmail}
                      </p>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
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
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-white">
                        {t('manage_account', 'Manage Account')}
                      </p>
                      <p className="text-[10px] text-slate-400">Profile, password & theme</p>
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
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5 transition group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 group-hover:bg-rose-500/25 transition">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-rose-400 group-hover:text-rose-300">
                        {t('sign_out', 'Sign Out')}
                      </p>
                      <p className="text-[10px] text-rose-400/70">Clear session & log out</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. More Options Menu Button */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-yellow-100/80 border border-yellow-200/80 hover:border-yellow-300 transition shadow-xs"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 text-slate-700" />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl p-1.5 z-50 animate-fadeIn">
                {/* 1. Calculator Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCalculator(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition">
                    <CalculatorIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 group-hover:text-white">Calculator</p>
                    <p className="text-[10px] text-slate-400">Quick ledger math</p>
                  </div>
                </button>

                {/* 2. Calendar Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowCalendar(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition group cursor-pointer mt-0.5"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-rose-500/20 group-hover:text-rose-400 transition">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 group-hover:text-white">Calendar</p>
                    <p className="text-[10px] text-slate-400">Bill & reminder dates</p>
                  </div>
                </button>

                {/* 3. Notes Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowNotes(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2.5 transition group cursor-pointer mt-0.5"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 group-hover:text-white">Notes</p>
                    <p className="text-[10px] text-slate-400">Quick thoughts & records</p>
                  </div>
                </button>
              </div>
            )}
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
