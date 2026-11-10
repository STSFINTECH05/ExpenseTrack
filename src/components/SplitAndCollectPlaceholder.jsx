import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Users,
  X,
  ArrowLeft,
  ArrowRight,
  Receipt,
  Share2,
  Download,
  CheckCircle2,
  User,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Compass,
  ExternalLink,
  Navigation,
  Mic,
  MicOff,
  Bot,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
} from 'lucide-react';
import apiClient from '../apiClient';
import {
  VOICE_LANGUAGES,
  VoiceLanguageSelector,
  VoiceMicButton,
  VoiceStatusBanner,
} from './VoiceMicControls';

// Curated database of famous places for popular cities
const FAMOUS_DESTINATIONS = {
  goa: [
    { name: 'Baga Beach', type: 'Beach & Watersports', desc: 'Vibrant nightlife, shacks, and watersport excursions.' },
    { name: 'Basilica of Bom Jesus', type: 'UNESCO Heritage', desc: 'Historic 16th-century baroque architecture in Old Goa.' },
    { name: 'Dudhsagar Falls', type: 'Nature & Trek', desc: 'Four-tiered scenic waterfall in the Western Ghats.' },
    { name: 'Aguada Fort', type: 'Historic Lighthouse', desc: '17th-century Portuguese fort overlooking Sinquerim Beach.' },
  ],
  chennai: [
    { name: 'Marina Beach', type: 'Coastal Promenade', desc: 'One of the longest natural urban beaches in the world.' },
    { name: 'Kapaleeshwarar Temple', type: 'Dravidian Architecture', desc: 'Historic 7th-century temple in Mylapore.' },
    { name: 'San Thome Basilica', type: 'Historic Cathedral', desc: 'Neo-Gothic cathedral built over the tomb of St. Thomas.' },
    { name: 'Fort St. George', type: 'Colonial Heritage', desc: 'First English fortress in India, built in 1644.' },
  ],
  bengaluru: [
    { name: 'Cubbon Park', type: 'Botanical Garden', desc: '300-acre lush green corridor in the heart of the city.' },
    { name: 'Bangalore Palace', type: 'Heritage Palace', desc: 'Tudor-style royal estate inspired by Windsor Castle.' },
    { name: 'Bannerghatta National Park', type: 'Wildlife Safari', desc: 'Biological reserve featuring a zoo and safari excursions.' },
    { name: 'Nandi Hills', type: 'Scenic Sunrise Trek', desc: 'Historic hill fortress offering panoramic valley views.' },
  ],
  mumbai: [
    { name: 'Gateway of India', type: 'Historic Arch', desc: 'Iconic 20th-century monument overlooking the Arabian Sea.' },
    { name: 'Marine Drive', type: 'Queens Necklace', desc: '3.6 km arc-shaped coastal boulevard.' },
    { name: 'Elephanta Caves', type: 'UNESCO Heritage', desc: 'Rock-cut cave temples dedicated to Lord Shiva on Elephanta Island.' },
    { name: 'Chhatrapati Shivaji Terminus', type: 'Victorian Gothic', desc: 'Historic rail terminal and UNESCO world heritage site.' },
  ],
  puducherry: [
    { name: 'White Town / French Quarter', type: 'Heritage Streets', desc: 'Pastel colonial villas, boutique cafes, and bougainvillea streets.' },
    { name: 'Promenade Beach', type: 'Scenic Boardwalk', desc: 'Peaceful traffic-free seafront promenade along Goubert Avenue.' },
    { name: 'Sri Aurobindo Ashram', type: 'Spiritual Center', desc: 'Serene community center founded by Sri Aurobindo and The Mother.' },
    { name: 'Chunnambar Boat House & Paradise Beach', type: 'Ferry Excursion', desc: 'Scenic backwater boat cruise leading to secluded white sands.' },
  ],
  delhi: [
    { name: 'Qutub Minar', type: 'UNESCO Monument', desc: '73-meter tall red sandstone victory tower built in 1192.' },
    { name: 'India Gate', type: 'War Memorial', desc: 'Iconic monumental triumphal arch dedicated to soldiers.' },
    { name: 'Red Fort (Lal Qila)', type: 'Mughal Architecture', desc: 'Historic fortress that served as the main residence of Mughal emperors.' },
    { name: 'Humayun Tomb', type: 'UNESCO Heritage', desc: 'Grand 16th-century garden tomb prototype of the Taj Mahal.' },
  ],
};

