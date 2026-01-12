import type { Player } from '../entities/Player';
import type { GameEngine } from '../engine/GameEngine';
import { Vector2 } from '../engine/Vector2';

/**
 * Interface Strategy para comportamentos de ataque.
 * Permite trocar a lógica de disparo em tempo de execução.
 */
export interface WeaponStrategy {
  /**
   * Executa a lógica de disparo.
   * @param player A instância do jogador (origem do tiro).
   * @param target A posição do mouse/alvo no mundo.
   * @param engine A referência da engine para spawnar projéteis.
   */
  shoot(player: Player, target: Vector2, engine: GameEngine): void;
}

/**
 * Estratégia Padrão: Disparo único linear.
 */
export class DefaultWeaponStrategy implements WeaponStrategy {
  shoot(player: Player, target: Vector2, engine: GameEngine): void {
    // Converte alvo de Screen Space para World Space
    const worldTarget = target.add(engine.camera);
    const direction = worldTarget.sub(player.position).normalize();
    
    const proj = engine.projectilePool.get(player.position.x, player.position.y, direction);
    engine.activeProjectiles.push(proj);
  }
}

/**
 * Estratégia Tiro Triplo: Dispara 3 projéteis em arco.
 */
export class TripleShotWeaponStrategy implements WeaponStrategy {
  shoot(player: Player, target: Vector2, engine: GameEngine): void {
    const worldTarget = target.add(engine.camera);
    const baseDir = worldTarget.sub(player.position).normalize();
    
    // Ângulos de dispersão (em radianos)
    const angles = [-0.2, 0, 0.2]; // ~11 graus de spread

    angles.forEach(angle => {
      // Rotaciona o vetor direção
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = baseDir.x * cos - baseDir.y * sin;
      const newY = baseDir.x * sin + baseDir.y * cos;
      
      const dir = new Vector2(newX, newY);
      
      // Usa o pool da engine, mas precisamos adaptar o spawnProjectile para aceitar direção direta
      // Como o método spawnProjectile original calcula a direção baseada no target,
      // vamos criar um método overload ou usar uma lógica customizada aqui.
      // Para manter o encapsulamento, o ideal seria o spawnProjectile aceitar uma direção opcional.
      
      // WORKAROUND: Vamos chamar o get do pool diretamente aqui para ter controle total
      const proj = engine.projectilePool.get(player.position.x, player.position.y, dir);
      engine.activeProjectiles.push(proj);
    });
  }
}

/**
 * Estratégia Escudo Orbital: Dispara projéteis em espiral ao redor do jogador.
 * (Simplificação visual para "Orbital")
 */
export class OrbitalFireStrategy implements WeaponStrategy {
    private angle: number = 0;

    shoot(player: Player, target: Vector2, engine: GameEngine): void {
        this.angle += 0.5;
        const offset = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
        const dir = offset.normalize();
        
        const proj = engine.projectilePool.get(player.position.x, player.position.y, dir);
        engine.activeProjectiles.push(proj);
    }
}
