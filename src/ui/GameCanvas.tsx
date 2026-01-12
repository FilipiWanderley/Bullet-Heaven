import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../core/engine/GameEngine';
import { Vector2 } from '../core/engine/Vector2';
import { useGameLoop } from '../hooks/useGameLoop';
import { StartScreen } from './StartScreen';
import { TutorialModal } from './TutorialModal';
import { HUD } from './HUD';
import { VirtualJoystick } from './VirtualJoystick';
import type { GameState } from '../types';

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  
  // UI State
  const [gameState, setGameState] = useState<GameState>('start');
  const [showTutorial, setShowTutorial] = useState(false);
  const [hudState, setHudState] = useState({
    score: 0,
    highScore: 0,
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: 100,
    maxHp: 100,
    boss: null as { hp: number; maxHp: number; name: string; } | null,
    debugInfo: ''
  });

  // Refs para inputs (para não depender do ciclo de render do React)
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);

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
    
    lastMousePos.current = { x, y };
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
      engine.player.level !== hudState.level ||
      engine.player.hp !== hudState.hp ||
      (engine.boss && engine.boss.hp !== hudState.boss?.hp) ||
      (!engine.boss && hudState.boss)
    ) {
      setHudState({
        score: engine.score,
        highScore: engine.highScore,
        level: engine.player.level,
        xp: engine.player.xp,
        maxXp: engine.player.xpToNextLevel,
        hp: engine.player.hp,
        maxHp: engine.player.maxHp,
        boss: engine.boss ? { 
            hp: engine.boss.hp, 
            maxHp: engine.boss.maxHp, 
            name: 'CYBER LORD' 
        } : null,
        debugInfo: `Enemies: ${engine.enemies.length} | Proj: ${engine.activeProjectiles.length} | State: ${engine.gameState}`
      });
    }
  };

  // Hook do Game Loop
  useGameLoop(engine, canvasRef, handleFrame);

  const handleStartGame = () => {
    // Abre o tutorial em vez de iniciar o jogo diretamente
    setShowTutorial(true);
  };

  const handleRestartGame = () => {
    if (engine) {
      engine.startGame();
      window.focus();
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    if (engine) {
      engine.startGame();
      // Força foco na janela para inputs funcionarem
      window.focus();
    }
  };

  const handleJoystickMove = (x: number, y: number) => {
    if (engine) {
      engine.setJoystickInput(x, y);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-neutral-900 overflow-hidden select-none touch-none">
      {/* Camada do Canvas (Renderização do Jogo) */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="block w-full h-full cursor-crosshair"
      />
      
      {/* Joystick Virtual (Mobile Only - controlado via CSS/Media Query no componente) */}
      {(gameState === 'playing' || gameState === 'boss_fight') && (
        <VirtualJoystick onMove={handleJoystickMove} />
      )}

      {/* Camada de UI (Sobreposta) */}
      {gameState === 'start' && !showTutorial && (
        <StartScreen onStart={handleStartGame} />
      )}

      {showTutorial && (
        <TutorialModal onConfirm={handleTutorialComplete} />
      )}

      {gameState === 'gameover' && (
        <StartScreen 
          onStart={handleRestartGame} 
          subtitle={`Score Final: ${hudState.score} | High Score: ${hudState.highScore}`}
          buttonText="TENTAR NOVAMENTE"
        />
      )}

      {(gameState === 'playing' || gameState === 'boss_fight') && (
        <HUD 
          score={hudState.score}
          highScore={hudState.highScore}
          level={hudState.level}
          xp={hudState.xp}
          maxXp={hudState.maxXp}
          hp={hudState.hp}
          maxHp={hudState.maxHp}
          boss={hudState.boss}
          debugInfo={hudState.debugInfo}
        />
      )}
    </div>
  );
};