// =========================================================================
// AI Voice Command Parser & Natural Language Understanding
// =========================================================================
const parseVoiceTicketCommand = (text) => {
  if (!text) return null;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // Location detection: popular cities and tourist destinations
  const cityMap = {
    goa: 'Goa',
    chennai: 'Chennai',
    bengaluru: 'Bengaluru',
    bangalore: 'Bengaluru',
    mumbai: 'Mumbai',
    bombay: 'Mumbai',
    puducherry: 'Puducherry',
    pondicherry: 'Puducherry',
    delhi: 'Delhi',
    'new delhi': 'Delhi',
    hyderabad: 'Hyderabad',
    kolkata: 'Kolkata',
    kerala: 'Kerala',
    jaipur: 'Jaipur',
    manali: 'Manali',
    agra: 'Agra',
    ooty: 'Ooty',
    shimla: 'Shimla',
  };

  let detectedLocation = '';
  for (const [key, val] of Object.entries(cityMap)) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(lower)) {
      detectedLocation = val;
      break;
    }
  }

  // Participants detection: "with [name] and [name]" or "with [name], [name]"
  const detectedParticipants = [];
  const withMatch = raw.match(/with\s+([^,.\n]+)/i);
  if (withMatch && withMatch[1]) {
    const rawNames = withMatch[1]
      .replace(/\s+for\s+.*$/i, '')
      .replace(/\s+in\s+.*$/i, '')
      .split(/\s+and\s+|,\s*|\s*&\s*/i);

    rawNames.forEach((n) => {
      const clean = n.trim().replace(/^the\s+/i, '').replace(/[^a-zA-Z0-9\s]/g, '');
      if (
        clean &&
        !['team', 'friends', 'colleagues', 'everyone', 'us', 'all', 'office', 'group'].includes(
          clean.toLowerCase()
        )
      ) {
        detectedParticipants.push(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    });
  }

  // Currency detection
  let detectedCurrency = 'INR (₹)';
  if (lower.includes('dollar') || lower.includes('usd') || lower.includes('$')) {
    detectedCurrency = 'USD ($)';
  } else if (lower.includes('euro') || lower.includes('€')) {
    detectedCurrency = 'EUR (€)';
  } else if (lower.includes('pound') || lower.includes('gbp') || lower.includes('£')) {
    detectedCurrency = 'GBP (£)';
  } else if (lower.includes('rupee') || lower.includes('inr') || lower.includes('₹')) {
    detectedCurrency = 'INR (₹)';
  }

  // Budget / amount detection
  let detectedBudget = '';
  const amountMatch = raw.match(/(?:for|amount|budget|cost|of)\s+(?:rs\.?|inr|\$|€|£)?\s*([0-9,]+)/i);
  if (amountMatch && amountMatch[1]) {
    detectedBudget = amountMatch[1].replace(/,/g, '');
  }

  // Clean Title extraction
  let cleanTitle = raw
    .replace(/^create\s+(?:a\s+|an\s+)?/i, '')
    .replace(/^start\s+(?:a\s+|an\s+)?/i, '')
    .replace(/^make\s+(?:a\s+|an\s+)?/i, '')
    .replace(/^new\s+/i, '')
    .replace(/\s+split\s+ticket/i, ' Split')
    .replace(/\s+ticket/i, '');

  // If title still has "with ...", trim it off title for cleaner title name
  const withIdx = cleanTitle.search(/\s+with\s+/i);
  if (withIdx !== -1) {
    cleanTitle = cleanTitle.substring(0, withIdx).trim();
  }

  // Capitalize words in title
  cleanTitle = cleanTitle
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return {
    title: cleanTitle,
    location: detectedLocation,
    currency: detectedCurrency,
    participants: detectedParticipants,
    budget: detectedBudget,
    rawText: raw,
  };
};

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function SplitAndCollectPlaceholder() {
  // =========================================================================
  // Core Component State & Backend Integration
  // =========================================================================
  const [ticketsList, setTicketsList] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch detailed group data (members, expenses, settlements)
  const fetchTicketDetails = useCallback(async (ticketId) => {
    try {
      const res = await apiClient.get(`/api/splits/groups/${ticketId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveTicket(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load group details:', err);
    }
  }, []);

  // Fetch all split groups accessible to authenticated user
  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiClient.get('/api/splits/groups');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTicketsList(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load split groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const handleUpdate = () => fetchTickets(true);
    window.addEventListener('sts_data_updated', handleUpdate);
    return () => window.removeEventListener('sts_data_updated', handleUpdate);
  }, [fetchTickets]);

  const handleOpenTicket = async (ticket) => {
    setActiveTicket(ticket);
    await fetchTicketDetails(ticket.id);
  };

  // Modal State: Create Ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketLocation, setTicketLocation] = useState('');
  const [ticketCurrency, setTicketCurrency] = useState('INR (₹)');
  const [ticketDescription, setTicketDescription] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState([
    { id: 'user-you', name: 'You', email: '', isSelf: true },
  ]);

  // Voice Assistant & AI Voice Recognition Bot States
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isBotListening, setIsBotListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isBotMuted, setIsBotMuted] = useState(false);
  const [botTranscript, setBotTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [botStatus, setBotStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [showAiBot, setShowAiBot] = useState(true);
  const [voiceError, setVoiceError] = useState('');

  // Multilingual Voice Recognition States (en-IN | ta-IN | hi-IN)
  const [voiceLang, setVoiceLang] = useState(() => {
    try {
      return localStorage.getItem('sts_voice_language') || 'en-IN';
    } catch (e) {
      return 'en-IN';
    }
  });
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'success' | 'error'
  const [voiceStatusMessage, setVoiceStatusMessage] = useState('');
  const activeRecognitionRef = useRef(null);
  const voiceTimerRef = useRef(null);

  const handleVoiceLangChange = (langCode) => {
    setVoiceLang(langCode);
    try {
      localStorage.setItem('sts_voice_language', langCode);
    } catch (e) {}
  };

  const titleRecognitionRef = useRef(null);
  const botRecognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Stop all active voice operations (Recognition & SpeechSynthesis)
  const stopAllVoice = () => {
    if (activeRecognitionRef.current) {
      try {
        activeRecognitionRef.current.stop();
      } catch (e) {}
      activeRecognitionRef.current = null;
    }
    if (titleRecognitionRef.current) {
      try {
        titleRecognitionRef.current.stop();
      } catch (e) {}
      titleRecognitionRef.current = null;
    }
    if (botRecognitionRef.current) {
      try {
        botRecognitionRef.current.stop();
      } catch (e) {}
      botRecognitionRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setIsListeningTitle(false);
    setActiveVoiceField(null);
    setIsBotListening(false);
    setIsBotSpeaking(false);
    setBotStatus('idle');
    setVoiceStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllVoice();
    };
  }, []);

  // Text-to-speech for AI Bot voice replies
  const speakBotResponse = (text) => {
    if (isBotMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      setBotStatus('idle');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => {
        setIsBotSpeaking(true);
        setBotStatus('speaking');
      };
      utterance.onend = () => {
        setIsBotSpeaking(false);
        setBotStatus('idle');
      };
      utterance.onerror = () => {
        setIsBotSpeaking(false);
        setBotStatus('idle');
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsBotSpeaking(false);
      setBotStatus('idle');
    }
  };

  // Apply parsed voice command to the ticket form
  const applyVoiceCommand = (parsed) => {
    if (!parsed) return;

    if (parsed.title) {
      setTicketTitle(parsed.title);
    }

    if (parsed.location) {
      setTicketLocation(parsed.location);
    }

    if (parsed.currency) {
      setTicketCurrency(parsed.currency);
    }

    if (parsed.budget) {
      setTicketDescription(`Budget: ${parsed.currency.split(' ')[0]} ${parsed.budget}`);
    }

    if (parsed.participants && parsed.participants.length > 0) {
      setParticipants((prev) => {
        const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
        const toAdd = parsed.participants
          .filter((name) => !existingNames.has(name.toLowerCase()))
          .map((name) => ({
            id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name,
            email: `${name.toLowerCase().replace(/\s+/g, '')}@stsfintech.com`,
            isSelf: false,
          }));
        return [...prev, ...toAdd];
      });
    }

    // Friendly speech feedback
    const parts = [];
    parts.push(`Ticket title set to "${parsed.title}".`);
    if (parsed.location) parts.push(`Location set to ${parsed.location}.`);
    if (parsed.participants && parsed.participants.length > 0) {
      parts.push(`Added ${parsed.participants.join(' and ')} to participants.`);
    }
    if (parsed.budget) {
      parts.push(`Budget noted as ${parsed.currency.split(' ')[0]} ${parsed.budget}.`);
    }

    const responseMsg = `Got it! ${parts.join(' ')}`;
    setBotResponse(responseMsg);
    speakBotResponse(responseMsg);
  };

  // Multilingual Voice Recognition for Any Input Field (Milestone 1)
  const toggleFieldVoice = (fieldId, setterFn) => {
    setVoiceError('');
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
    }

    // Toggle off if currently listening to this exact field
    if (activeVoiceField === fieldId) {
      stopAllVoice();
      return;
    }

    // Stop any existing voice sessions
    stopAllVoice();

    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) {
      setVoiceStatus('error');
      setVoiceStatusMessage('Speech recognition unavailable');
      setVoiceError(
        'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang; // 'en-IN', 'ta-IN', or 'hi-IN'

      recognition.onstart = () => {
        setActiveVoiceField(fieldId);
        if (fieldId === 'ticketTitle') setIsListeningTitle(true);
        setVoiceStatus('listening');
        const langObj = VOICE_LANGUAGES.find((l) => l.code === voiceLang) || VOICE_LANGUAGES[0];
        setVoiceStatusMessage(`Listening in ${langObj.nativeLabel || langObj.label}... Speak now`);
      };

      recognition.onresult = (event) => {
        setVoiceStatus('processing');
        setVoiceStatusMessage('Processing speech...');

        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');

        if (transcript.trim()) {
          let text = transcript.trim();
          if (voiceLang === 'en-IN' || voiceLang === 'en-US') {
            text = text
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
          }
          // Preserve native Unicode for Tamil (ta-IN) & Hindi (hi-IN) without translation
          setterFn(text);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Voice recognition error for', fieldId, event.error);
        setActiveVoiceField(null);
        setIsListeningTitle(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceStatus('error');
          setVoiceStatusMessage('Microphone permission required');
          setVoiceError('Microphone permission required. Please allow microphone access in your browser or device settings.');
        } else if (event.error === 'no-speech') {
          setVoiceStatus('error');
          setVoiceStatusMessage('Unable to recognize speech. Please try again.');
          setVoiceError('Unable to recognize speech. Please try again.');
        } else if (event.error === 'audio-capture') {
          setVoiceStatus('error');
          setVoiceStatusMessage('Microphone not detected');
          setVoiceError('No microphone detected. Please check your audio input hardware.');
        } else if (event.error !== 'aborted') {
          setVoiceStatus('error');
          setVoiceStatusMessage(`Voice error: ${event.error}`);
          setVoiceError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setActiveVoiceField(null);
        setIsListeningTitle(false);
        activeRecognitionRef.current = null;
        setVoiceStatus('success');
        setVoiceStatusMessage('Speech recognized successfully');
        voiceTimerRef.current = setTimeout(() => {
          setVoiceStatus('idle');
          setVoiceStatusMessage('');
        }, 3000);
      };

      activeRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start voice recognition on', fieldId, err);
      setActiveVoiceField(null);
      setIsListeningTitle(false);
      setVoiceStatus('error');
      setVoiceStatusMessage('Microphone permission required');
      setVoiceError('Could not start microphone. Please check browser permissions.');
    }
  };

  // Toggle Direct Voice Recognition for Ticket Title (Backwards compatibility)
  const handleToggleTitleVoice = () => {
    toggleFieldVoice('ticketTitle', setTicketTitle);
  };

  // Toggle AI Voice Recognition Bot
  const handleToggleBotVoice = () => {
    setVoiceError('');
    if (isBotListening) {
      stopAllVoice();
      return;
    }

    stopAllVoice();
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) {
      setVoiceError(
        'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang; // Use selected voiceLang (en-IN, ta-IN, hi-IN)
      transcriptRef.current = '';

      recognition.onstart = () => {
        setIsBotListening(true);
        setBotStatus('listening');
        setBotTranscript('');
        const langObj = VOICE_LANGUAGES.find((l) => l.code === voiceLang) || VOICE_LANGUAGES[0];
        setBotResponse(`Listening in ${langObj.nativeLabel || langObj.label}... Speak now!`);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        transcriptRef.current = transcript;
        setBotTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Bot voice error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error !== 'no-speech') {
          setVoiceError(`Voice error: ${event.error}`);
        }
        setIsBotListening(false);
        setBotStatus('idle');
      };

      recognition.onend = () => {
        setIsBotListening(false);
        const finalSpoken = transcriptRef.current.trim();
        if (finalSpoken) {
          setBotStatus('processing');
          const parsed = parseVoiceTicketCommand(finalSpoken);
          applyVoiceCommand(parsed);
        } else {
          setBotStatus('idle');
        }
      };

      titleRecognitionRef.current = null;
      botRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start AI voice bot:', err);
      setVoiceError('Could not activate AI voice bot.');
      setIsBotListening(false);
      setBotStatus('idle');
    }
  };

  // Run quick prompt or simulated voice command through AI Voice Bot
  const handleRunBotCommand = (text) => {
    stopAllVoice();
    setBotTranscript(text);
    setBotStatus('processing');
    const parsed = parseVoiceTicketCommand(text);
    applyVoiceCommand(parsed);
  };

  // Modal State: Add Expense (in Active Ticket Detail View)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('You');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // =========================================================================
  // Handlers for Creating Ticket
  // =========================================================================
  const handleAddParticipant = () => {
    if (!participantName.trim()) return;

    const newParticipant = {
      id: `part-${Date.now()}`,
      name: participantName.trim(),
      email: participantEmail.trim() || `${participantName.toLowerCase().replace(/\s+/g, '')}@stsfintech.com`,
      isSelf: false,
    };

    setParticipants([...participants, newParticipant]);
    setParticipantName('');
    setParticipantEmail('');
  };

  const handleRemoveParticipant = (idToRemove) => {
    setParticipants(participants.filter((p) => p.id !== idToRemove || p.isSelf));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;

    stopAllVoice();

    try {
      const payload = {
        title: ticketTitle.trim(),
        location: ticketLocation.trim(),
        currency: ticketCurrency,
        description: ticketDescription.trim() || 'Team collaborative split ledger',
        participants: participants
          .filter((p) => !p.isSelf && p.name.toLowerCase() !== 'you')
          .map((p) => ({
            name: p.name,
            email: p.email,
          })),
      };

      const res = await apiClient.post('/api/splits/groups', payload);
      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to create split group.');
        return;
      }

      const created = json.data;
      setTicketsList((prev) => [created, ...prev]);
      setActiveTicket(created);
      setShowCreateModal(false);

      // Reset form
      setTicketTitle('');
      setTicketLocation('');
      setTicketDescription('');
      setTicketCurrency('INR (₹)');
      setParticipants([{ id: 'user-you', name: 'You', email: '', isSelf: true }]);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sts_data_updated'));
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Unable to connect to split service.');
    }
  };

  // =========================================================================
  // Handlers for Adding Expense to Active Ticket
  // =========================================================================
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!expenseTitle.trim() || isNaN(amountNum) || amountNum <= 0) return;
    if (!activeTicket) return;

    try {
      const payload = {
        title: expenseTitle.trim(),
        amount: amountNum,
        paid_by_name: expensePaidBy,
        split_with: activeTicket.participants.map((p) => p.name),
      };

      const res = await apiClient.post(`/api/splits/groups/${activeTicket.id}/expenses`, payload);
      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to save group expense.');
        return;
      }

      await fetchTicketDetails(activeTicket.id);
      await fetchTickets(true);

      setExpenseTitle('');
      setExpenseAmount('');
      setExpensePaidBy('You');
      setShowAddExpenseModal(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sts_data_updated'));
      }
    } catch (err) {
      console.error('Error saving group expense:', err);
      alert('Error saving expense to group.');
    }
  };

  // =========================================================================
  // Settlement Handler for Debts
  // =========================================================================
  const handleSettleDebt = async (debtId) => {
    if (!activeTicket) return;
    const currentSettled = activeTicket.settledDebtIds || [];
    if (currentSettled.includes(debtId)) return;

    const debts = calculateSimplifiedDebts(activeTicket);
    const targetDebt = debts.find((d) => d.id === debtId);

    try {
      const payload = {
        from_name: targetDebt ? targetDebt.from : debtId.split('-')[1]?.replace(/_/g, ' ') || 'Member',
        to_name: targetDebt ? targetDebt.to : debtId.split('-')[2]?.replace(/_/g, ' ') || 'Member',
        amount: targetDebt ? targetDebt.amount : parseFloat(debtId.split('-')[3]) || 0,
        debt_key: debtId,
        notes: 'Settled via Split & Collect',
      };

      const res = await apiClient.post(`/api/splits/groups/${activeTicket.id}/settlements`, payload);
      const json = await res.json();

      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to settle debt.');
        return;
      }

      await fetchTicketDetails(activeTicket.id);
      await fetchTickets(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sts_data_updated'));
      }
    } catch (err) {
      console.error('Error settling debt:', err);
      alert('Error settling debt.');
    }
  };

  // =========================================================================
  // Calculation Helpers
  // =========================================================================
  const calculateTotalOutlay = (ticket) => {
    if (!ticket) return 0;
    if (ticket.total_outlay !== undefined) return Number(ticket.total_outlay) || 0;
    if (ticket.expenses && Array.isArray(ticket.expenses)) {
      return ticket.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }
    return 0;
  };

  const formatCurrency = (val, currencyStr = 'INR (₹)') => {
    const symbol = currencyStr.includes('$')
      ? '$'
      : currencyStr.includes('€')
        ? '€'
        : currencyStr.includes('£')
          ? '£'
          : '₹';
    return `${symbol}${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Resolve attractions based on ticket location
  const getPlacesForLocation = (loc) => {
    if (!loc) return [];
    const normalized = loc.toLowerCase().replace(/[^a-z]/g, '');
    for (const key in FAMOUS_DESTINATIONS) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return FAMOUS_DESTINATIONS[key];
      }
    }
    // Generic fallback for any other custom destination entered
    return [
      { name: `${loc} City Center & Promenade`, type: 'Local Landmark', desc: `Central exploration and cultural hub in ${loc}.` },
      { name: `${loc} Heritage Market`, type: 'Shopping & Dining', desc: `Popular local eateries and artisan shopping district.` },
      { name: `${loc} Scenic Viewpoint`, type: 'Sightseeing', desc: `Panoramic lookout point and photo destination in ${loc}.` },
    ];
  };

  // Compute simplified debt transactions minimizing payments
  const calculateSimplifiedDebts = (ticket) => {
    if (!ticket || !ticket.participants || !ticket.expenses || ticket.expenses.length === 0) {
      return [];
    }

    const totalOutlay = calculateTotalOutlay(ticket);
    const count = ticket.participants.length || 1;
    const equalShare = totalOutlay / count;

    const rawBalances = ticket.participants.map((p) => {
      const totalPaid = (ticket.expenses || [])
        .filter((exp) => exp.paidBy === p.name)
        .reduce((sum, exp) => sum + exp.amount, 0);
      const net = totalPaid - equalShare;
      return {
        name: p.name,
        net: Math.round(net * 100) / 100,
      };
    });

    const debtors = [];
    const creditors = [];

    rawBalances.forEach((p) => {
      if (p.net < -0.01) {
        debtors.push({ name: p.name, amount: Math.abs(p.net) });
      } else if (p.net > 0.01) {
        creditors.push({ name: p.name, amount: p.net });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let dIdx = 0;
    let cIdx = 0;
    const settledIds = ticket.settledDebtIds || [];

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmount = Math.min(debtor.amount, creditor.amount);
      const roundedAmount = Math.round(settleAmount * 100) / 100;

      if (roundedAmount > 0.01) {
        const debtId = `debt-${debtor.name.replace(/\s+/g, '_')}-${creditor.name.replace(/\s+/g, '_')}-${roundedAmount}`;
        transactions.push({
          id: debtId,
          from: debtor.name,
          to: creditor.name,
          amount: roundedAmount,
          isSettled: settledIds.includes(debtId),
        });
      }

      debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
      creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return transactions;
  };

  const computeParticipantBalances = (ticket, simplifiedDebts = []) => {
    if (!ticket || !ticket.participants) return [];
    const totalOutlay = calculateTotalOutlay(ticket);
    const count = ticket.participants.length || 1;
    const equalShare = totalOutlay / count;

    const adjustments = {};
    ticket.participants.forEach((p) => {
      adjustments[p.name] = 0;
    });

    simplifiedDebts.forEach((debt) => {
      if (debt.isSettled) {
        if (adjustments[debt.from] !== undefined) {
          adjustments[debt.from] += debt.amount;
        }
        if (adjustments[debt.to] !== undefined) {
          adjustments[debt.to] -= debt.amount;
        }
      }
    });

    return ticket.participants.map((participant) => {
      const totalPaidByPerson = (ticket.expenses || [])
        .filter((exp) => exp.paidBy === participant.name)
        .reduce((sum, exp) => sum + exp.amount, 0);

      const rawBalance = totalPaidByPerson - equalShare;
      const netBalance = Math.round((rawBalance + (adjustments[participant.name] || 0)) * 100) / 100;

      return {
        ...participant,
        totalPaid: totalPaidByPerson,
        netBalance: Math.abs(netBalance) < 0.01 ? 0 : netBalance,
      };
    });
  };

  const filteredTickets = ticketsList.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.location && ticket.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = (activeTicket?.expenses || []).filter((exp) =>
    exp.title.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
    exp.paidBy.toLowerCase().includes(expenseSearchQuery.toLowerCase())
  );

  // =========================================================================
  // STATE 3: Active Split Ticket Detail Page
  // =========================================================================
  if (activeTicket) {
    const totalOutlay = calculateTotalOutlay(activeTicket);
    const simplifiedDebts = calculateSimplifiedDebts(activeTicket);
    const participantBalances = computeParticipantBalances(activeTicket, simplifiedDebts);
    const currencyTag = activeTicket.currency?.split(' ')[0] || 'INR';
    const allDebtsSettled = simplifiedDebts.length > 0 && simplifiedDebts.every((d) => d.isSettled);
    const famousPlaces = activeTicket.location ? getPlacesForLocation(activeTicket.location) : [];

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTicket(null)}
            className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-[#0d5236] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all tickets</span>
          </button>

          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Ticket Summary Banner */}
        <div className="rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {currencyTag} GROUP
              </span>

              {activeTicket.location && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>{activeTicket.location}</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight capitalize">
              {activeTicket.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTicket.description} • Created by You on{' '}
              {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="md:text-right p-4 rounded-xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 md:bg-transparent md:border-0 md:p-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOTAL GROUP OUTLAY
            </p>
            <p className="text-2xl sm:text-3xl font-black text-[#0d5236] dark:text-emerald-400 mt-0.5">
              {formatCurrency(totalOutlay, activeTicket.currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {activeTicket.participants.length} active participant
              {activeTicket.participants.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Split 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: LOGGED EXPENSES */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  LOGGED EXPENSES
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeTicket.expenses.length} Sessions
                </span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center space-x-1.5 text-slate-400">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    placeholder="Filter..."
                    className="pl-7 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#0d5236] w-28 sm:w-36"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <VoiceMicButton
                      size="sm"
                      isListening={activeVoiceField === 'expenseSearchQuery'}
                      onClick={() => toggleFieldVoice('expenseSearchQuery', setExpenseSearchQuery)}
                      title="Voice search expenses"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  title="Share breakdown"
                  onClick={() => alert(`Share link copied for ${activeTicket.title}`)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Download CSV"
                  onClick={() => alert('Exporting split ledger to CSV...')}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expenses List or Empty State */}
            {filteredExpenses.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 mx-auto flex items-center justify-center shadow-sm">
                  <Receipt className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No Expenses Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Click &apos;+ Add Expense&apos; to record dinners, travel costs, or team bills in this split ticket.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0d5236] text-white text-xs font-semibold hover:bg-[#093d28] transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record First Expense</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-[#0d5236] flex items-center justify-center font-bold text-xs">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{exp.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Paid by <span className="font-semibold text-slate-700">{exp.paidBy}</span> •{' '}
                          Split equally across {activeTicket.participants.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black font-mono text-[#0d5236]">
                        {formatCurrency(exp.amount, activeTicket.currency)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(exp.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: BALANCES & SETTLEMENTS */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-300">
                  Summary ({currencyTag})
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  REAL-TIME LEDGER
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {participantBalances.map((member) => {
                  const isSettled = Math.abs(member.netBalance) < 0.01;
                  const isPositive = member.netBalance > 0.01;

                  return (
                    <div key={member.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                            <span>{member.name}</span>
                            {member.isSelf && (
                              <span className="text-[9px] font-semibold text-slate-400">(You)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">{member.email}</p>
                        </div>
                      </div>

                      <div className="text-right flex items-center space-x-2">
                        {isSettled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0d5236] border border-emerald-200">
                            Settled
                          </span>
                        ) : isPositive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Gets {formatCurrency(member.netBalance, activeTicket.currency)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Owes {formatCurrency(Math.abs(member.netBalance), activeTicket.currency)}
                          </span>
                        )}

                        <span className="font-mono text-xs font-bold text-slate-700 min-w-[50px] text-right">
                          {isSettled
                            ? formatCurrency(0, activeTicket.currency)
                            : isPositive
                              ? `+${formatCurrency(member.netBalance, activeTicket.currency)}`
                              : `-${formatCurrency(Math.abs(member.netBalance), activeTicket.currency)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simplified Debts Card */}
            <div className="rounded-2xl bg-[#0c1322] border border-slate-800 p-5 text-white shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Simplified Debts</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Optimized
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated debt simplification minimizes total transactions required to balance accounts among all group members.
              </p>

              {allDebtsSettled && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>All debts are fully settled! ✓</span>
                </div>
              )}

              {simplifiedDebts.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    {activeTicket.expenses.length === 0
                      ? 'No outstanding balances. All accounts are settled at ₹0.00.'
                      : 'All accounts are balanced.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {simplifiedDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${debt.isSettled
                          ? 'bg-slate-900/60 border-emerald-500/20 opacity-80'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {debt.from}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">pays</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {debt.to}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {formatCurrency(debt.amount, activeTicket.currency)}
                        </span>

                        {debt.isSettled ? (
                          <button
                            disabled
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 opacity-90 cursor-not-allowed"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Settled ✓</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSettleDebt(debt.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm active:scale-95 cursor-pointer"
                          >
                            <span>Settle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* NEW SECTION: FAMOUS PLACES & MAP ACCORDING TO LOCATION           */}
        {/* =============================================================== */}
        {activeTicket.location && (
          <div className="rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 flex items-center justify-center">
                  <Compass className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    <span>Famous Places in {activeTicket.location}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Destination Guide
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recommended spots and places to explore for your team while in {activeTicket.location}.
                  </p>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTicket.location)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Famous Places Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {famousPlaces.map((place, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#0d5236] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                          {place.type}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${activeTicket.location}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on Google Maps"
                          className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-emerald-600"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {place.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {place.desc}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${activeTicket.location}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-[#0d5236] dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1 self-start"
                    >
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Directions</span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Right Column: Embedded Interactive Google Map */}
              <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[260px] relative shadow-inner flex flex-col">
                <iframe
                  title={`Map of ${activeTicket.location}`}
                  width="100%"
                  height="100%"
                  className="w-full h-full min-h-[260px] border-0"
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(activeTicket.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Expense */}
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6 space-y-5 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Record New Expense</h3>
                  <p className="text-xs text-slate-500">Add an expense to &quot;{activeTicket.title}&quot;</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multilingual Voice Recognition Language Selector */}
              <VoiceLanguageSelector
                selectedLang={voiceLang}
                onSelectLang={handleVoiceLangChange}
              />

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-600">
                      Expense Title
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Voice Dictation
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      placeholder="e.g. Seafood Dinner, Airport Taxi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5236]/40 focus:bg-white"
                    />
                    <div className="absolute right-2 flex items-center">
                      <VoiceMicButton
                        isListening={activeVoiceField === 'expenseTitle'}
                        onClick={() => toggleFieldVoice('expenseTitle', setExpenseTitle)}
                        title="Voice dictation for Expense Title"
                      />
                    </div>
                  </div>
                  <VoiceStatusBanner
                    activeField={activeVoiceField}
                    targetField="expenseTitle"
                    status={voiceStatus}
                    message={voiceStatusMessage}
                    onStop={stopAllVoice}
                    onDismiss={() => {
                      setVoiceStatus('idle');
                      setVoiceStatusMessage('');
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Amount ({currencyTag})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0d5236]/40 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Paid By
                    </label>
                    <select
                      value={expensePaidBy}
                      onChange={(e) => setExpensePaidBy(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5236]/40 focus:bg-white"
                    >
                      {activeTicket.participants.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.isSelf ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Split Method:</span> Split equally between all{' '}
                  <span className="font-semibold text-[#0d5236]">
                    {activeTicket.participants.length} members
                  </span>
                  .
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white font-bold text-sm shadow-md transition cursor-pointer active:scale-95"
                >
                  Save Expense
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // STATE 1 & STATE 2: Tickets List View (Default) + Create Ticket Modal
  // =========================================================================
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0d5236] flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Splitwise &amp; Collect
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Divide collaborative bills, track expenses, and simplify balances with team members.
          </p>
        </div>

        {/* Top Right Button: + New Split Ticket */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Split Ticket</span>
        </button>
      </div>

      {/* Search Input Bar with Voice Search */}
      <div className="space-y-1.5 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search split tickets by title or location..."
            className="w-full bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5236]/30 focus:border-[#0d5236] transition shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceMicButton
              size="sm"
              isListening={activeVoiceField === 'searchQuery'}
              onClick={() => toggleFieldVoice('searchQuery', setSearchQuery)}
              title="Voice search for split tickets"
            />
          </div>
        </div>
        <VoiceStatusBanner
          activeField={activeVoiceField}
          targetField="searchQuery"
          status={voiceStatus}
          message={voiceStatusMessage}
          onStop={stopAllVoice}
          onDismiss={() => {
            setVoiceStatus('idle');
            setVoiceStatusMessage('');
          }}
        />
      </div>

      {/* Tickets List OR Empty State Display */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 p-12 sm:p-16 text-center max-w-xl mx-auto shadow-sm space-y-5 my-8 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              No Active Split Tickets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Create a new split ticket to begin tracking collaborative expenses with your co-workers.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Ticket</span>
          </button>
        </div>
      ) : (
        /* Grid of Tickets when tickets exist */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const outlay = calculateTotalOutlay(ticket);
            return (
              <div
                key={ticket.id}
                onClick={() => handleOpenTicket(ticket)}
                className="p-5 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-[#0d5236]/40 transition cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {ticket.currency?.split(' ')[0]} GROUP
                      </span>
                      {ticket.location && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>{ticket.location}</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">
                      {ticket.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ticket.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{ticket.participants?.length || ticket.member_count || 1} members</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-[#0d5236] dark:text-emerald-400">
                      {formatCurrency(outlay, ticket.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 2: "Create Split Ticket" Modal Popup                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1322] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative">
            {/* Modal Header & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Create Split Ticket</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start a group ledger for collaborative expenses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAllVoice();
                  setShowCreateModal(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ========================================================================= */}
            {/* AI VOICE RECOGNITION BOT ASSISTANT WIDGET                                 */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-[#091b15] dark:via-[#0c1624] dark:to-[#071714] p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all">
              {/* Subtle decorative glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Header: Bot Identity & Controls */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isBotListening
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-400/30 animate-pulse'
                        : isBotSpeaking
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 ring-4 ring-cyan-400/30'
                        : 'bg-[#0d5236] text-white shadow-md'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                    {(isBotListening || isBotSpeaking) && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        STS AI Voice Assistant Bot
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        AI Voice
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Voice recognition &amp; smart auto-split assistant
                    </p>
                  </div>
                </div>

                {/* Voice Bot Top Action Controls */}
                <div className="flex items-center gap-1">
                  {/* Sound Mute/Unmute */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isBotSpeaking) {
                        window.speechSynthesis?.cancel();
                        setIsBotSpeaking(false);
                      }
                      setIsBotMuted(!isBotMuted);
                    }}
                    className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isBotMuted
                        ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800'
                        : 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-200/60'
                    }`}
                    title={isBotMuted ? 'Unmute AI Voice responses' : 'Mute AI Voice responses'}
                  >
                    {isBotMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expand/Collapse Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAiBot(!showAiBot)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={showAiBot ? 'Collapse AI Bot' : 'Expand AI Bot'}
                  >
                    {showAiBot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Voice Bot Body */}
              {showAiBot && (
                <div className="space-y-3 pt-1 border-t border-emerald-500/10 dark:border-emerald-900/30">
                  {/* Main Voice Activation Button & Audio Waveform Visualizer */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleToggleBotVoice}
                      className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm cursor-pointer ${
                        isBotListening
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 animate-pulse'
                          : 'bg-[#0d5236] hover:bg-[#093d28] text-white shadow-emerald-900/20 active:scale-98'
                      }`}
                    >
                      {isBotListening ? (
                        <>
                          <MicOff className="w-4 h-4 text-white" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-emerald-200" />
                          <span>Talk to AI Voice Bot</span>
                        </>
                      )}

                      {/* Equalizer Wave bars inside button when active */}
                      {(isBotListening || isBotSpeaking) && (
                        <div className="flex items-center gap-0.5 ml-1 h-4">
                          <span className="w-0.5 bg-white rounded-full animate-voice-wave-1"></span>
                          <span className="w-0.5 bg-white rounded-full animate-voice-wave-2"></span>
                          <span className="w-0.5 bg-white rounded-full animate-voice-wave-3"></span>
                          <span className="w-0.5 bg-white rounded-full animate-voice-wave-4"></span>
                          <span className="w-0.5 bg-white rounded-full animate-voice-wave-5"></span>
                        </div>
                      )}
                    </button>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 dark:bg-[#080d19]/80 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 w-full sm:w-auto justify-center">
                      {isBotListening ? (
                        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                          <Radio className="w-3.5 h-3.5 animate-spin" />
                          <span>Listening to voice...</span>
                        </span>
                      ) : isBotSpeaking ? (
                        <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                          <span>AI Speaking...</span>
                        </span>
                      ) : botStatus === 'processing' ? (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>AI Processing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          <span>AI Ready to Listen</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Voice Error notice if any */}
                  {voiceError && (
                    <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                      <span>{voiceError}</span>
                      <button
                        type="button"
                        onClick={() => setVoiceError('')}
                        className="text-amber-600 hover:text-amber-900 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Live Voice Transcript & Bot Response Bubble */}
                  {(botTranscript || botResponse) && (
                    <div className="space-y-2 p-2.5 rounded-xl bg-white/90 dark:bg-[#080d19]/90 border border-slate-200/70 dark:border-slate-800/80 text-xs">
                      {botTranscript && (
                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">🗣️ You said:</span>
                          <span className="italic break-words">"{botTranscript}"</span>
                        </div>
                      )}
                      {botResponse && (
                        <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800/60 font-medium">
                          <span className="font-bold shrink-0">🤖 STS Bot:</span>
                          <span className="break-words">{botResponse}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestion Prompt Chips */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Tap to Test Voice Command / Quick Fill:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Goa Beach Trip with Alex & Sarah',
                        'Office Lunch in Chennai with Rahul',
                        'Bengaluru Tech Summit with Team',
                        'Mumbai Weekend Getaway',
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleRunBotCommand(prompt)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-[#0d5236] dark:text-emerald-300 font-medium transition cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <Mic className="w-3 h-3 opacity-70" />
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Multilingual Voice Recognition Language Selector (Milestone 1) */}
            <VoiceLanguageSelector
              selectedLang={voiceLang}
              onSelectLang={handleVoiceLangChange}
            />

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Field 1: Ticket Title (with integrated Multilingual Voice Recognition) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Ticket Title
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voice Dictation Enabled
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="e.g. Goa Trip, Office lunch split"
                    className={`w-full bg-slate-50 dark:bg-[#080d19] border rounded-xl pl-4 pr-20 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                      activeVoiceField === 'ticketTitle' || isListeningTitle
                        ? 'border-rose-500 ring-2 ring-rose-400/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-[#0d5236]/40 focus:bg-white dark:focus:bg-[#080d19]'
                    }`}
                  />

                  {/* Voice Recognition Controls directly inside Ticket Title */}
                  <div className="absolute right-2 flex items-center gap-1">
                    {ticketTitle && (
                      <button
                        type="button"
                        onClick={() => setTicketTitle('')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-lg"
                        title="Clear title"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <VoiceMicButton
                      isListening={activeVoiceField === 'ticketTitle' || isListeningTitle}
                      onClick={handleToggleTitleVoice}
                      title="Voice dictation for Ticket Title"
                    />
                  </div>
                </div>

                {/* Status banner for Ticket Title */}
                <VoiceStatusBanner
                  activeField={activeVoiceField || (isListeningTitle ? 'ticketTitle' : null)}
                  targetField="ticketTitle"
                  status={voiceStatus}
                  message={voiceStatusMessage}
                  onStop={stopAllVoice}
                  onDismiss={() => {
                    setVoiceStatus('idle');
                    setVoiceStatusMessage('');
                  }}
                />
              </div>

              {/* Field 2: Location (Added directly below Ticket Title) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Trip / Venue Location</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voice Dictation
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={ticketLocation}
                    onChange={(e) => setTicketLocation(e.target.value)}
                    placeholder="e.g. Goa, Chennai, Bengaluru, Mumbai, Puducherry..."
                    className={`w-full bg-slate-50 dark:bg-[#080d19] border rounded-xl pl-9 pr-20 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                      activeVoiceField === 'ticketLocation'
                        ? 'border-rose-500 ring-2 ring-rose-400/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-[#0d5236]/40 focus:bg-white dark:focus:bg-[#080d19]'
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute right-2 flex items-center gap-1">
                    {ticketLocation && (
                      <button
                        type="button"
                        onClick={() => setTicketLocation('')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition rounded-lg"
                        title="Clear location"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <VoiceMicButton
                      isListening={activeVoiceField === 'ticketLocation'}
                      onClick={() => toggleFieldVoice('ticketLocation', setTicketLocation)}
                      title="Voice dictation for Location"
                    />
                  </div>
                </div>
                <VoiceStatusBanner
                  activeField={activeVoiceField}
                  targetField="ticketLocation"
                  status={voiceStatus}
                  message={voiceStatusMessage}
                  onStop={stopAllVoice}
                  onDismiss={() => {
                    setVoiceStatus('idle');
                    setVoiceStatusMessage('');
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter a city name to automatically load famous tourist places and map navigation.
                </p>
              </div>

              {/* Field 3: Group Currency & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Group Currency
                  </label>
                  <select
                    value={ticketCurrency}
                    onChange={(e) => setTicketCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d5236]/40 focus:bg-white transition cursor-pointer"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Mic className="w-3 h-3" /> Voice
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Optional details"
                      className={`w-full bg-slate-50 dark:bg-[#080d19] border rounded-xl pl-4 pr-12 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                        activeVoiceField === 'ticketDescription'
                          ? 'border-rose-500 ring-2 ring-rose-400/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-[#0d5236]/40 focus:bg-white transition'
                      }`}
                    />
                    <div className="absolute right-2 flex items-center">
                      <VoiceMicButton
                        isListening={activeVoiceField === 'ticketDescription'}
                        onClick={() => toggleFieldVoice('ticketDescription', setTicketDescription)}
                        title="Voice dictation for Description"
                      />
                    </div>
                  </div>
                  <VoiceStatusBanner
                    activeField={activeVoiceField}
                    targetField="ticketDescription"
                    status={voiceStatus}
                    message={voiceStatusMessage}
                    onStop={stopAllVoice}
                    onDismiss={() => {
                      setVoiceStatus('idle');
                      setVoiceStatusMessage('');
                    }}
                  />
                </div>
              </div>

              {/* Field 4: Participants List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                    Participants List
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voice Input
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5 relative flex items-center">
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Add participant name..."
                      className={`w-full bg-slate-50 dark:bg-[#080d19] border rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        activeVoiceField === 'participantName'
                          ? 'border-rose-500 ring-2 ring-rose-400/40'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-[#0d5236]/40 focus:bg-white'
                      }`}
                    />
                    <div className="absolute right-1.5 flex items-center">
                      <VoiceMicButton
                        size="sm"
                        isListening={activeVoiceField === 'participantName'}
                        onClick={() => toggleFieldVoice('participantName', setParticipantName)}
                        title="Voice dictation for Participant Name"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="enter mail"
                      className="w-full bg-slate-50 dark:bg-[#080d19] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d5236]/40 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="w-full h-full py-2 px-3 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white text-xs font-bold transition shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <VoiceStatusBanner
                  activeField={activeVoiceField}
                  targetField="participantName"
                  status={voiceStatus}
                  message={voiceStatusMessage}
                  onStop={stopAllVoice}
                  onDismiss={() => {
                    setVoiceStatus('idle');
                    setVoiceStatusMessage('');
                  }}
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  {participants.map((p) => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${p.isSelf
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5236] dark:text-emerald-400 border-emerald-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      <span>{p.name}</span>
                      {!p.isSelf && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="hover:text-rose-600 transition ml-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0d5236] hover:bg-[#093d28] text-white font-bold text-sm shadow-md transition cursor-pointer active:scale-95"
              >
                Create Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}