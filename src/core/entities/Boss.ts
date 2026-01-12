import { Enemy } from './Enemy';
import { Player } from './Player';
import { Vector2 } from '../engine/Vector2';

/**
 * Entidade Boss: O desafio final.
 * Possui mais vida, é maior e tem comportamento de perseguição implacável.
 */
export class Boss extends Enemy {
  constructor(x: number, y: number) {
    super(x, y);
    this.radius = 40; // Muito maior que inimigos normais
    this.hp = 500; // Tanque de vida
    this.maxHp = 500;
    this.speed = 150; // Mais lento, mas perigoso
    this.color = '#ff0055'; // Cor distinta
  }

  update(deltaTime: number, player: Player) {
    if (this.isDead) return;

    // Movimento de perseguição simples (pode ser melhorado com State Machine interna do Boss)
    const direction = player.position.sub(this.position).normalize();
    this.velocity = direction.scale(this.speed);
    
    this.position = this.position.add(this.velocity.scale(deltaTime));

    // Efeito de pulsação visual
    const pulse = Math.sin(Date.now() / 200) * 5;
    this.radius = 40 + pulse;
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    
    // Aura de Boss
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 85, 0.3)`;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();
  }
}
