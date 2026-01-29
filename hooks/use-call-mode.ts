"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceChat } from "./use-voice-chat";

interface UseCallModeOptions {
  onSendMessage: (text: string) => void;
  language?: string;
}

export function useCallMode(options: UseCallModeOptions) {
  const { onSendMessage, language = "pt-BR" } = options;

  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingMessageRef = useRef<string>("");
  const shouldListenAfterSpeakRef = useRef(false);
  const wasInterruptedRef = useRef(false);

  const isSpeakingRef = useRef(false);

  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  } = useVoiceChat({
    language,
    voiceEnabled: true,
    autoSendDelay: 2000, // Wait 2 seconds of silence before processing
    keepListeningWhileSpeaking: true, // Don't stop listening when speaking
    onTranscript: (text) => {
      // Store the current transcript
      pendingMessageRef.current = text;

      // If Monalisa is speaking and user starts talking, interrupt Monalisa
      if (isSpeakingRef.current && text.length > 0) {
        console.log("[CallMode] User interrupted Monalisa, stopping speech");
        wasInterruptedRef.current = true;
        stopSpeaking();
      }
    },
    onFinalTranscript: (text) => {
      // User finished speaking - send message and wait for response
      if (text.trim() && isCallActive && !isMuted) {
        console.log("[CallMode] Sending message:", text);
        setIsProcessing(true);
        onSendMessage(text.trim());
        pendingMessageRef.current = "";
        wasInterruptedRef.current = false;
      }
    },
  });

  // Keep ref in sync with state
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Start a call
  const startCall = useCallback(() => {
    console.log("[CallMode] Starting call");
    setIsCallActive(true);
    setIsMuted(false);
    // Start listening immediately
    setTimeout(() => {
      startListening();
    }, 500);
  }, [startListening]);

  // End a call
  const endCall = useCallback(() => {
    console.log("[CallMode] Ending call");
    setIsCallActive(false);
    setIsMuted(false);
    setIsProcessing(false);
    stopListening();
    stopSpeaking();
    pendingMessageRef.current = "";
  }, [stopListening, stopSpeaking]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        stopListening();
      } else if (isCallActive && !isSpeaking) {
        startListening();
      }
      return newMuted;
    });
  }, [isCallActive, isSpeaking, startListening, stopListening]);

  // Speak Monalisa's response
  const speakResponse = useCallback((text: string) => {
    if (!isCallActive) return;

    console.log("[CallMode] Monalisa speaking:", text.substring(0, 50) + "...");
    setIsProcessing(false);
    shouldListenAfterSpeakRef.current = true;

    // Keep listening while Monalisa speaks so user can interrupt
    // Don't stop listening - this allows interruption detection
    speak(text);
  }, [isCallActive, speak]);

  // Resume listening after Monalisa finishes speaking (only if not already listening)
  useEffect(() => {
    if (isCallActive && !isSpeaking && shouldListenAfterSpeakRef.current && !isMuted && !isListening) {
      shouldListenAfterSpeakRef.current = false;
      console.log("[CallMode] Monalisa finished speaking, resuming listening");
      setTimeout(() => {
        startListening();
      }, 300);
    }
  }, [isCallActive, isSpeaking, isMuted, isListening, startListening]);

  // Mark processing as done when we receive a response
  const markResponseReceived = useCallback(() => {
    setIsProcessing(false);
  }, []);

  return {
    // State
    isCallActive,
    isListening: isListening && !isMuted,
    isSpeaking,
    isProcessing,
    isMuted,
    isSupported,
    currentTranscript: pendingMessageRef.current,

    // Actions
    startCall,
    endCall,
    toggleMute,
    speakResponse,
    markResponseReceived,
  };
}
