import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../core/engine/GameEngine';
import { Vector2 } from '../core/engine/Vector2';
import { useGameLoop } from '../hooks/useGameLoop';
import { StartScreen } from './StartScreen';
import { HUD } from './HUD';
import type { GameState } from '../types';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  
  // UI State
  const [gameState, setGameState] = useState<GameState>('start');
  const [hudState, setHudState] = useState({
    score: 0,
    level: 1,
    xp: 0,
    maxXp: 100
  });

  // Refs para inputs (para não depender do ciclo de render do React)
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Inicialização do Engine
  useEffect(() => {
    if (canvasRef.current && !engine) {
      const newEngine = new GameEngine(
        canvasRef.current.width,
        canvasRef.current.height
      );
      setEngine(newEngine);
    }
  }, [canvasRef, engine]);

  // Input Handlers (Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (engine) engine.handleInput(keysRef.current);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (engine) engine.handleInput(keysRef.current);
    };

    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement && engine) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        engine.resize(clientWidth, clientHeight);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    // Initial resize
    handleResize();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [engine]);

  // Input Handler (Mouse - Shooting)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!engine || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    engine.spawnProjectile(new Vector2(x, y));
  };

  // Callback chamado a cada frame pelo Game Loop
  const handleFrame = () => {
    if (!engine) return;

    // Sincroniza estado do jogo com React se necessário
    if (engine.gameState !== gameState) {
      setGameState(engine.gameState);
    }

    // Atualiza HUD apenas se houver mudanças significativas ou a cada X frames
    // Como React 18 é otimizado, vamos tentar atualizar se os valores mudarem
    if (
      engine.score !== hudState.score ||
      engine.player.xp !== hudState.xp ||
      engine.player.level !== hudState.level
    ) {
      setHudState({
        score: engine.score,
        level: engine.player.level,
        xp: engine.player.xp,
        maxXp: engine.player.xpToNextLevel
      });
    }
  };

  // Hook do Game Loop
  useGameLoop(engine, canvasRef, handleFrame);

  const handleStartGame = () => {
    if (engine) {
      engine.startGame();
      // Força foco na janela para inputs funcionarem
      window.focus();
    }
  };

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden select-none">
      {/* Camada do Canvas (Renderização do Jogo) */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Camada de UI (Sobreposta) */}
      {gameState === 'start' && (
        <StartScreen onStart={handleStartGame} />
      )}

      {gameState === 'gameover' && (
        <StartScreen 
          onStart={handleStartGame} 
          title="GAME OVER" 
          subtitle={`Score Final: ${hudState.score}`}
          buttonText="TENTAR NOVAMENTE"
        />
      )}

      {gameState === 'playing' && (
        <HUD 
          score={hudState.score}
          level={hudState.level}
          xp={hudState.xp}
          maxXp={hudState.maxXp}
        />
      )}
    </div>
  );
};
