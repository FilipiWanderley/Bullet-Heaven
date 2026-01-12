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

    // 5% de chance de Arma Especial (Triple Shot)
    if (rand < 0.05) {
        return new PowerUp(x, y, 'weapon_triple', 0);
    }

    // 5% de chance de Arma Especial (Orbital)
    // Acumulado: 0.05 a 0.10
    if (rand < 0.10) {
        return new PowerUp(x, y, 'weapon_orbital', 0);
    }

    // 10% de chance de Health Pack (na prática aumenta vida ou XP se não tiver sistema de HP)
    // Acumulado: 0.10 a 0.20
    if (rand < 0.20) {
      return new PowerUp(x, y, 'health', 20); // Cura 20 HP
    }
    
    // 20% de chance de XP Orb
    // Acumulado: 0.20 a 0.40
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
