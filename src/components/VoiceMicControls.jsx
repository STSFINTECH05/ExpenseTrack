import React from 'react';
import { Mic, MicOff, Globe, Radio, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

// =============================================================================
// Supported Voice Recognition Languages (Milestone 1)
// =============================================================================
export const VOICE_LANGUAGES = [
  {
    code: 'en-IN',
    label: 'English (India)',
    nativeLabel: 'English',
    short: 'EN (IN)',
    flag: '🇮🇳',
    placeholder: 'Speak in English (e.g. Goa Trip, Dinner with Rahul)...',
  },
  {
    code: 'ta-IN',
    label: 'Tamil (தமிழ்)',
    nativeLabel: 'தமிழ்',
    short: 'தமிழ்',
    flag: '🇮🇳',
    placeholder: 'தமிழில் பேசவும் (எ.கா. கோவா பயணம், மதிய உணவு)...',
  },
  {
    code: 'hi-IN',
    label: 'Hindi (हिन्दी)',
    nativeLabel: 'हिन्दी',
    short: 'हिन्दी',
    flag: '🇮🇳',
    placeholder: 'हिन्दी में बोलें (उदा. गोवा ट्रिप, दोपहर का भोजन)...',
  },
];

// Helper to check SpeechRecognition availability
export const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

// =============================================================================
// Language Selector Bar Component
// =============================================================================
export function VoiceLanguageSelector({ selectedLang, onSelectLang, className = '' }) {
  return (
    <div
      className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200/80 dark:border-slate-800 transition ${className}`}
    >
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wide">
        <Globe className="w-3.5 h-3.5 text-[#0d5236] dark:text-emerald-400" />
        <span>Voice Language:</span>
      </div>
      <div className="flex items-center gap-1">
        {VOICE_LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelectLang(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-[#0d5236] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title={`Switch voice recognition to ${lang.label}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Voice Microphone Button Component (for inputs)
// =============================================================================
export function VoiceMicButton({
  isListening,
  onClick,
  title = 'Voice dictation',
  className = '',
  size = 'md',
}) {
  const isSm = size === 'sm';
  const btnSize = isSm ? 'p-1.5' : 'p-2';
  const iconSize = isSm ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${btnSize} rounded-lg transition-all flex items-center justify-center cursor-pointer ${
        isListening
          ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
          : 'bg-emerald-50 dark:bg-emerald-950/70 text-[#0d5236] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
      } ${className}`}
      title={isListening ? 'Stop voice recognition' : title}
      aria-label={isListening ? 'Stop voice recognition' : title}
    >
      {isListening ? (
        <MicOff className={iconSize} />
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  );
}

// =============================================================================
// Voice Status and Error Banner Component
// =============================================================================
export function VoiceStatusBanner({
  activeField,
  targetField,
  status,
  message,
  onStop,
  onDismiss,
}) {
  if (activeField !== targetField && status !== 'error' && status !== 'success') {
    return null;
  }

  // Only render for target field when active or when this specific field was targeted
  if (activeField !== targetField && (status === 'error' || status === 'success')) {
    return null;
  }

  if (status === 'listening') {
    return (
      <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="font-medium">{message || 'Listening...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-1"></span>
            <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-2"></span>
            <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-3"></span>
          </div>
          <button
            type="button"
            onClick={onStop}
            className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-200 hover:underline cursor-pointer ml-1"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-700 dark:text-amber-300 animate-fadeIn">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        <span className="font-medium">{message || 'Processing speech...'}</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium">{message || 'Speech recognized successfully'}</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer ml-2"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="font-medium break-words">{message}</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-rose-700 hover:text-rose-900 cursor-pointer ml-2"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return null;
}
