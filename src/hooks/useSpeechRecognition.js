/**
 * STS FINTECH PRIVATE LIMITED
 * Reusable Multilingual Speech Recognition Hook (Milestone 2 - Step 6)
 *
 * Implements Web Speech API SpeechRecognition supporting English (en-IN), Tamil (ta-IN),
 * and Hindi (hi-IN). Features cross-application singleton session management, race-condition
 * isolation, zero-duplication transcript processing, graceful pending-buffer flushing on stop,
 * and comprehensive error handling.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpeechRecognition } from '../components/VoiceMicControls';

// Module-level singleton tracker to guarantee only one active recognition session exists across the entire app
let activeGlobalRecognition = null;

export function useSpeechRecognition({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'error'
  const [error, setError] = useState(null);

  // Monotonically increasing session counter to isolate events from obsolete recognition instances
  const activeSessionIdRef = useRef(0);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  // Keep callback ref updated across renders
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition();

  // Cancel any active speech recognition and discard current recording
  const cancelListening = useCallback(() => {
    activeSessionIdRef.current += 1;

    if (activeGlobalRecognition) {
      try {
        activeGlobalRecognition.abort();
      } catch (e) {}
      activeGlobalRecognition = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    setIsListening(false);
    setInterimTranscript('');
    setStatus('idle');
  }, []);

  // Stop listening gracefully (allows browser to process pending speech buffer)
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    // Set status to processing while waiting for onresult/onend to finalize
    setStatus('processing');
  }, []);

  // Start speech recognition in the selected language with strict session isolation
  const startListening = useCallback(
    (lang = 'en-IN') => {
      setError(null);
      setInterimTranscript('');
      finalTranscriptRef.current = '';

      // Invalidate any pending callbacks from previous sessions
      activeSessionIdRef.current += 1;
      const currentSessionId = activeSessionIdRef.current;

      // Stop any other active voice sessions across the entire app
      if (activeGlobalRecognition) {
        try {
          activeGlobalRecognition.abort();
        } catch (e) {}
        activeGlobalRecognition = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const SpeechRec = getSpeechRecognition();
      if (!SpeechRec) {
        setStatus('error');
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = lang; // 'en-IN', 'ta-IN', or 'hi-IN'

        recognition.onstart = () => {
          if (activeSessionIdRef.current !== currentSessionId) return;
          setIsListening(true);
          setStatus('listening');
          activeGlobalRecognition = recognition;
        };

        recognition.onresult = (event) => {
          if (activeSessionIdRef.current !== currentSessionId) return;
          setStatus('processing');

          let fullFinal = '';
          let fullInterim = '';

          // Reconstruct final and interim transcripts from the complete results buffer
          // to eliminate word duplication across incremental events
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';

            if (result.isFinal) {
              fullFinal += (fullFinal ? ' ' : '') + text.trim();
            } else {
              fullInterim += (fullInterim ? ' ' : '') + text.trim();
            }
          }

          if (fullFinal && fullFinal !== finalTranscriptRef.current) {
            finalTranscriptRef.current = fullFinal;
            if (onTranscriptChangeRef.current) {
              onTranscriptChangeRef.current(fullFinal);
            }
          }

          setInterimTranscript(fullInterim);
        };

        recognition.onerror = (event) => {
          if (activeSessionIdRef.current !== currentSessionId) return;

          console.warn('[STS FINTECH AI Voice] SpeechRecognition error:', event.error);
          setIsListening(false);
          if (activeGlobalRecognition === recognition) {
            activeGlobalRecognition = null;
          }

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setStatus('error');
            setError('Microphone permission required. Please allow microphone access in your browser or device settings.');
          } else if (event.error === 'no-speech') {
            setStatus('error');
            setError('No speech was detected. Please check your microphone and try speaking again.');
          } else if (event.error === 'audio-capture') {
            setStatus('error');
            setError('Microphone not detected. Please verify your audio hardware is connected.');
          } else if (event.error === 'network') {
            setStatus('error');
            setError('Network error: Browser speech recognition service is temporarily unreachable.');
          } else if (event.error !== 'aborted') {
            setStatus('error');
            setError(`Speech recognition error: ${event.error}`);
          } else {
            // 'aborted' is a normal programmatic stop/cancel
            setStatus('idle');
          }
        };

        recognition.onend = () => {
          if (activeSessionIdRef.current !== currentSessionId) return;

          setIsListening(false);
          setInterimTranscript('');

          if (activeGlobalRecognition === recognition) {
            activeGlobalRecognition = null;
          }

          setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('[STS FINTECH AI Voice] Failed to start recognition:', err);
        if (activeSessionIdRef.current === currentSessionId) {
          setIsListening(false);
          setStatus('error');
          setError('Could not start speech recognition. Please check your browser permissions.');
        }
      }
    },
    []
  );

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      activeSessionIdRef.current += 1;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (activeGlobalRecognition === recognitionRef.current) {
        activeGlobalRecognition = null;
      }
    };
  }, []);

  return {
    isListening,
    interimTranscript,
    status,
    error,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    clearError: () => setError(null),
  };
}

export default useSpeechRecognition;
