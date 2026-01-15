import React from 'react';

interface StartScreenProps {
  onStart: () => void;
  subtitle?: string;
  buttonText?: string;
}

/**
 * Componente de tela inicial/menu.
 * Exibe o título do jogo e um botão para iniciar.
 */
export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  subtitle = "Sobreviva ao enxame cibernético",
  buttonText = "INICIAR MISSÃO"
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black via-slate-950 to-black z-50 touch-auto overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 w-72 h-72 bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] -right-24 w-80 h-80 bg-purple-500/25 blur-3xl" />

      <div className="relative mx-4 w-full max-w-2xl text-center animate-fade-in flex flex-col items-center">
        <div className="w-full rounded-2xl border border-cyan-500/30 bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.45)] px-6 py-8 md:px-10 md:py-10 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/logo.svg"
              alt="Neon Survivor Logo"
              className="w-[75%] md:w-[520px] max-w-full h-auto drop-shadow-[0_0_30px_rgba(0,255,255,0.4)]"
            />

            <p className="text-lg md:text-xl text-cyan-100 tracking-[0.25em] uppercase font-light">
              {subtitle}
            </p>

            <p className="text-[11px] md:text-xs text-gray-400 font-mono mt-1">
              v1.1 – Mobile, iPad & Performance Update
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-[10px] md:text-xs text-cyan-100/80 uppercase">
            <span className="px-3 py-1 rounded-full border border-cyan-400/60 bg-cyan-500/10 tracking-[0.18em]">
              Arena Roguelike
            </span>
            <span className="px-3 py-1 rounded-full border border-purple-400/60 bg-purple-500/10 tracking-[0.18em]">
              Waves Infinitas
            </span>
            <span className="px-3 py-1 rounded-full border border-emerald-400/60 bg-emerald-500/10 tracking-[0.18em]">
              Power-Ups e Boss
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-[11px] md:text-xs text-gray-200">
            <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-4 py-3">
              <span className="text-xl">🕹️</span>
              <span className="font-semibold tracking-[0.18em] uppercase text-cyan-300">Movimento</span>
              <span className="font-mono text-[10px] text-gray-300/90">WASD • Joystick Virtual</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-4 py-3">
              <span className="text-xl">🎯</span>
              <span className="font-semibold tracking-[0.18em] uppercase text-purple-300">Tiro</span>
              <span className="font-mono text-[10px] text-gray-300/90">Mouse • Toque na Tela</span>
            </div>
            <div className="flex flex-col items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-4 py-3">
              <span className="text-xl">⚡</span>
              <span className="font-semibold tracking-[0.18em] uppercase text-emerald-300">Progresso</span>
              <span className="font-mono text-[10px] text-gray-300/90">Colete XP, Evolua e vença o Boss</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              onClick={onStart}
              className="group relative px-10 py-4 md:px-16 md:py-5 overflow-hidden border border-cyan-400/80 bg-cyan-500/20 hover:bg-cyan-400/80 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative text-lg md:text-2xl font-black tracking-[0.35em] text-cyan-50 group-hover:text-black drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]">
                {buttonText}
              </span>
            </button>

            <p className="text-[11px] md:text-xs text-gray-400 font-mono">
              Dica: no mobile use o Joystick Virtual e toque para atirar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
