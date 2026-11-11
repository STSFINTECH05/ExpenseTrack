/**
 * STS FINTECH PRIVATE LIMITED
 * AI Financial Assistant Chatbot Interface (Milestone 2 - Step 5)
 *
 * Dedicated conversational interface connected to live GroqCloud GPT-OSS-20B backend.
 * Provides grounded, multi-turn personal financial advisory in English, Tamil, and Hindi.
 * Features conversation history persistence, financial data cards, and suggested queries.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  History,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Layers,
  PieChart,
  ArrowRight,
  Clock,
  User,
  ChevronRight,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import apiClient from '../apiClient';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

// Currency Formatter for Indian Rupees (₹)
const formatINR = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

// Supported Languages with Native Script Labels
const CHAT_LANGUAGES = [
  { code: 'en-IN', label: 'English', native: 'English', flag: '🌐' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
];

// Suggested Financial Questions (Section 8)
const SUGGESTED_QUESTIONS = [
  { id: 1, text: 'Analyse my spending this month.', icon: TrendingUp },
  { id: 2, text: 'How much did I spend in the last 30 days?', icon: IndianRupee },
  { id: 3, text: 'Where do I spend the most?', icon: PieChart },
  { id: 4, text: 'Show my total income.', icon: TrendingUp },
  { id: 5, text: 'How much did I save this month?', icon: ShieldCheck },
  { id: 6, text: 'Compare my current and previous month.', icon: Layers },
  { id: 7, text: 'Which category has increased the most?', icon: TrendingDown },
  { id: 8, text: 'Give me savings recommendations.', icon: Sparkles },
];

export default function AIFinancialChatbot() {
  const { currentLanguage } = useLanguage() || { currentLanguage: 'en' };

  // Map application language to chatbot language code
  const getInitialLanguage = () => {
    if (currentLanguage === 'ta' || currentLanguage === 'ta-IN') return 'ta-IN';
    if (currentLanguage === 'hi' || currentLanguage === 'hi-IN') return 'hi-IN';
    return 'en-IN';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile history drawer
  const [errorMessage, setErrorMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState(null); // { available, model, provider }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recordingBaseTextRef = useRef('');

  // Multilingual Speech Recognition (STT) Hook (Milestone 2 - Step 6)
  const {
    isListening,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    cancelListening,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    onTranscriptChange: (recognizedText) => {
      const base = recordingBaseTextRef.current ? recordingBaseTextRef.current.trim() : '';
      const combined = base ? `${base} ${recognizedText.trim()}` : recognizedText.trim();
      setInputText(combined);
    },
  });

  // Multilingual Text-to-Speech (TTS) Hook (Milestone 2 - Step 6)
  const {
    isSpeaking,
    speakingId,
    autoSpeak,
    voiceError,
    isSupported: isTtsSupported,
    speak,
    stopSpeaking,
    toggleAutoSpeak,
    clearVoiceError,
  } = useSpeechSynthesis();

  // Voice Recording Toggle Handler
  const handleToggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
      if (inputRef.current) inputRef.current.focus();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      clearSpeechError();
      clearVoiceError();
      recordingBaseTextRef.current = inputText;
      startListening(selectedLanguage);
    }
  };

  const handleCancelVoiceRecording = () => {
    cancelListening();
    setInputText(recordingBaseTextRef.current);
    if (inputRef.current) inputRef.current.focus();
  };

  // Sync language if global app language changes and user hasn't explicitly customized
  useEffect(() => {
    setSelectedLanguage(getInitialLanguage());
  }, [currentLanguage]);

  // Auto-scroll messages container to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Check Backend AI Health on mount
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await apiClient.get('/api/ai/health');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBackendStatus(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (isMounted) setBackendStatus({ available: false, error: errData.error || 'UNAVAILABLE' });
        }
      } catch (err) {
        if (isMounted) setBackendStatus({ available: false, error: 'NETWORK_ERROR' });
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Conversation History
  const fetchConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await apiClient.get('/api/ai/conversations');
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data || []);
      }
    } catch (err) {
      console.warn('[STS FINTECH AI Chat] Failed to load conversations:', err.message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load a Specific Conversation Thread
  const loadConversationMessages = async (convId) => {
    if (!convId) return;
    stopSpeaking();
    cancelListening();
    setIsLoading(true);
    setErrorMessage('');
    setActiveConversationId(convId);

    try {
      const res = await apiClient.get(`/api/ai/conversations/${convId}/messages`);
      if (res.ok) {
        const json = await res.json();
        const loadedMsgs = (json.data || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          financialData: m.financial_data
            ? typeof m.financial_data === 'string'
              ? JSON.parse(m.financial_data)
              : m.financial_data
            : null,
          createdAt: m.created_at,
        }));
        setMessages(loadedMsgs);
        if (isSidebarOpen) setIsSidebarOpen(false);
      } else {
        setErrorMessage('Unable to load conversation thread.');
      }
    } catch (err) {
      setErrorMessage('Failed to connect to the server while loading conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a Brand New Conversation
  const handleNewConversation = () => {
    stopSpeaking();
    cancelListening();
    setActiveConversationId(null);
    setMessages([]);
    setErrorMessage('');
    setInputText('');
    if (inputRef.current) inputRef.current.focus();
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  // Send a Chat Message
  const handleSendMessage = async (textToSend = null) => {
    if (isListening) {
      stopListening();
    }
    stopSpeaking();

    const rawMessage = typeof textToSend === 'string' ? textToSend : inputText;
    const trimmed = rawMessage ? rawMessage.trim() : '';
    if (!trimmed || isLoading) return;

    setErrorMessage('');
    setInputText('');

    // Optimistically append user message to stream
    const tempUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const payload = {
        message: trimmed,
        language: selectedLanguage,
        conversationId: activeConversationId || null,
      };

      const res = await apiClient.post('/api/ai/chat', payload);
      const data = await res.json();

      if (!res.ok || !data.success) {
        let userFacingError = 'Failed to process AI financial request.';

        if (res.status === 429 || data.error === 'AI_RATE_LIMIT_REACHED') {
          userFacingError =
            'The AI assistant has reached its free tier usage limit. Please wait a few moments and try again.';
        } else if (data.error === 'GROQ_API_KEY_MISSING') {
          userFacingError =
            'Groq API key is not configured in the backend environment. Please check server settings.';
        } else if (
          data.error === 'LOCAL_AI_UNAVAILABLE' ||
          data.error === 'AI_PROVIDER_UNAVAILABLE' ||
          data.error === 'GROQ_UNREACHABLE'
        ) {
          userFacingError =
            'The AI financial service is temporarily unavailable. Please try again later.';
        } else if (data.message) {
          userFacingError = data.message;
        }

        setErrorMessage(userFacingError);
        return;
      }

      // If this was a new thread, store conversationId and refresh list
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        fetchConversations();
      }

      // Append verified assistant response
      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Analysis complete.',
        financialData: data.financialData || null,
        insights: data.insights || [],
        createdAt: new Date().toISOString(),
        provider: data.provider,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If Auto Speak preference is enabled, speak the answer
      if (autoSpeak) {
        speak({
          id: assistantMsg.id,
          text: assistantMsg.content,
          lang: selectedLanguage,
        });
      }
    } catch (err) {
      console.error('[STS FINTECH AI Chat] Send error:', err);
      setErrorMessage('Network error: Unable to reach STS Fintech AI server. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-4">
      {/* ===================================================================== */}
      {/* Top Header Card: Title, Status Badge & Language Selector              */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0d5236] to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                AI Financial Assistant
              </h1>
              {backendStatus === null ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking AI Service
                </span>
              ) : backendStatus?.available ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  GroqCloud AI – Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" />
                  AI Service Unavailable
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Natural-language financial intelligence grounded in your verified PostgreSQL records
            </p>
          </div>
        </div>

        {/* Header Actions: Language, Auto-Speak, New Chat & History Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          {/* Language Selector Pills */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {CHAT_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#0d5236] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={lang.label}
                >
                  <span className="text-xs">{lang.flag}</span>
                  <span className="text-[11px]">{lang.native}</span>
                </button>
              );
            })}
          </div>

          {/* Auto Voice Response Toggle (TTS) */}
          <button
            type="button"
            onClick={toggleAutoSpeak}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              autoSpeak
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={autoSpeak ? 'Auto Voice Response: Enabled' : 'Auto Voice Response: Disabled (Click to enable)'}
            aria-label={autoSpeak ? 'Disable Auto Voice' : 'Enable Auto Voice'}
          >
            {autoSpeak ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Auto Voice: {autoSpeak ? 'ON' : 'OFF'}</span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition cursor-pointer"
            title="Start New Session"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Mobile History Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Toggle Conversation History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Main Container: Conversation History Sidebar + Chat Window           */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 pb-2">
        {/* =================================================================== */}
        {/* LEFT COLUMN: Conversation History Panel (Desktop & Mobile Drawer)   */}
        {/* =================================================================== */}
        <div
          className={`${
            isSidebarOpen ? 'fixed inset-0 z-50 flex' : 'hidden'
          } md:relative md:flex md:col-span-4 lg:col-span-3 flex-col bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs`}
        >
          {/* Mobile Overlay Backdrop */}
          {isSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="relative z-10 flex flex-col h-full w-full max-w-xs md:max-w-none bg-white dark:bg-[#0d1322]">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Conversation History</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchConversations}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Refresh Sessions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                </button>
                {isSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isHistoryLoading && conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                  <p>Loading sessions...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No saved sessions</p>
                  <p className="text-[11px]">Ask your first financial question to start a thread.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConversationId;
                  const dateStr = c.updated_at
                    ? new Date(c.updated_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => loadConversationMessages(c.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 group ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {c.title || 'Financial Session'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{dateStr || 'Recent'}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] font-bold">{c.language || 'en-IN'}</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400 translate-x-0.5'
                            : 'text-slate-400 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer with Privacy Tag */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">GroqCloud Hosted AI · Financial Data Minimisation</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Chat Window Container                                 */}
        {/* =================================================================== */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden h-[calc(100vh-210px)] min-h-[480px]">
          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-6 sm:py-8 max-w-xl mx-auto text-center space-y-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0d5236] to-emerald-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
                  <Bot className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Hello! How can I assist with your finances today?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Ask me anything about your income, monthly expenses, savings rate, or highest spending categories.
                  </p>
                </div>

                {/* Suggested Questions Grid (Section 8) */}
                <div className="text-left space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    Suggested Financial Questions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => {
                      const Icon = q.icon;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => handleSendMessage(q.text)}
                          className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-900/70 hover:bg-emerald-50 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition group cursor-pointer flex items-start gap-2.5"
                        >
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200">
                            {q.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d5236] to-emerald-500 flex items-center justify-center text-white shadow-xs flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#0d5236] text-white rounded-tr-none font-medium selection:bg-emerald-300 selection:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800/80 rounded-tl-none font-normal'
                      }`}
                    >
                      {/* Formatted Natural Language Response with paragraph/bullet rendering */}
                      <div className="whitespace-pre-wrap break-words space-y-2">
                        {msg.content}
                      </div>

                      {/* Structured Financial Response Card (Section 9) */}
                      {!isUser && msg.financialData && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                          {/* 1. Summary Metrics Tiles */}
                          {(msg.financialData.summary ||
                            msg.financialData.totalExpenses !== undefined ||
                            msg.financialData.totalIncome !== undefined) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {/* Income Tile */}
                              {(msg.financialData.summary?.totalIncome !== undefined ||
                                msg.financialData.totalIncome !== undefined) && (
                                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-100">
                                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                    Total Income
                                  </p>
                                  <p className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
                                    {formatINR(
                                      msg.financialData.summary?.totalIncome ?? msg.financialData.totalIncome
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Expense Tile */}
                              {(msg.financialData.summary?.totalExpenses !== undefined ||
                                msg.financialData.totalExpenses !== undefined) && (
                                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-800 dark:text-slate-100">
                                  <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                                    Total Expenses
                                  </p>
                                  <p className="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-300 mt-0.5">
                                    {formatINR(
                                      msg.financialData.summary?.totalExpenses ?? msg.financialData.totalExpenses
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Net Savings Tile */}
                              {(msg.financialData.summary?.netSavings !== undefined ||
                                msg.financialData.totalSavings !== undefined) && (
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-800 dark:text-slate-100 col-span-2 sm:col-span-1">
                                  <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                                    Net Savings
                                  </p>
                                  <p className="text-xs sm:text-sm font-black text-indigo-800 dark:text-indigo-300 mt-0.5">
                                    {formatINR(
                                      msg.financialData.summary?.netSavings ?? msg.financialData.totalSavings
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. Category Distribution Chips */}
                          {(msg.financialData.categories || msg.financialData.categoryBreakdown) && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Category Breakdown
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(msg.financialData.categories || msg.financialData.categoryBreakdown)
                                  .slice(0, 4)
                                  .map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700"
                                    >
                                      <span>{c.category}:</span>
                                      <span className="font-bold">{formatINR(c.amount)}</span>
                                      {c.percentage && <span className="text-slate-400">({c.percentage}%)</span>}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* 3. Deterministic Statistical Insights */}
                          {msg.financialData.insights && msg.financialData.insights.length > 0 && (
                            <div className="space-y-1">
                              {msg.financialData.insights.slice(0, 2).map((ins, insIdx) => (
                                <div
                                  key={insIdx}
                                  className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span>{ins.message || ins.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp, Attribution & TTS Speaker Control */}
                    <div
                      className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {timeStr && <span>{timeStr}</span>}
                      {!isUser && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Grounded in Ledger
                          </span>
                          <span>•</span>
                          {/* Text-to-Speech Playback Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isSpeaking && speakingId === msg.id) {
                                stopSpeaking();
                              } else {
                                if (isListening) cancelListening();
                                speak({
                                  id: msg.id,
                                  text: msg.content,
                                  lang: selectedLanguage,
                                });
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                              isSpeaking && speakingId === msg.id
                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold animate-pulse'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                            title={isSpeaking && speakingId === msg.id ? 'Stop speaking' : 'Listen to answer'}
                            aria-label={isSpeaking && speakingId === msg.id ? 'Stop speaking' : 'Listen to answer'}
                          >
                            {isSpeaking && speakingId === msg.id ? (
                              <>
                                <VolumeX className="w-3 h-3 text-rose-500" />
                                <span className="text-[9px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-bold">
                                  Speaking...
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[9px] uppercase tracking-wide">Listen</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live Thinking Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d5236] to-emerald-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span>Analyzing verified financial ledger with Groq gpt-oss-20b...</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-100 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================================================================= */}
          {/* Bottom Chat Input Bar                                             */}
          {/* ================================================================= */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#090e1a] border-t border-slate-200 dark:border-slate-800/80 space-y-2">
            {/* Quick Suggestion Chips (when conversation has messages) */}
            {messages.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <span className="text-slate-400 flex items-center gap-1 flex-shrink-0 text-[10px] font-bold uppercase">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  Ask:
                </span>
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSendMessage(q.text)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 transition text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            )}

            {/* Live Voice Listening Banner with Animated Waves & Interim Transcript */}
            {isListening && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] sm:text-xs">
                        {selectedLanguage === 'ta-IN'
                          ? 'தமிழில் பேசவும்... (Listening in Tamil)'
                          : selectedLanguage === 'hi-IN'
                          ? 'हिन्दी में बोलें... (Listening in Hindi)'
                          : 'Listening in English (India)... Speak now'}
                      </span>
                      {/* Audio wave bars */}
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-1"></span>
                        <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-2"></span>
                        <span className="w-0.5 bg-rose-500 rounded-full animate-voice-wave-3"></span>
                      </div>
                    </div>
                    {interimTranscript && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic truncate mt-0.5 font-medium">
                        "{interimTranscript}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase font-bold rounded-lg cursor-pointer transition shadow-xs"
                    title="Finish speaking and edit text"
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelVoiceRecording}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Cancel recording"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Speech or Voice Error Notification Banner */}
            {(speechError || voiceError) && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{speechError || voiceError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearSpeechError();
                    clearVoiceError();
                  }}
                  className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-100 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Dynamic Voice Recording Microphone Button (Milestone 2 - Step 6) */}
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                disabled={isLoading}
                className={`p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0 relative ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-[#0d5236] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-500/30'
                }`}
                title={
                  isListening
                    ? 'Stop voice recording'
                    : `Ask with voice in ${
                        selectedLanguage === 'ta-IN'
                          ? 'Tamil (தமிழ்)'
                          : selectedLanguage === 'hi-IN'
                          ? 'Hindi (हिन्दी)'
                          : 'English (India)'
                      }`
                }
                aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={
                  selectedLanguage === 'ta-IN'
                    ? 'உங்கள் நிதி குறித்து கேள்விகள் கேட்கவும் அல்லது பேசவும்...'
                    : selectedLanguage === 'hi-IN'
                    ? 'अपने वित्तीय विवरण के बारे में पूछें या बोलें...'
                    : 'Ask about your income, expenses, or savings (Type or use Mic)...'
                }
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5236] dark:focus:ring-emerald-500 transition disabled:opacity-60"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#0d5236] hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shadow-emerald-950/20 flex-shrink-0"
                title="Send Message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Caption */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                GroqCloud Hosted AI · Financial Data Minimisation · Web Speech API
              </span>
              <span className="hidden sm:inline">Press Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
