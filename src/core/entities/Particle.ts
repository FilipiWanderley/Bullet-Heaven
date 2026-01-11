import { GameObject } from './GameObject';
import { Vector2 } from '../physics/Vector2';

/**
 * Partícula visual para explosões e efeitos.
 * Desaparece com o tempo (fade out).
 */
export class Particle extends GameObject {
  life: number = 1.0; // Tempo de vida em segundos
  decay: number = 2.0; // Velocidade de decaimento

  constructor(x: number, y: number, color: string) {
    super(x, y, Math.random() * 3 + 1, color);
    
    // Dispersão aleatória em 360 graus
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
    // Ajusta a transparência baseada na vida restante para um fade out suave
    ctx.globalAlpha = Math.max(0, this.life);
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    // Brilho Neon
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0; // Reseta alpha global
  }
}
