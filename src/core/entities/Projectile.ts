import { GameObject } from './GameObject';
import { Vector2 } from '../physics/Vector2';

/**
 * Projétil disparado pelo jogador.
 * Viaja em linha reta até atingir algo ou expirar.
 */
export class Projectile extends GameObject {
  speed: number = 600;
  life: number = 2.0; // Tempo de vida antes de desaparecer

  constructor(x: number, y: number, direction: Vector2) {
    super(x, y, 5, 'yellow');
    this.velocity = direction.normalize().scale(this.speed);
  }

  update(deltaTime: number) {
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
    }
    super.update(deltaTime);
  }
}
