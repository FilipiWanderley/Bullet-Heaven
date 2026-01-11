import { PowerUp } from '../entities/PowerUp';
import type { PowerUpType } from '../entities/PowerUp';

/**
 * Factory Pattern para criação de PowerUps.
 * Centraliza a lógica de instanciação e probabilidades de drop.
 */
export class PowerUpFactory {
  
  /**
   * Tenta criar um PowerUp baseado em probabilidades.
   * Pode retornar null se a sorte não favorecer.
   */
  static createRandomDrop(x: number, y: number): PowerUp | null {
    const rand = Math.random();

    // 10% de chance de Health Pack
    if (rand < 0.10) {
      return new PowerUp(x, y, 'health', 20); // Cura 20 HP
    }
    
    // 30% de chance de XP Orb (se não for Health)
    // Probabilidade acumulada: entre 0.10 e 0.40 (30% total)
    if (rand < 0.40) {
      return new PowerUp(x, y, 'xp', 10); // Dá 10 XP
    }

    // 60% de chance de nada
    return null;
  }
  
  /**
   * Cria um PowerUp específico (útil para eventos ou bosses).
   */
  static create(x: number, y: number, type: PowerUpType, value: number): PowerUp {
    return new PowerUp(x, y, type, value);
  }
}
