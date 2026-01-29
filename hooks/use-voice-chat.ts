"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInterface, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInterface, ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void; // Called when user stops speaking
  onListeningChange?: (isListening: boolean) => void;
  language?: string;
  voiceEnabled?: boolean;
  autoSendDelay?: number; // Delay in ms before auto-sending (default: 1500)
  keepListeningWhileSpeaking?: boolean; // Don't stop listening when speaking (for interruption)
}

interface VoiceSettings {
  pitch: number;
  rate: number;
  volume: number;
  voiceName?: string;
}

// Monalisa voice settings - natural speed
const MONALISA_VOICE_SETTINGS: VoiceSettings = {
  pitch: 1.0,      // Natural pitch
  rate: 0.95,      // Slightly slower for clarity
  volume: 1.0,
  voiceName: undefined, // Will be set dynamically
};

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const {
    onTranscript,
    onFinalTranscript,
    onListeningChange,
    language = "pt-BR",
    voiceEnabled = true,
    autoSendDelay = 1500, // Wait 1.5s of silence before auto-sending
    keepListeningWhileSpeaking = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(MONALISA_VOICE_SETTINGS);

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const shouldRestartRef = useRef(false);
  const transcriptRef = useRef("");

  // Store callbacks in refs to avoid useEffect re-runs
  const onTranscriptRef = useRef(onTranscript);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onListeningChangeRef = useRef(onListeningChange);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef("");

  // Keep refs updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onListeningChangeRef.current = onListeningChange;
  }, [onListeningChange]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for Speech Recognition support
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = (
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
    ) as SpeechRecognitionConstructor | undefined;

    console.log("[VoiceChat] SpeechRecognition available:", !!SpeechRecognitionCtor);

    if (SpeechRecognitionCtor) {
      const recognition: SpeechRecognitionInterface = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("[VoiceChat] Recognition started");
        setIsListening(true);
        onListeningChangeRef.current?.(true);
      };

      recognition.onend = () => {
        console.log("[VoiceChat] Recognition ended, shouldRestart:", shouldRestartRef.current);

        // Auto-restart if should continue listening (no time limit)
        if (shouldRestartRef.current) {
          console.log("[VoiceChat] Restarting recognition...");
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.error("[VoiceChat] Failed to restart recognition:", e);
              setIsListening(false);
              onListeningChangeRef.current?.(false);
            }
          }, 100);
        } else {
          setIsListening(false);
          onListeningChangeRef.current?.(false);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Only process NEW results (from resultIndex), not old ones
        let finalTranscript = "";
        let interimTranscript = "";

        // IMPORTANT: Start from resultIndex to avoid repeating old transcripts
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0]?.transcript ?? "";
          } else {
            interimTranscript += result[0]?.transcript ?? "";
          }
        }

        console.log("[VoiceChat] Transcript - Final:", finalTranscript, "Interim:", interimTranscript);

        // Build current text from accumulated transcript + new interim
        const displayText = transcriptRef.current + (transcriptRef.current && interimTranscript ? " " : "") + interimTranscript;

        // Show real-time feedback
        if (displayText || finalTranscript) {
          onTranscriptRef.current?.(displayText || finalTranscript);
        }

        if (finalTranscript) {
          // Append to accumulated transcript
          transcriptRef.current += (transcriptRef.current ? " " : "") + finalTranscript;
          lastTranscriptRef.current = transcriptRef.current;

          // Update display with full transcript
          onTranscriptRef.current?.(transcriptRef.current);

          // Clear any existing auto-send timer
          if (autoSendTimerRef.current) {
            clearTimeout(autoSendTimerRef.current);
          }

          // Set timer to auto-send after silence
          autoSendTimerRef.current = setTimeout(() => {
            const textToSend = lastTranscriptRef.current.trim();
            if (textToSend && onFinalTranscriptRef.current) {
              console.log("[VoiceChat] Auto-sending after silence:", textToSend);
              onFinalTranscriptRef.current(textToSend);

              // IMPORTANT: Stop recognition to clear all results
              if (recognitionRef.current) {
                shouldRestartRef.current = false;
                recognitionRef.current.stop();
              }

              // Clear transcript for next message
              transcriptRef.current = "";
              lastTranscriptRef.current = "";
            }
          }, autoSendDelay);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Don't stop for no-speech errors, just continue listening
        if (event.error === "no-speech") {
          // This is normal - user just hasn't spoken yet
          return;
        }

        console.warn("[VoiceChat] Recognition error:", event.error);

        if (event.error === "aborted" || event.error === "network") {
          setIsListening(false);
          onListeningChangeRef.current?.(false);
        }
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
      console.log("[VoiceChat] Speech recognition initialized successfully");
    } else {
      console.warn("[VoiceChat] Speech recognition not supported in this browser");
    }

    // Initialize Speech Synthesis
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        console.log("[Monalisa] Available voices:", voices.map(v => `${v.name} (${v.lang})`));

        // Try to find the most natural Portuguese Brazilian voice for Monalisa
        // Microsoft "Online (Natural)" voices are the most human-like
        const preferredVoices = [
          // Microsoft Natural voices (most human-like) - Edge browser
          "Microsoft Francisca Online (Natural)",  // Brazilian Portuguese Natural female
          "Microsoft Antonio Online (Natural)",    // Brazilian Portuguese Natural male
          "Microsoft Thalita Online (Natural)",    // Brazilian Portuguese Natural
          // Microsoft standard voices
          "Microsoft Daniel",             // Microsoft Brazilian Portuguese
          "Microsoft Maria",              // Microsoft Portuguese
          // macOS voices
          "Luciana",                      // macOS Brazilian Portuguese
          "Daniel",                       // macOS Brazilian Portuguese
          // Google voices (less natural but widely available)
          "Google português do Brasil",   // Google's Brazilian Portuguese
          "Google português",             // Google Portuguese
        ];

        let selected: SpeechSynthesisVoice | undefined;

        // First try to find a preferred voice (in order of preference)
        for (const pv of preferredVoices) {
          selected = voices.find((v) =>
            v.name.toLowerCase().includes(pv.toLowerCase())
          );
          if (selected) {
            console.log("[Monalisa] Found preferred voice:", selected.name);
            break;
          }
        }

        // Fallback: find any "Natural" voice in Portuguese
        if (!selected) {
          selected = voices.find((v) =>
            v.name.includes("Natural") && v.lang.startsWith("pt")
          );
        }

        // Fallback: find any Portuguese Brazilian voice
        if (!selected) {
          selected = voices.find((v) => v.lang === "pt-BR");
        }

        // Fallback: find any Portuguese voice
        if (!selected) {
          selected = voices.find((v) => v.lang.startsWith("pt"));
        }

        // Fallback: find any voice matching the language setting
        if (!selected) {
          selected = voices.find((v) =>
            v.lang.startsWith(language.split("-")[0])
          );
        }

        // Last fallback: first available voice
        if (!selected && voices.length > 0) {
          selected = voices[0];
        }

        console.log("[Monalisa] Selected voice:", selected?.name, selected?.lang);
        setSelectedVoice(selected || null);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [language, autoSendDelay]);

  // Start listening
  const startListening = useCallback(() => {
    console.log("[VoiceChat] startListening called, recognition:", !!recognitionRef.current);
    if (!recognitionRef.current) return;

    // Clear all previous transcripts to avoid repetition bug
    transcriptRef.current = "";
    lastTranscriptRef.current = "";

    // Clear any pending auto-send timer
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    shouldRestartRef.current = true;

    // Only stop speech if not keeping listening while speaking
    if (synthRef.current && !keepListeningWhileSpeaking) {
      synthRef.current.cancel();
    }

    try {
      recognitionRef.current.start();
      console.log("[VoiceChat] Recognition start() called");
    } catch (e) {
      // Already started, ignore
      console.error("[VoiceChat] Recognition start error:", e);
    }
  }, [keepListeningWhileSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    return transcriptRef.current;
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      return stopListening();
    } else {
      startListening();
      return "";
    }
  }, [isListening, startListening, stopListening]);

  // Speak text with Monalisa's natural voice
  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !voiceEnabled) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.pitch = voiceSettings.pitch;
      utterance.rate = voiceSettings.rate;
      utterance.volume = voiceSettings.volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        // "interrupted" and "canceled" are expected when user interrupts Monalisa
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("Speech synthesis error:", event.error);
        }
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [selectedVoice, voiceEnabled, voiceSettings]
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Update voice settings
  const updateVoiceSettings = useCallback((settings: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  // Select a specific voice
  const selectVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    // State
    isListening,
    isSpeaking,
    isSupported,
    availableVoices,
    selectedVoice,
    voiceSettings,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    updateVoiceSettings,
    selectVoice,
  };
}

