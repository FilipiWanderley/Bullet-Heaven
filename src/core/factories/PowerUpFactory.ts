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

    if (rand < 0.04) {
        return new PowerUp(x, y, 'weapon_triple', 0);
    }

    if (rand < 0.08) {
        return new PowerUp(x, y, 'weapon_orbital', 0);
    }

    if (rand < 0.12) {
        return new PowerUp(x, y, 'weapon_triple_rocket', 0);
    }
    
    if (rand < 0.30) {
        return new PowerUp(x, y, 'weapon_rocket', 0);
    }

    if (rand < 0.45) {
      return new PowerUp(x, y, 'health', 30);
    }
    
    if (rand < 0.55) {
      return new PowerUp(x, y, 'xp', 15);
    }
    if (rand < 0.60) {
      return new PowerUp(x, y, 'speed', 0);
    }
    if (rand < 0.65) {
      return new PowerUp(x, y, 'shield', 0);
    }
    if (rand < 0.70) {
      return new PowerUp(x, y, 'magnet', 0);
    }

    return null;
  }
  
  /**
   * Cria um PowerUp específico (útil para eventos ou bosses).
   */
  static create(x: number, y: number, type: PowerUpType, value: number): PowerUp {
    return new PowerUp(x, y, type, value);
  }
}
