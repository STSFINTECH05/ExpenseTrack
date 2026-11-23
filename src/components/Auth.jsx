import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import stsLogo from '../assets/sts-fintech-logo.png';
import apiClient from '../apiClient';

/**
 * Full-screen Black Cursive "Live-Writing" Multilingual Welcome Splash
 * Displays for 10 seconds strictly on new user sign-up completion.
 * Stacked typography written letter-by-letter with live typing cursor:
 * 1. 0.0s - 3.3s: English -> "Welcome" + "Welcome to STS FINTECH, {userName}"
 * 2. 3.3s - 6.6s: Tamil -> "வணக்கம்"
 * 3. 6.6s - 10.0s: Hindi -> "स्वागत है"
 */
function AppleWelcomeSplash({ user, fallbackName = '', onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const completedRef = useRef(false);

  const rawName = user?.name || fallbackName || 'Member';
  const userName = rawName.trim();

  // Letter arrays for authentic live penmanship / grapheme typing
  const englishLetters = useMemo(() => ['W', 'e', 'l', 'c', 'o', 'm', 'e'], []);
  const tamilLetters = useMemo(() => ['வ', 'ண', 'க்', 'க', 'ம்'], []);
  const hindiLetters = useMemo(() => ['स्वा', 'ग', 'त', ' ', 'है'], []);

  const triggerFinish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  }, [onComplete]);

  // Main 10s master timeline loop
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 10000;

    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      setElapsed(diff);

      if (diff >= totalDuration) {
        clearInterval(interval);
        triggerFinish();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [triggerFinish]);

  // English: 0.0s - 3.3s (letters type between 250ms and 2300ms)
  const isEnglishActive = elapsed < 3300;
  const englishTypedCount = useMemo(() => {
    if (elapsed < 250) return 0;
    if (elapsed >= 2300) return englishLetters.length;
    const progressInWindow = (elapsed - 250) / (2300 - 250);
    return Math.min(englishLetters.length, Math.floor(progressInWindow * englishLetters.length) + 1);
  }, [elapsed, englishLetters.length]);

  // Tamil: 3.3s - 6.6s (letters type between 3500ms and 5800ms)
  const isTamilStarted = elapsed >= 3300;
  const isTamilActive = elapsed >= 3300 && elapsed < 6600;
  const tamilTypedCount = useMemo(() => {
    if (elapsed < 3500) return 0;
    if (elapsed >= 5800) return tamilLetters.length;
    const progressInWindow = (elapsed - 3500) / (5800 - 3500);
    return Math.min(tamilLetters.length, Math.floor(progressInWindow * tamilLetters.length) + 1);
  }, [elapsed, tamilLetters.length]);

  // Hindi: 6.6s - 10.0s (letters type between 6800ms and 9100ms)
  const isHindiStarted = elapsed >= 6600;
  const isHindiActive = elapsed >= 6600 && elapsed < 10000;
  const hindiTypedCount = useMemo(() => {
    if (elapsed < 6800) return 0;
    if (elapsed >= 9100) return hindiLetters.length;
    const progressInWindow = (elapsed - 6800) / (9100 - 6800);
    return Math.min(hindiLetters.length, Math.floor(progressInWindow * hindiLetters.length) + 1);
  }, [elapsed, hindiLetters.length]);

  const progress = Math.min(100, (elapsed / 10000) * 100);

  // Helper renderer for each live-writing line
  const renderLiveLine = (letters, typedCount, isActive, isStarted) => {
    if (!isStarted) {
      return (
        <div className="opacity-0 pointer-events-none select-none py-1 min-h-[1.3em]">
          <span className="font-live-writing text-4xl sm:text-6xl md:text-7xl italic">
            {letters.join('')}
          </span>
        </div>
      );
    }

    return (
      <div className="opacity-100 transition-opacity duration-500 py-1 select-none min-h-[1.3em]">
        <div className="font-live-writing text-4xl sm:text-6xl md:text-7xl font-normal tracking-wide leading-relaxed text-white italic">
          {letters.map((char, idx) => {
            const isTyped = idx < typedCount;
            const isTip = idx === typedCount - 1;
            const displayChar = char === ' ' ? '\u00A0' : char;

            return (
              <React.Fragment key={idx}>
                <span
                  className={`transition-colors duration-150 ${
                    isTyped
                      ? 'text-white font-normal drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]'
                      : 'text-white/15'
                  }`}
                >
                  {displayChar}
                </span>
                {isActive && isTip && (
                  <span className="inline-block border-r-2 sm:border-r-[3px] border-white animate-pulse h-[0.8em] ml-0.5 align-middle pointer-events-none" />
                )}
              </React.Fragment>
            );
          })}
          {isActive && typedCount === 0 && (
            <span className="inline-block border-r-2 sm:border-r-[3px] border-white animate-pulse h-[0.8em] align-middle pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ willChange: 'opacity' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playball&family=Caveat:wght@600;700&display=swap');

        .font-live-writing {
          font-family: 'Great Vibes', 'Playball', 'Caveat', cursive, 'Brush Script MT', sans-serif;
          font-style: italic;
        }
      `}</style>

      {/* Stacked Live-Writing Typography Area */}
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-3xl space-y-2 sm:space-y-3 md:space-y-4">
        {/* Row 1: English ("Welcome") + Sub-label */}
        <div className="flex flex-col items-center justify-center">
          {renderLiveLine(englishLetters, englishTypedCount, isEnglishActive, true)}
          <div
            className={`text-xs sm:text-sm md:text-base text-white/50 tracking-wider font-sans mt-0.5 transition-all duration-700 ${
              englishTypedCount >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            Welcome to STS FINTECH, {userName}
          </div>
        </div>

        {/* Row 2: Tamil ("வணக்கம்") */}
        <div className="flex flex-col items-center justify-center">
          {renderLiveLine(tamilLetters, tamilTypedCount, isTamilActive, isTamilStarted)}
        </div>

        {/* Row 3: Hindi ("स्वागत है") */}
        <div className="flex flex-col items-center justify-center">
          {renderLiveLine(hindiLetters, hindiTypedCount, isHindiActive, isHindiStarted)}
        </div>
      </div>

      {/* Minimal Ultra-Thin Bottom Progress Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
        <div className="w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Subtle Skip Button in Bottom-Right Corner */}
      <button
        type="button"
        onClick={triggerFinish}
        className="absolute bottom-6 right-6 text-xs text-white/40 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-1 font-medium tracking-wide z-10 px-3 py-1.5 rounded-lg hover:bg-white/5"
        title="Skip to Dashboard"
      >
        <span>Skip</span>
        <span>→</span>
      </button>
    </div>
  );
}

export default function Auth({ initialMode = 'signin', onAuthSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status & Notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // New User Welcome Splash Screen States (Apple-Style 10s Splash strictly on Sign-Up)
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);
  const [signedUpUser, setSignedUpUser] = useState(null);

  // Switch between tabs
  const handleTabChange = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Handle Sign In submission
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = signInEmail.trim();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('Signing in to STS FINTECH Ledger...');

    try {
      const res = await apiClient.post('/api/auth/login', {
        email,
        password: signInPassword,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSuccessMsg(null);
        setErrorMsg(data.message || 'Invalid email or password.');
        return;
      }

      if (data.csrfToken) {
        apiClient.setCsrfToken(data.csrfToken);
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setSuccessMsg(null);
      setErrorMsg(err.message || 'Unable to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const name = signUpName.trim();
    const email = signUpEmail.trim();

    if (!name) {
      setErrorMsg('Please provide your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid work or personal email.');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 12) {
      setErrorMsg('Password must be at least 12 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to the STS Fintech terms and privacy policy.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('Account created successfully! Launching your ledger...');

    try {
      const res = await apiClient.post('/api/auth/register', {
        name,
        email,
        password: signUpPassword,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSuccessMsg(null);
        const fieldError = data.errors && data.errors.length > 0 ? data.errors[0].message : null;
        setErrorMsg(fieldError || data.message || 'Failed to create account.');
        return;
      }

      if (data.csrfToken) {
        apiClient.setCsrfToken(data.csrfToken);
      }

      // Display 10-second Apple-style multilingual welcome screen strictly on new user sign-up
      setSignedUpUser(data.user);
      setShowWelcomeSplash(true);
    } catch (err) {
      setSuccessMsg(null);
      setErrorMsg(err.message || 'Unable to connect to registration server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Demo Login
  const handleQuickDemo = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);
    setSuccessMsg('Launching demo account...');
    setIsSubmitting(true);

    try {
      const res = await apiClient.post('/api/auth/login', {
        email: 'demo@stsfintech.com',
        password: 'demo-password',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSuccessMsg(null);
        setErrorMsg(data.message || 'Unable to log into demo account.');
        return;
      }

      if (data.csrfToken) {
        apiClient.setCsrfToken(data.csrfToken);
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setSuccessMsg(null);
      setErrorMsg(err.message || 'Failed to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Full-Screen Black Apple-Style Multilingual Welcome Splash (10s strictly on Sign-Up) */}
      {showWelcomeSplash && (
        <AppleWelcomeSplash
          user={signedUpUser}
          fallbackName={signUpName}
          onComplete={() => {
            onAuthSuccess(signedUpUser);
          }}
        />
      )}

      {/* Subtle Light Ambient Background Tints */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-red-500/8 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:36px_36px] opacity-70" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <button
          onClick={onBackToLanding}
          className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={onBackToLanding}>
          <div className="h-8 w-8 rounded-lg overflow-hidden border border-emerald-500/40 bg-white p-0.5 flex items-center justify-center shadow-xs">
            <img src={stsLogo} alt="STS FINTECH Logo" className="h-full w-full object-cover rounded" />
          </div>
          <span className="text-sm font-black tracking-tight text-slate-900 hidden sm:inline">
            STS FINTECH
          </span>
        </div>

        <button
          onClick={handleQuickDemo}
          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Demo</span>
        </button>
      </header>

      {/* Main Container: Centered Single-Card View */}
      <main className="relative z-10 flex-1 w-full px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-lg relative">
              {/* Header Branding */}
              <div className="text-center space-y-3 mb-6">
                <div className="mx-auto w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/30 bg-white p-1 shadow-sm flex items-center justify-center">
                  <img
                    src={stsLogo}
                    alt="STS FINTECH"
                    className="h-full w-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {mode === 'signin'
                      ? 'Welcome back to STS FINTECH'
                      : 'Start tracking and segregating your wealth today'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {mode === 'signin'
                      ? 'Access your segregated accounts, active splits & wealth goals'
                      : 'Join the next generation of financial tracking and expense control'}
                  </p>
                </div>
              </div>

              {/* Segmented Control Switch Pill [ Sign In ] | [ Sign Up ] (Light gray bg-slate-100 with emerald active state) */}
              <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-1 mb-6">
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Feedback Alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN FORM */}
              {mode === 'signin' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="you@stsfintech.com"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title={showSignInPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Utilities Row: Remember me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button: "Sign In to Ledger" (Dark Emerald Green Fill #0d5236) */}
                  <button
                    type="submit"
                    style={{ backgroundColor: '#0d5236' }}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                  >
                    <span>Sign In to Ledger</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Quick Demo Access Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleQuickDemo}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-emerald-800 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quick Demo Access (Instant Preview)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: SIGN UP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Work / Personal Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Create Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="At least 12 characters"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSignUpConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>
                        I agree to STS Fintech terms and privacy policy
                      </span>
                    </label>
                  </div>

                  {/* Submit Button: "Create Free Account" (Dark Emerald Green Fill / Gradient) */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Quick Demo Access Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleQuickDemo}
                      className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-emerald-800 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Quick Demo Access (Skip Registration)</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
      </main>

      {/* Forgot Password Modal (Light Theme) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            {forgotSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs">
                Password reset link has been dispatched to your email address!
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered work or personal email address to receive password reset instructions.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@stsfintech.com"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.trim()) {
                      setForgotSuccess(true);
                      setTimeout(() => {
                        setShowForgotModal(false);
                        setForgotSuccess(false);
                      }, 2500);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Send Recovery Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
