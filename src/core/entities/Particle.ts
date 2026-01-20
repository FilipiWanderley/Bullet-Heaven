import { GameObject } from './GameObject';
import { Vector2 } from '../engine/Vector2';
import type { Poolable } from '../pool/ObjectPool';

export type ParticleType = 'normal' | 'shockwave';

/**
 * Partícula visual para explosões e efeitos.
 * Otimizada com Object Pooling para evitar garbage collection em explosões massivas.
 */
export class Particle extends GameObject implements Poolable {
  life: number = 1.0;
  decay: number = 2.0;
  active: boolean = false;
  type: ParticleType = 'normal';
  flicker: boolean = false;

  constructor() {
    super(0, 0, 0, 'white'); // Placeholder
  }

  reset(x: number, y: number, color: string, type: ParticleType = 'normal', flicker: boolean = false) {
    this.position.x = x;
    this.position.y = y;
    this.color = color;
    this.type = type;
    this.flicker = flicker;
    this.active = true;
    this.isDead = false;

    if (type === 'shockwave') {
        this.radius = 10;
        this.life = 0.5;
        this.decay = 2.0;
        this.velocity = new Vector2(0, 0); // Estático, só cresce
    } else {
        this.radius = Math.random() * 3 + 1;
        this.life = 1.0;
        this.decay = 2.0;
        
        // Dispersão aleatória
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        this.velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(speed);
    }
  }

  update(deltaTime: number) {
    if (!this.active) return;

    this.life -= this.decay * deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
    }

    if (this.type === 'shockwave') {
        this.radius += 500 * deltaTime; // Cresce rápido
    } else {
        super.update(deltaTime);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    let alpha = Math.max(0, this.life);
    
    // Flicker effect
    if (this.flicker) {
        alpha *= (0.7 + Math.random() * 0.3); // Random flicker between 70% and 100%
    }

    ctx.globalAlpha = alpha;
    
    if (this.type === 'shockwave') {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5 * this.life; // Fica mais fino conforme some
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.closePath();
    } else {
        ctx.beginPath();
        
        // Shimmer size change
        const currentRadius = this.flicker ? this.radius * (0.9 + Math.random() * 0.2) : this.radius;

        ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Brilho Neon (Shadow Blur pode ser custoso, usar com parcimônia)
        ctx.shadowBlur = this.flicker ? 15 : 10;
        ctx.shadowColor = this.color;
        
        ctx.fill();
        ctx.closePath();
    }
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}
