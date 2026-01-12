import { GameObject } from './GameObject';
import { Vector2 } from '../engine/Vector2';
import type { Poolable } from '../pool/ObjectPool';

/**
 * Partícula visual para explosões e efeitos.
 * Otimizada com Object Pooling para evitar garbage collection em explosões massivas.
 */
export class Particle extends GameObject implements Poolable {
  life: number = 1.0;
  decay: number = 2.0;
  active: boolean = false;

  constructor() {
    super(0, 0, 0, 'white'); // Placeholder
  }

  reset(x: number, y: number, color: string) {
    this.position.x = x;
    this.position.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 1;
    this.life = 1.0;
    this.decay = 2.0;
    this.isDead = false;
    this.active = true;
    
    // Dispersão aleatória
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    this.velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(speed);
  }

  update(deltaTime: number) {
    if (!this.active) return;

    this.life -= this.decay * deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
    }
    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.globalAlpha = Math.max(0, this.life);
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    // Brilho Neon (Shadow Blur pode ser custoso, usar com parcimônia)
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}
