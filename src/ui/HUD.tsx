import React from 'react';

interface HUDProps {
  score: number;
  highScore: number;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  boss?: {
    hp: number;
    maxHp: number;
    name: string;
  } | null;
  shieldCooldown: number;
  shieldMaxCooldown: number;
  eliteCooldown: number;
  eliteMaxCooldown: number;
  debugInfo?: string;
}

export const HUD: React.FC<HUDProps> = ({ 
  score, 
  highScore, 
  level, 
  xp, 
  maxXp, 
  hp, 
  maxHp, 
  boss, 
  shieldCooldown,
  shieldMaxCooldown,
  eliteCooldown,
  eliteMaxCooldown,
  debugInfo 
}) => {
  // Calcula a porcentagem de XP para a barra de progresso
  const xpPercentage = Math.min(100, Math.max(0, (xp / maxXp) * 100));
  // Calcula a porcentagem de HP
  const hpPercentage = Math.min(100, Math.max(0, (hp / maxHp) * 100));
  const isLowHp = hp > 0 && hpPercentage <= 25;
  
  const shieldPct = Math.max(0, (shieldCooldown / shieldMaxCooldown) * 100);
  const elitePct = Math.max(0, (eliteCooldown / eliteMaxCooldown) * 100);

  return (
    <div className={`absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between${isLowHp ? ' ring-4 ring-red-500/70 animate-pulse' : ''}`}>
      <div className="w-full flex flex-col gap-3 md:gap-4">
        <div className="flex justify-between items-start w-full gap-3 md:gap-6">
          <div className="flex flex-col gap-2 w-48 md:w-72 px-3 py-2 md:px-4 md:py-3 rounded-xl bg-black/55 border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.45)]">
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-bold text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]">
                LVL {level}
              </span>
              <span className="text-[11px] md:text-xs text-cyan-100/80">
                {xp} / {maxXp} XP
              </span>
            </div>

            <div className="w-full h-2 bg-slate-900/80 border border-cyan-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 w-6">HP</span>
              <div className="flex-1 h-4 bg-slate-900/90 border border-red-900/70 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-[10px] font-bold text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">
                    {Math.ceil(hp)} / {maxHp}
                  </span>
                </div>
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-200 ease-out"
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {boss && (
            <div className="flex flex-col items-center flex-1 px-2 py-1 md:px-4 md:py-2 rounded-xl bg-black/55 border border-red-500/40 shadow-[0_0_28px_rgba(248,113,113,0.55)] mx-2">
              <span className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-red-400 mb-1">
                Boss
              </span>
              <span className="text-xs md:text-base font-bold text-red-300 drop-shadow-[0_0_10px_rgba(248,113,113,0.9)] truncate max-w-[100px] md:max-w-none">
                {boss.name}
              </span>
              <div className="mt-1 md:mt-2 w-full h-2 md:h-3 bg-slate-900/90 border border-red-900/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-red-400 to-rose-400 transition-all duration-200"
                  style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col items-end px-3 py-2 md:px-4 md:py-3 rounded-xl bg-black/55 border border-yellow-400/30 shadow-[0_0_25px_rgba(250,204,21,0.55)] min-w-[100px] md:min-w-[140px]">
            <div className="flex flex-col items-end mb-1">
              <span className="text-[10px] md:text-xs text-yellow-400/90 uppercase tracking-[0.25em]">
                High Score
              </span>
              <span className="text-lg md:text-xl font-mono font-bold text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]">
                {highScore.toLocaleString()}
              </span>
            </div>

            <span className="text-[10px] md:text-xs text-purple-300/80 uppercase tracking-[0.25em]">
              Score Atual
            </span>
            <span className="text-3xl md:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_14px_rgba(255,255,255,0.45)]">
              {score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Skills HUD (Hidden on Mobile) */}
      <div className="absolute bottom-8 right-8 hidden md:flex gap-6 items-end">
         {/* Shield Skill */}
         <div className="relative flex flex-col items-center gap-2">
           <span className="text-[10px] text-cyan-200/70 font-mono tracking-widest bg-black/40 px-2 py-0.5 rounded border border-cyan-500/20">E</span>
           <div className={`w-14 h-14 rounded-xl bg-black/60 border-2 flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${shieldPct > 0 ? 'border-cyan-900/50' : 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 transition-all duration-200 ${shieldPct > 0 ? 'text-cyan-800' : 'text-cyan-100'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {/* Cooldown Overlay */}
              <div className="absolute bottom-0 left-0 w-full bg-black/60 transition-all duration-100 ease-linear" style={{ height: `${shieldPct}%` }} />
           </div>
         </div>

         {/* Elite Skill */}
         <div className="relative flex flex-col items-center gap-2">
           <span className="text-[10px] text-orange-200/70 font-mono tracking-widest bg-black/40 px-2 py-0.5 rounded border border-orange-500/20">R</span>
           <div className={`w-14 h-14 rounded-xl bg-black/60 border-2 flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${elitePct > 0 ? 'border-orange-900/50' : 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 transition-all duration-200 ${elitePct > 0 ? 'text-orange-800' : 'text-orange-100'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {/* Cooldown Overlay */}
              <div className="absolute bottom-0 left-0 w-full bg-black/60 transition-all duration-100 ease-linear" style={{ height: `${elitePct}%` }} />
           </div>
         </div>
      </div>

      {debugInfo && (
        <div className="absolute bottom-4 left-4 text-xs font-mono text-green-500 bg-black/50 p-2 rounded pointer-events-auto select-text">
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  );
};
