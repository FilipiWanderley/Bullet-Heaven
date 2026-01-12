import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  // Configuração
  const maxRadius = 50; // Raio máximo do movimento do stick

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setOrigin({ x: centerX, y: centerY });
      setActive(true);
      updatePosition(touch.clientX, touch.clientY, centerX, centerY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!active) return;
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY, origin.x, origin.y);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setActive(false);
      setPosition({ x: 0, y: 0 });
      onMove(0, 0);
    };

    const updatePosition = (clientX: number, clientY: number, centerX: number, centerY: number) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const clampedDist = Math.min(distance, maxRadius);
      const x = Math.cos(angle) * clampedDist;
      const y = Math.sin(angle) * clampedDist;

      setPosition({ x, y });

      // Normaliza para -1 a 1
      onMove(x / maxRadius, y / maxRadius);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [active, origin, onMove]);

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm touch-none flex items-center justify-center z-50 md:hidden"
    >
      {/* Base */}
      <div className="w-2 h-2 rounded-full bg-white/30 absolute" />
      
      {/* Stick */}
      <div 
        className="w-12 h-12 rounded-full bg-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.6)] absolute transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      />
    </div>
  );
};
