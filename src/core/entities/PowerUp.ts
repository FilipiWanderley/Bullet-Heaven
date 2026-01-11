import { GameObject } from './GameObject';

export type PowerUpType = 'health' | 'xp';

/**
 * Entidade PowerUp (Item coletável).
 * Representa itens deixados por inimigos (drop).
 */
export class PowerUp extends GameObject {
  type: PowerUpType;
  value: number;
  lifeTime: number = 10; // Segundos antes de desaparecer
  floatOffset: number = 0; // Para animação de flutuar

  constructor(x: number, y: number, type: PowerUpType, value: number) {
    // Cores: Verde para Vida, Azul para XP
    const color = type === 'health' ? '#00ff00' : '#00ffff';
    super(x, y, 8, color);
    this.type = type;
    this.value = value;
  }

  update(deltaTime: number) {
    this.lifeTime -= deltaTime;
    
    // Animação simples de flutuação (senóide)
    this.floatOffset += deltaTime * 5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Efeito de pulsação
    const pulse = 1 + Math.sin(this.floatOffset) * 0.2;
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.min(this.lifeTime, 1); // Fade out no final
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.closePath();

    // Brilho externo
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
