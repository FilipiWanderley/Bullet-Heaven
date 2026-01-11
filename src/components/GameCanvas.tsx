import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Vector2 } from '../game/Vector2';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Engine
    engineRef.current = new GameEngine(canvas.width, canvas.height);

    // Input Listeners (Keyboard)
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize Handler
    const handleResize = () => {
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            engineRef.current?.resize(canvas.width, canvas.height);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    // Game Loop
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = (time - previousTimeRef.current) / 1000;
        // Cap deltaTime to avoid huge jumps
        const safeDelta = Math.min(deltaTime, 0.1);
        
        const engine = engineRef.current;
        if (engine) {
            engine.handleInput(keysRef.current);
            engine.update(safeDelta);
            const ctx = canvas.getContext('2d');
            if (ctx) engine.draw(ctx);
        }
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      engineRef.current.spawnProjectile(new Vector2(x, y));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        style={{ display: 'block' }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', pointerEvents: 'none', fontFamily: 'monospace' }}>
        Use WASD to move. Click to shoot.
      </div>
    </div>
  );
};
