"use client";

import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";

interface AlfredVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing?: boolean;
  className?: string;
}

function PureAlfredVisualizer({
  isListening,
  isSpeaking,
  isProcessing = false,
  className,
}: AlfredVisualizerProps) {
  const [audioLevels, setAudioLevels] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);

  // Simulate audio visualization
  useEffect(() => {
    if (!isListening && !isSpeaking) {
      // Idle state - gentle pulse
      const interval = setInterval(() => {
        setAudioLevels([0.2, 0.3, 0.4, 0.3, 0.2]);
      }, 500);
      return () => clearInterval(interval);
    }

    // Active state - dynamic bars
    const interval = setInterval(() => {
      setAudioLevels(
        Array.from({ length: 5 }, () => 0.2 + Math.random() * 0.8)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  // Determine current state
  const state = isListening
    ? "listening"
    : isSpeaking
    ? "speaking"
    : isProcessing
    ? "processing"
    : "idle";

  const stateColors = {
    idle: "from-slate-600 to-slate-800",
    listening: "from-red-500 to-red-700",
    speaking: "from-blue-500 to-blue-700",
    processing: "from-yellow-500 to-yellow-700",
  };

  const stateGlow = {
    idle: "shadow-slate-500/20",
    listening: "shadow-red-500/50",
    speaking: "shadow-blue-500/50",
    processing: "shadow-yellow-500/50",
  };

  const stateText = {
    idle: "Pronto para ajudar",
    listening: "Ouvindo...",
    speaking: "Respondendo...",
    processing: "Processando...",
  };

  const stateBorderColor = {
    idle: "border-slate-500/30",
    listening: "border-red-500/50",
    speaking: "border-blue-500/50",
    processing: "border-yellow-500/50",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 p-8",
        className
      )}
    >
      {/* Main Alfred Container */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-3xl border-2 bg-gradient-to-br p-8 transition-all duration-500",
          stateColors[state],
          stateBorderColor[state],
          "shadow-2xl",
          stateGlow[state],
          isListening && "animate-pulse",
          isSpeaking && "scale-105"
        )}
        style={{
          minWidth: "320px",
          minHeight: "200px",
        }}
      >
        {/* Outer Glow Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-3xl opacity-30 blur-xl transition-all duration-500",
            state === "listening" && "bg-red-500 animate-ping",
            state === "speaking" && "bg-blue-500 animate-pulse",
            state === "processing" && "bg-yellow-500 animate-pulse"
          )}
        />

        {/* Audio Visualizer Bars */}
        <div className="relative z-10 mb-4 flex items-end justify-center gap-1">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className={cn(
                "w-3 rounded-full bg-white/80 transition-all duration-100",
                state === "idle" && "bg-white/40"
              )}
              style={{
                height: `${level * 60}px`,
                animationDelay: `${index * 50}ms`,
              }}
            />
          ))}
        </div>

        {/* ALFRED Text */}
        <h1
          className={cn(
            "relative z-10 font-mono text-4xl font-bold tracking-[0.3em] text-white transition-all duration-300",
            state === "listening" && "text-red-100",
            state === "speaking" && "text-blue-100 animate-pulse"
          )}
        >
          ALFRED
        </h1>

        {/* Status Text */}
        <p
          className={cn(
            "relative z-10 mt-3 text-sm font-medium text-white/70 transition-all duration-300"
          )}
        >
          {stateText[state]}
        </p>

        {/* Circular Sound Waves (when active) */}
        {(isListening || isSpeaking) && (
          <>
            <div
              className={cn(
                "absolute inset-0 rounded-3xl border-2 opacity-50",
                state === "listening" ? "border-red-400" : "border-blue-400",
                "animate-ping"
              )}
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-3xl border opacity-30",
                state === "listening" ? "border-red-300" : "border-blue-300",
                "animate-ping"
              )}
              style={{ animationDuration: "2s", animationDelay: "0.5s" }}
            />
          </>
        )}
      </div>

      {/* Voice Mode Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-3 w-3 rounded-full transition-all duration-300",
            state === "idle" && "bg-slate-400",
            state === "listening" && "bg-red-500 animate-pulse",
            state === "speaking" && "bg-blue-500 animate-pulse",
            state === "processing" && "bg-yellow-500 animate-pulse"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {state === "idle"
            ? "Clique em 'Falar' para interagir"
            : state === "listening"
            ? "Estou ouvindo você..."
            : state === "speaking"
            ? "Alfred está respondendo..."
            : "Pensando..."}
        </span>
      </div>
    </div>
  );
}

export const AlfredVisualizer = memo(PureAlfredVisualizer);
