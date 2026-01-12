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
}

/**
 * Heads-Up Display (HUD) do jogo.
 * Exibe informações vitais como Score, High Score, Nível, XP, Vida e Boss Health.
 */
export const HUD: React.FC<HUDProps> = ({ score, highScore, level, xp, maxXp, hp, maxHp, boss }) => {
  // Calcula a porcentagem de XP para a barra de progresso
  const xpPercentage = Math.min(100, Math.max(0, (xp / maxXp) * 100));
  // Calcula a porcentagem de HP
  const hpPercentage = Math.min(100, Math.max(0, (hp / maxHp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar: Level, Score & Boss */}
      <div className="w-full flex flex-col gap-4">
        
        {/* Main Stats Row */}
        <div className="flex justify-between items-start w-full">
          
          {/* Player Stats Container (Level, XP, HP) */}
          <div className="flex flex-col gap-2 w-72">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                LVL {level}
              </span>
              <span className="text-sm text-cyan-200/70">
                {xp} / {maxXp} XP
              </span>
            </div>
            
            {/* XP Bar */}
            <div className="w-full h-2 bg-gray-900/80 border border-cyan-900/50 rounded-sm overflow-hidden mb-1">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-400 w-6">HP</span>
                <div className="flex-1 h-4 bg-gray-900/80 border border-red-900/50 rounded-sm overflow-hidden relative">
                    {/* HP Text Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-[10px] font-bold text-white drop-shadow-md">
                            {Math.ceil(hp)} / {maxHp}
                        </span>
                    </div>
                    {/* HP Fill */}
                    <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200 ease-out"
                        style={{ width: `${hpPercentage}%` }}
                    />
                </div>
            </div>
          </div>

          {/* Boss Health Bar (Centered) */}
          {boss && (
            <div className="flex flex-col items-center w-1/3 animate-pulse">
                <span className="text-red-500 font-bold tracking-widest text-lg drop-shadow-[0_0_10px_red]">
                    WARNING: {boss.name}
                </span>
                <div className="w-full h-4 bg-gray-900 border border-red-900 rounded-sm overflow-hidden mt-1">
                    <div 
                        className="h-full bg-red-600 transition-all duration-200"
                        style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                    />
                </div>
            </div>
          )}

          {/* Score Counter */}
          <div className="flex flex-col items-end">
            <div className="flex flex-col items-end mb-2">
                 <span className="text-xs text-yellow-500/80 uppercase tracking-widest">
                  High Score
                </span>
                <span className="text-xl font-mono font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                  {highScore.toLocaleString()}
                </span>
            </div>

            <span className="text-sm text-purple-300/70 uppercase tracking-widest">
              Score
            </span>
            <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
