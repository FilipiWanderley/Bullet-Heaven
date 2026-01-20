import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../core/engine/GameEngine';

interface MobileControlsProps {
  engine: GameEngine | null;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ engine }) => {
  const shieldCooldownRef = useRef<HTMLDivElement>(null);
  const eliteCooldownRef = useRef<HTMLDivElement>(null);
  const shieldBtnRef = useRef<HTMLButtonElement>(null);
  const eliteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateCooldowns = () => {
      if (!engine) return;

      const { player } = engine;

      // Update Shield Cooldown Visual
      if (shieldCooldownRef.current) {
        const pct = Math.max(0, player.shieldCooldownTimer / player.shieldCooldown);
        shieldCooldownRef.current.style.height = `${pct * 100}%`;
      }
      
      // Update Elite Cooldown Visual
      if (eliteCooldownRef.current) {
        const pct = Math.max(0, player.eliteCooldown / 30.0); // 30.0 is hardcoded in Player.ts
        eliteCooldownRef.current.style.height = `${pct * 100}%`;
      }

      // Update Button Disabled State (Visual opacity)
      if (shieldBtnRef.current) {
        const disabled = player.shieldCooldownTimer > 0 || player.shieldActive || player.eliteMode;
        shieldBtnRef.current.style.opacity = disabled ? '0.5' : '1.0';
      }

      if (eliteBtnRef.current) {
        const disabled = player.eliteCooldown > 0 || player.eliteMode;
        eliteBtnRef.current.style.opacity = disabled ? '0.5' : '1.0';
      }

      animationFrameId = requestAnimationFrame(updateCooldowns);
    };

    updateCooldowns();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  const handleShieldClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (engine) {
      engine.player.activateShield();
    }
  };

  const handleEliteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (engine) {
        engine.player.activateEliteMode();
    }
  };

  if (!engine) return null;

  return (
    <div className="absolute bottom-8 right-8 flex gap-6 items-end pointer-events-auto touch-none select-none z-50 md:hidden">
      {/* Shield Button */}
      <button
        ref={shieldBtnRef}
        onMouseDown={handleShieldClick}
        onTouchStart={handleShieldClick}
        className="relative w-16 h-16 rounded-full bg-cyan-900/80 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] active:scale-95 transition-transform overflow-hidden flex items-center justify-center"
        aria-label="Activate Shield"
      >
        {/* Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-cyan-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        
        {/* Cooldown Overlay */}
        <div 
          ref={shieldCooldownRef}
          className="absolute bottom-0 left-0 w-full bg-black/60 transition-all duration-75 ease-linear"
          style={{ height: '0%' }}
        />
      </button>

      {/* Elite/Dash Button */}
      <button
        ref={eliteBtnRef}
        onMouseDown={handleEliteClick}
        onTouchStart={handleEliteClick}
        className="relative w-20 h-20 rounded-full bg-purple-900/80 border-2 border-purple-400 shadow-[0_0_15px_rgba(192,38,211,0.5)] active:scale-95 transition-transform overflow-hidden flex items-center justify-center mb-2"
        aria-label="Activate Elite Mode"
      >
        {/* Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>

        {/* Cooldown Overlay */}
        <div 
          ref={eliteCooldownRef}
          className="absolute bottom-0 left-0 w-full bg-black/60 transition-all duration-75 ease-linear"
          style={{ height: '0%' }}
        />
      </button>
    </div>
  );
};
