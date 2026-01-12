
import { GameObject } from './GameObject';

/**
 * Texto flutuante para feedback de dano e score.
 * Sobe e desaparece (Fade Out).
 */
export class FloatingText extends GameObject {
  text: string;
  lifeTime: number = 1.0; // 1 segundo
  initialLifeTime: number = 1.0;
  
  constructor() {
    super(0, 0, 0, '#ffffff'); // Posição será setada no reset
    this.text = '';
  }

  reset(x: number, y: number, text: string, color: string = '#ffffff') {
    this.position.x = x;
    this.position.y = y;
    this.text = text;
    this.color = color;
    this.lifeTime = this.initialLifeTime;
    this.velocity.y = -50; // Sobe suavemente
    this.velocity.x = (Math.random() - 0.5) * 20; // Leve variação lateral
    this.isDead = false;
  }

  update(deltaTime: number) {
    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.isDead = true;
    }
    super.update(deltaTime);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.lifeTime / this.initialLifeTime);
    
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    
    // Stroke para contraste
    ctx.strokeText(this.text, this.position.x, this.position.y);
    ctx.fillText(this.text, this.position.x, this.position.y);
    
    ctx.restore();
  }
}
