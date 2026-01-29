"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Mic, Volume2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Button } from "./ui/button";

interface MonalisaCallModeProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;
  onSwitchToChat?: () => void;
  className?: string;
}

function PureMonalisaCallMode({
  isActive,
  isListening,
  isSpeaking,
  isProcessing,
  onStartCall,
  onEndCall,
  onMuteToggle,
  isMuted,
  onSwitchToChat,
  className,
}: MonalisaCallModeProps) {
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(24).fill(0.3));
  const [rotation, setRotation] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotation animation for rings
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setPulseScale(1 + Math.sin(Date.now() / 200) * 0.05);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setPulseScale(1);
    }
  }, [isListening, isSpeaking]);

  // Audio visualization
  useEffect(() => {
    const interval = setInterval(() => {
      if (isListening || isSpeaking) {
        setAudioLevels(
          Array.from({ length: 24 }, () => 0.3 + Math.random() * 0.7)
        );
      } else if (isProcessing) {
        // Wave pattern when processing
        const time = Date.now() / 200;
        setAudioLevels(
          Array.from({ length: 24 }, (_, i) =>
            0.3 + Math.sin(time + i * 0.3) * 0.3
          )
        );
      } else {
        // Gentle idle animation
        const time = Date.now() / 1000;
        setAudioLevels(
          Array.from({ length: 24 }, (_, i) =>
            0.25 + Math.sin(time + i * 0.2) * 0.1
          )
        );
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, isSpeaking, isProcessing]);

  // Determine current state
  const state = isListening
    ? "listening"
    : isSpeaking
    ? "speaking"
    : isProcessing
    ? "processing"
    : "idle";

  const stateText = {
    idle: "AGUARDANDO COMANDO",
    listening: "OUVINDO",
    speaking: "TRANSMITINDO",
    processing: "PROCESSANDO",
  };

  const stateColor = {
    idle: "text-cyan-500",
    listening: "text-blue-400",
    speaking: "text-cyan-400",
    processing: "text-yellow-500",
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-hidden",
        "bg-black",
        className
      )}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Ambient Glow */}
      <div
        className={cn(
          "absolute w-[600px] h-[600px] rounded-full blur-[150px] transition-all duration-1000",
          state === "listening" && "bg-blue-500/40",
          state === "speaking" && "bg-cyan-500/30",
          state === "processing" && "bg-yellow-500/20",
          state === "idle" && "bg-cyan-500/10"
        )}
      />

      {/* Top Left - Status */}
      <div className="absolute top-8 left-8 font-mono text-xs text-cyan-500/70">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            state === "idle" && "bg-cyan-500",
            state === "listening" && "bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]",
            state === "speaking" && "bg-cyan-400 animate-pulse",
            state === "processing" && "bg-yellow-500 animate-pulse"
          )} />
          <span>SISTEMA ATIVO</span>
        </div>
        <div className="text-cyan-500/50">
          <div>LATÊNCIA: 12ms</div>
          <div>CONEXÃO: ESTÁVEL</div>
        </div>
      </div>

      {/* Top Right - Time & Date */}
      <div className="absolute top-8 right-8 font-mono text-right">
        <div className="text-4xl font-light text-cyan-400 tracking-wider">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-sm text-cyan-500/50 mt-1">
          {currentTime.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }).toUpperCase()}
        </div>
      </div>

      {/* Main Circle Interface */}
      <div
        className="relative flex items-center justify-center"
        style={{ transform: `scale(${pulseScale})` }}
      >
        {/* Outer Ring 3 */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full border border-cyan-500/20"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-cyan-500/30"
              style={{
                height: i % 5 === 0 ? '15px' : '8px',
                left: '50%',
                top: '0',
                transformOrigin: '50% 250px',
                transform: `rotate(${i * 6}deg)`,
              }}
            />
          ))}
        </div>

        {/* Outer Ring 2 */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full border-2 border-cyan-500/30"
          style={{ transform: `rotate(${-rotation * 0.7}deg)` }}
        >
          {/* Arc segments */}
          {[0, 90, 180, 270].map((angle) => (
            <div
              key={angle}
              className="absolute w-full h-full"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div
                className="absolute top-0 left-1/2 w-20 h-1 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
              />
            </div>
          ))}
        </div>

        {/* Audio Visualization Ring */}
        <div className="absolute w-[350px] h-[350px] flex items-center justify-center">
          {audioLevels.map((level, index) => {
            const angle = (index / audioLevels.length) * 360 - 90;
            const radians = (angle * Math.PI) / 180;
            const radius = 160;
            const x = Math.cos(radians) * radius;
            const y = Math.sin(radians) * radius;

            return (
              <div
                key={index}
                className={cn(
                  "absolute w-1 rounded-full transition-all duration-75",
                  state === "listening" && "bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]",
                  state === "speaking" && "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]",
                  state === "processing" && "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                  state === "idle" && "bg-cyan-500/50"
                )}
                style={{
                  height: `${level * 40 + 10}px`,
                  transform: `translate(${x}px, ${y}px) rotate(${angle + 90}deg)`,
                  transformOrigin: 'center bottom',
                }}
              />
            );
          })}
        </div>

        {/* Inner Ring */}
        <div
          className={cn(
            "absolute w-[280px] h-[280px] rounded-full border transition-all duration-500",
            state === "listening" && "border-blue-400/70 shadow-[0_0_20px_rgba(96,165,250,0.3)]",
            state === "speaking" && "border-cyan-400/50",
            state === "processing" && "border-yellow-500/50",
            state === "idle" && "border-cyan-500/30"
          )}
          style={{ transform: `rotate(${rotation * 1.5}deg)` }}
        />

        {/* Core Circle */}
        <div
          className={cn(
            "relative w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center",
            "bg-gradient-to-br from-slate-900/90 to-black",
            "border transition-all duration-500",
            state === "listening" && "border-blue-400 shadow-[0_0_80px_rgba(96,165,250,0.5)]",
            state === "speaking" && "border-cyan-400/70 shadow-[0_0_60px_rgba(34,211,238,0.3)]",
            state === "processing" && "border-yellow-500/70 shadow-[0_0_60px_rgba(234,179,8,0.3)]",
            state === "idle" && "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]"
          )}
        >
          {/* MONALISA Text */}
          <h1 className="font-mono text-2xl font-bold tracking-[0.2em] text-cyan-400 mb-2">
            MONALISA
          </h1>

          {/* Status Icon */}
          <div className="my-3">
            {state === "listening" && (
              <Mic className="w-8 h-8 text-blue-400 animate-pulse drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
            )}
            {state === "speaking" && (
              <Volume2 className="w-8 h-8 text-cyan-400 animate-pulse" />
            )}
            {(state === "idle" || state === "processing") && (
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-t-transparent animate-spin",
                state === "processing" ? "border-yellow-500" : "border-cyan-500/50"
              )} style={{ animationDuration: state === "processing" ? "1s" : "3s" }} />
            )}
          </div>

          {/* Status Text */}
          <span className={cn(
            "font-mono text-xs tracking-widest transition-colors duration-300",
            stateColor[state]
          )}>
            {stateText[state]}
          </span>
        </div>

        {/* Decorative corner brackets */}
        {['-top-2 -left-2', '-top-2 -right-2', '-bottom-2 -left-2', '-bottom-2 -right-2'].map((pos, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-8 h-8 border-cyan-500/30",
              pos,
              i < 2 ? "border-t-2" : "border-b-2",
              i % 2 === 0 ? "border-l-2" : "border-r-2"
            )}
          />
        ))}
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-8">
        {/* Left indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-500/50">
          <div className="w-16 h-1 bg-gradient-to-r from-transparent to-cyan-500/50" />
          <span>VOZ</span>
        </div>

        {/* Center status */}
        <div className={cn(
          "px-6 py-2 rounded-full border font-mono text-sm tracking-wider transition-all duration-300",
          state === "listening" && "border-blue-400/70 text-blue-300 bg-blue-500/20 shadow-[0_0_20px_rgba(96,165,250,0.3)]",
          state === "speaking" && "border-cyan-500/50 text-cyan-400 bg-cyan-500/10",
          state === "processing" && "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
          state === "idle" && "border-cyan-500/30 text-cyan-500/70 bg-cyan-500/5"
        )}>
          {isActive ? (
            state === "idle" ? "TOQUE PARA FALAR" : stateText[state]
          ) : (
            "CLIQUE PARA INICIAR"
          )}
        </div>

        {/* Right indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-500/50">
          <span>REDE</span>
          <div className="w-16 h-1 bg-gradient-to-l from-transparent to-cyan-500/50" />
        </div>
      </div>

      {/* Start/Stop Button (invisible overlay when active) */}
      {!isActive ? (
        <button
          onClick={onStartCall}
          className="absolute inset-0 cursor-pointer"
          aria-label="Iniciar Monalisa"
        />
      ) : (
        <button
          onClick={isListening ? undefined : onStartCall}
          className="absolute inset-0 cursor-pointer"
          aria-label="Falar com Monalisa"
        />
      )}

      {/* Mute indicator */}
      {isMuted && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50 font-mono text-sm text-red-400">
          MICROFONE DESATIVADO
        </div>
      )}

      {/* Switch to Chat Button */}
      {onSwitchToChat && (
        <Button
          onClick={onSwitchToChat}
          variant="outline"
          size="sm"
          className="absolute bottom-8 right-8 gap-2 bg-black/50 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 font-mono"
        >
          <MessageSquare className="w-4 h-4" />
          <span>MODO CHAT</span>
        </Button>
      )}

      {/* End Call Button (when active) */}
      {isActive && (
        <Button
          onClick={onEndCall}
          variant="outline"
          size="sm"
          className="absolute bottom-8 left-8 gap-2 bg-black/50 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-mono"
        >
          <span>ENCERRAR</span>
        </Button>
      )}
    </div>
  );
}

export const MonalisaCallMode = memo(PureMonalisaCallMode);
