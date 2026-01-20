import { useEffect, useRef } from 'react';
import { GameEngine } from '../core/engine/GameEngine';

/**
 * Hook personalizado para gerenciar o loop de jogo (Game Loop).
 * Responsável por sincronizar a lógica do jogo com a taxa de atualização da tela.
 * 
 * @param gameEngine Instância do motor do jogo
 * @param canvasRef Referência ao elemento Canvas HTML
 */
export const useGameLoop = (
  gameEngine: GameEngine | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onFrame?: () => void
) => {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  useEffect(() => {
    // Garante que o loop só inicie se tivermos engine e canvas
    if (!gameEngine || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // Calcula o tempo decorrido desde o último frame (em segundos)
        // Limitamos o deltaTime para evitar saltos grandes se a aba ficar inativa
        const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.1);
        
        // Atualiza a lógica do jogo
        gameEngine.update(deltaTime);
        
        // Renderiza o jogo
        gameEngine.draw(ctx);

        // Callback opcional para sincronizar estado (ex: HUD)
        if (onFrame) {
            onFrame();
        }
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    // Inicia o loop
    requestRef.current = requestAnimationFrame(animate);

    // Limpeza: cancela o loop ao desmontar
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameEngine, canvasRef, onFrame]); // Recria o loop apenas se engine ou canvas mudarem
};
