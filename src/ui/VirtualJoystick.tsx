import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  
  // Use refs for mutable state to avoid re-binding listeners
  const stateRef = useRef({
    active: false,
    origin: { x: 0, y: 0 }
  });

  const maxRadius = 50;
  const deadZoneRatio = 0.25;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      stateRef.current.active = true;
      stateRef.current.origin = { x: centerX, y: centerY };
      setIsActive(true);
      
      updatePosition(touch.clientX, touch.clientY, centerX, centerY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!stateRef.current.active) return;
      
      const touch = e.touches[0];
      const { x, y } = stateRef.current.origin;
      updatePosition(touch.clientX, touch.clientY, x, y);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stateRef.current.active = false;
      setPosition({ x: 0, y: 0 });
      onMove(0, 0);
      setIsActive(false);
    };

    const updatePosition = (clientX: number, clientY: number, centerX: number, centerY: number) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) {
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }

      const clampedDist = Math.min(distance, maxRadius);
      const deadZoneRadius = maxRadius * deadZoneRatio;

      if (clampedDist < deadZoneRadius) {
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }

      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * clampedDist;
      const y = Math.sin(angle) * clampedDist;

      setPosition({ x, y });

      const effectiveDist = clampedDist - deadZoneRadius;
      const normalizedMagnitude = effectiveDist / (maxRadius - deadZoneRadius);
      const dirX = x / clampedDist;
      const dirY = y / clampedDist;

      onMove(dirX * normalizedMagnitude, dirY * normalizedMagnitude);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    // Attach move/end to window to prevent dragging off the joystick stopping input
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onMove]); // Only re-run if onMove changes (which should be stable)

  // Detecta se é dispositivo touch para mostrar o joystick
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      // Verifica media query para pointer coarse (touch)
      const isTouch = window.matchMedia('(pointer: coarse)').matches || 
                     'ontouchstart' in window || 
                     navigator.maxTouchPoints > 0;
      setIsTouchDevice(isTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (!isTouchDevice) return null;

  return (
    <div 
      ref={containerRef}
      className={`absolute bottom-8 left-8 w-32 h-32 rounded-full backdrop-blur-sm touch-none flex items-center justify-center z-50 ${
        isActive ? 'bg-white/20 border border-cyan-400/60' : 'bg-white/10 border border-white/20'
      }`}
    >
      {/* Base */}
      <div className="w-2 h-2 rounded-full bg-white/30 absolute" />
      
      {/* Stick */}
      <div 
        className="w-12 h-12 rounded-full bg-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.6)] absolute transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${isActive ? 1.1 : 1})`,
        }}
      />
    </div>
  );
};
