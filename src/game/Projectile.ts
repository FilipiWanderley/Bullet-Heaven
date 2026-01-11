import { GameObject } from './GameObject';
import { Vector2 } from './Vector2';

export class Projectile extends GameObject {
  speed: number = 600;
  life: number = 2.0; // Seconds to live

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
