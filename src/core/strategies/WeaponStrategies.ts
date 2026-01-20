import type { Player } from '../entities/Player';
import type { GameEngine } from '../engine/GameEngine';
import { Vector2 } from '../engine/Vector2';
import { AudioManager } from '../audio/AudioManager';

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
    
    // Se direção for inválida (zero), define padrão
    if (isNaN(direction.x) || isNaN(direction.y)) return;

    const proj = engine.projectilePool.get(player.position.x, player.position.y, direction);
    engine.activeProjectiles.push(proj);
    AudioManager.getInstance().playShoot();
  }
}

/**
 * Estratégia Tiro Triplo: Dispara 3 projéteis em arco.
 */
export class TripleShotWeaponStrategy implements WeaponStrategy {
  shoot(player: Player, target: Vector2, engine: GameEngine): void {
    const worldTarget = target.add(engine.camera);
    let baseDir = worldTarget.sub(player.position).normalize();
    
    if (isNaN(baseDir.x) || isNaN(baseDir.y)) baseDir = new Vector2(1, 0);

    // Ângulos de dispersão (em radianos)
    const angles = [-0.2, 0, 0.2]; // ~11 graus de spread

    angles.forEach(angle => {
      // Rotaciona o vetor direção
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = baseDir.x * cos - baseDir.y * sin;
      const newY = baseDir.x * sin + baseDir.y * cos;
      
      const dir = new Vector2(newX, newY);
      
      const proj = engine.projectilePool.get(player.position.x, player.position.y, dir);
      engine.activeProjectiles.push(proj);
    });
    AudioManager.getInstance().playShoot();
  }
}

/**
 * Estratégia Escudo Orbital: Dispara projéteis em todas as direções rapidamente.
 * Cria um efeito de "bullet hell" ao redor do jogador.
 */
export class OrbitalFireStrategy implements WeaponStrategy {
    private angle: number = 0;

    shoot(player: Player, _target: Vector2, engine: GameEngine): void {
        // Dispara 4 projéteis em cruz giratória a cada clique
        for (let i = 0; i < 4; i++) {
            this.angle += (Math.PI / 2) + 0.1; // 90 graus + rotação
            const offset = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
            const dir = offset.normalize();
            
            const proj = engine.projectilePool.get(player.position.x, player.position.y, dir);
            engine.activeProjectiles.push(proj);
        }
        AudioManager.getInstance().playShoot();
    }
}

/**
 * Estratégia Rocket Launcher: Dispara um foguete poderoso.
 */
export class RocketLauncherStrategy implements WeaponStrategy {
  shoot(player: Player, target: Vector2, engine: GameEngine): void {
    const worldTarget = target.add(engine.camera);
    let direction = worldTarget.sub(player.position).normalize();
    
    if (isNaN(direction.x) || isNaN(direction.y)) direction = new Vector2(1, 0);

    const rocket = engine.rocketPool.get(player.position.x, player.position.y, direction);
    engine.activeProjectiles.push(rocket);
    AudioManager.getInstance().playShoot();
  }
}

/**
 * Estratégia Triple Rocket: Dispara 3 foguetes em leque (Shotgun Blast).
 */
export class TripleRocketStrategy implements WeaponStrategy {
  shoot(player: Player, target: Vector2, engine: GameEngine): void {
    const worldTarget = target.add(engine.camera);
    let baseDir = worldTarget.sub(player.position).normalize();
    
    if (isNaN(baseDir.x) || isNaN(baseDir.y)) baseDir = new Vector2(1, 0);

    // Spread mais largo que o tiro triplo normal (Shotgun feel)
    const angles = [-0.3, 0, 0.3]; 

    angles.forEach(angle => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const newX = baseDir.x * cos - baseDir.y * sin;
      const newY = baseDir.x * sin + baseDir.y * cos;
      
      const dir = new Vector2(newX, newY);
      
      const rocket = engine.rocketPool.get(player.position.x, player.position.y, dir);
      engine.activeProjectiles.push(rocket);
    });
    AudioManager.getInstance().playShoot();
  }
}
