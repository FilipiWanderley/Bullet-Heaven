import { GameObject } from './GameObject';
import { Vector2 } from './Vector2';

export class Particle extends GameObject {
  life: number = 1.0; // seconds
  decay: number = 2.0;

  constructor(x: number, y: number) {
    super(x, y, Math.random() * 3 + 1, 'orange');
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    this.velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(speed);
  }

  update(deltaTime: number) {
    this.life -= this.decay * deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
    }
    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Otimização de renderização: Ajuste de transparência
    ctx.globalAlpha = Math.max(0, this.life);
    super.draw(ctx);
    ctx.globalAlpha = 1.0;
  }
}
