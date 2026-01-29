"use client";

import { cn } from "@/lib/utils";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { memo } from "react";
import { Button } from "./ui/button";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  disabled?: boolean;
  onToggleListening: () => string | void;
  onStopSpeaking: () => void;
  onSendMessage?: () => void;
  hasText?: boolean;
  voiceModeEnabled?: boolean;
  onToggleVoiceMode?: () => void;
  className?: string;
}

function PureVoiceButton({
  isListening,
  isSpeaking,
  isSupported,
  disabled,
  onToggleListening,
  onStopSpeaking,
  onSendMessage,
  hasText,
  voiceModeEnabled,
  onToggleVoiceMode,
  className,
}: VoiceButtonProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status indicator - shows current state clearly */}
      {isListening && (
        <div className="flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5 animate-pulse">
          <div className="flex items-center gap-1">
            {/* Sound wave animation */}
            <span className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-red-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" />
              <span className="w-0.5 h-4 bg-red-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_0.1s]" />
              <span className="w-0.5 h-2 bg-red-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 h-5 bg-red-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_0.3s]" />
              <span className="w-0.5 h-3 bg-red-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_0.4s]" />
            </span>
          </div>
          <span className="text-sm font-medium text-red-500">Ouvindo...</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600"
            onClick={() => onToggleListening()}
          >
            Parar
          </Button>
        </div>
      )}

      {/* Monalisa speaking indicator */}
      {isSpeaking && !isListening && (
        <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1.5">
          <Volume2 className="size-4 text-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-500">Monalisa falando...</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-600"
            onClick={onStopSpeaking}
          >
            Parar
          </Button>
        </div>
      )}

      {/* Main controls - only show when not listening */}
      {!isListening && !isSpeaking && (
        <>
          {/* Microphone button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 transition-all duration-200",
              !isSupported && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => onToggleListening()}
            disabled={disabled || !isSupported}
          >
            <Mic className="size-4" />
            <span className="text-sm">Falar</span>
          </Button>

          {/* Voice mode toggle */}
          {onToggleVoiceMode && (
            <Button
              type="button"
              variant={voiceModeEnabled ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-2 transition-all duration-200",
                voiceModeEnabled && "bg-blue-500 hover:bg-blue-600"
              )}
              onClick={onToggleVoiceMode}
            >
              <Volume2 className="size-4" />
              <span className="text-sm">
                {voiceModeEnabled ? "Voz ON" : "Voz OFF"}
              </span>
            </Button>
          )}
        </>
      )}

      {/* Listening - show send button when there's text */}
      {isListening && hasText && onSendMessage && (
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-2 bg-green-500 hover:bg-green-600"
          onClick={() => {
            onToggleListening();
            onSendMessage();
          }}
        >
          Enviar
        </Button>
      )}
    </div>
  );
}

export const VoiceButton = memo(PureVoiceButton);

// Voice indicator component to show when Monalisa is speaking
interface VoiceIndicatorProps {
  isSpeaking: boolean;
  className?: string;
}

export function VoiceIndicator({ isSpeaking, className }: VoiceIndicatorProps) {
  if (!isSpeaking) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-500",
        className
      )}
    >
      <Volume2 className="size-4 animate-pulse" />
      <span>Monalisa está falando...</span>
    </div>
  );
}
