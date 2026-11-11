/**
 * STS FINTECH PRIVATE LIMITED
 * Multilingual Text-to-Speech (TTS) Hook (Milestone 2 - Step 6)
 *
 * Implements browser SpeechSynthesis supporting English (en-IN), Tamil (ta-IN),
 * and Hindi (hi-IN). Features dynamic voice detection with strict Indian English
 * priority, markdown and financial currency cleanup, session-isolated concurrency
 * control to prevent stale callback leaks, and persistent auto-voice preferences.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Strips markdown formatting, links, and code blocks to produce natural speech
 * and converts currency symbols into spoken terms based on the target language.
 */
export function cleanTextForSpeech(text, lang = 'en-IN') {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove markdown code blocks and inline code
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove bold and italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove headers (# Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove list markers
    .replace(/^[\s-]*[•\-\*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Normalize currency symbols to spoken words based on language
    .replace(/₹\s*([0-9,.]+)/g, (match, amount) => {
      if (lang === 'ta-IN') return `${amount} ரூபாய்`;
      if (lang === 'hi-IN') return `${amount} रुपये`;
      return `${amount} Rupees`;
    })
    .replace(/₹/g, lang === 'ta-IN' ? 'ரூபாய்' : lang === 'hi-IN' ? 'रुपये' : 'Rupees')
    // Normalize excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best installed voice for the specified language code following strict priority:
 * 1. Exact locale match (e.g. 'en-in', 'ta-in', 'hi-in').
 * 2. Indian English voice preference for English ('en-in' or 'en'), including recognized
 *    Indian voice names such as Rishi, Veena, Neerja, and Prabhat.
 * 3. General English fallback for English requests (e.g. en-GB, en-US).
 * 4. Matching language-prefix fallback for Tamil and Hindi ('ta-*', 'hi-*').
 * 5. Return null if no matching language voice exists (never select an unrelated language).
 */
export function getVoiceForLanguage(voices, langCode = 'en-IN') {
  if (!voices || voices.length === 0) return null;

  const normTarget = langCode.toLowerCase().replace('_', '-');
  const langPrefix = normTarget.split('-')[0];

  // 1. Exact locale match (e.g. 'en-in', 'ta-in', 'hi-in')
  const exactMatch = voices.find(
    (v) => (v.lang || '').toLowerCase().replace('_', '-') === normTarget
  );
  if (exactMatch) return exactMatch;

  // 2. English priority: If targeting English, look specifically for Indian English voices
  if (normTarget === 'en-in' || langPrefix === 'en') {
    const indianEnglishVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      const isEnglish = vLang.startsWith('en');
      const hasIndianLocale = vLang.split('-')[1] === 'in';
      const hasIndianName =
        vName.includes('india') ||
        vName.includes('indian') ||
        vName.includes('rishi') ||
        vName.includes('veena') ||
        vName.includes('neerja') ||
        vName.includes('prabhat');

      return isEnglish && (hasIndianLocale || hasIndianName);
    });

    if (indianEnglishVoice) return indianEnglishVoice;

    // Fall back to any English voice (e.g. en-GB, en-US)
    const anyEnglishVoice = voices.find((v) =>
      (v.lang || '').toLowerCase().replace('_', '-').startsWith('en')
    );
    if (anyEnglishVoice) return anyEnglishVoice;
  }

  // 3. Language prefix match (e.g. any Tamil 'ta-*' or Hindi 'hi-*' voice)
  const langPrefixMatch = voices.find((v) =>
    (v.lang || '').toLowerCase().replace('_', '-').startsWith(langPrefix)
  );
  if (langPrefixMatch) return langPrefixMatch;

  // 4. No matching language voice found (do NOT select an unrelated language)
  return null;
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [voices, setVoices] = useState([]);
  const [voiceError, setVoiceError] = useState(null);

  // Auto-speak preference persisted in localStorage
  const [autoSpeak, setAutoSpeak] = useState(() => {
    try {
      return localStorage.getItem('sts_ai_auto_speak') === 'true';
    } catch (e) {
      return false; // Disabled by default
    }
  });

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Monotonically increasing session counter to isolate utterance lifecycle events
  const activeSessionIdRef = useRef(0);
  const utteranceRef = useRef(null);

  // Load and cache browser voices reliably without clobbering external listeners
  useEffect(() => {
    if (!isSupported) return;

    let isMounted = true;

    const updateVoices = () => {
      if (!isMounted) return;
      try {
        const available = window.speechSynthesis.getVoices() || [];
        if (available.length > 0 && isMounted) {
          setVoices(available);
        }
      } catch (e) {
        console.warn('[STS FINTECH TTS] Error retrieving voices:', e);
      }
    };

    // Initial voice query
    updateVoices();

    const synth = window.speechSynthesis;
    let fallbackCleanup = null;

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', updateVoices);
    } else if ('onvoiceschanged' in synth) {
      // Safe chaining fallback for environments lacking addEventListener on SpeechSynthesis
      const originalHandler = synth.onvoiceschanged;
      const chainedHandler = (event) => {
        if (typeof originalHandler === 'function') {
          try {
            originalHandler.call(synth, event);
          } catch (e) {
            console.warn('[STS FINTECH TTS] Previous voiceschanged handler failed:', e);
          }
        }
        updateVoices();
      };

      synth.onvoiceschanged = chainedHandler;

      fallbackCleanup = () => {
        if (synth.onvoiceschanged === chainedHandler) {
          synth.onvoiceschanged = originalHandler || null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', updateVoices);
      } else if (fallbackCleanup) {
        fallbackCleanup();
      }
    };
  }, [isSupported]);

  // Stop any active speech and invalidate in-flight callbacks
  const stopSpeaking = useCallback(() => {
    if (!isSupported) return;

    // Increment session counter so any asynchronous callbacks from the canceled utterance are ignored
    activeSessionIdRef.current += 1;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    setIsSpeaking(false);
    setSpeakingId(null);
  }, [isSupported]);

  // Speak a message with strict session isolation
  const speak = useCallback(
    ({ id = null, text, lang = 'en-IN', onStart, onEnd, onError }) => {
      if (!isSupported) {
        setVoiceError('Speech synthesis is not supported in this browser.');
        return;
      }

      setVoiceError(null);

      // Cancel previous speech and increment session counter
      activeSessionIdRef.current += 1;
      const currentSessionId = activeSessionIdRef.current;

      try {
        window.speechSynthesis.cancel();
      } catch (e) {}

      setIsSpeaking(false);
      setSpeakingId(null);

      const cleaned = cleanTextForSpeech(text, lang);
      if (!cleaned) return;

      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const bestVoice = getVoiceForLanguage(voices, lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        utterance.onstart = () => {
          // Reject stale callback if a newer speech session was initiated or stopSpeaking was called
          if (activeSessionIdRef.current !== currentSessionId) return;
          setIsSpeaking(true);
          setSpeakingId(id);
          if (onStart) onStart();
        };

        utterance.onend = () => {
          // Reject stale callback
          if (activeSessionIdRef.current !== currentSessionId) return;
          setIsSpeaking(false);
          setSpeakingId(null);
          if (onEnd) onEnd();
        };

        utterance.onerror = (event) => {
          // Reject stale callback
          if (activeSessionIdRef.current !== currentSessionId) return;

          setIsSpeaking(false);
          setSpeakingId(null);

          // 'canceled' and 'interrupted' are expected when user stops or switches speech
          if (event.error === 'canceled' || event.error === 'interrupted') {
            return;
          }

          console.warn('[STS FINTECH TTS] Speech error:', event.error);

          if (event.error === 'language-unavailable') {
            const langLabel =
              lang === 'ta-IN' ? 'Tamil' : lang === 'hi-IN' ? 'Hindi' : 'English (India)';
            setVoiceError(`Voice for ${langLabel} is not installed on this device.`);
          } else {
            setVoiceError(`Audio playback error: ${event.error}`);
          }

          if (onError) onError(event);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[STS FINTECH TTS] Speak failed:', err);
        if (activeSessionIdRef.current === currentSessionId) {
          setIsSpeaking(false);
          setSpeakingId(null);
          setVoiceError('Failed to initialize speech playback.');
        }
      }
    },
    [isSupported, voices, stopSpeaking]
  );

  // Toggle Auto-Speak Setting
  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sts_ai_auto_speak', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        activeSessionIdRef.current += 1;
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    speakingId,
    autoSpeak,
    voiceError,
    isSupported,
    hasVoiceForLang: (lang) => {
      if (!isSupported || voices.length === 0) return false;
      return !!getVoiceForLanguage(voices, lang);
    },
    speak,
    stopSpeaking,
    toggleAutoSpeak,
    clearVoiceError: () => setVoiceError(null),
  };
}

export default useSpeechSynthesis;
