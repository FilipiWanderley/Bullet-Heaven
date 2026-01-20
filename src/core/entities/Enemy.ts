import { GameObject } from './GameObject';
import { Player } from './Player';
import type { GameEngine } from '../engine/GameEngine';

/**
 * Inimigo que persegue o jogador.
 * Possui cores neon aleatórias e efeito visual ao receber dano.
 */
export class Enemy extends GameObject {
  speed: number;
  hp: number = 2;
  maxHp: number = 2;
  flashTimer: number = 0;
  damageText: string = '';
  damageTextTimer: number = 0;

  constructor(x: number, y: number) {
    // Inicializa com cor padrão, mas logo sobrescreve
    super(x, y, 12, '#00ffff');
    
    // Velocidade variável para evitar que todos os inimigos se movam em uníssono
    this.speed = 100 + Math.random() * 50;
    
    // Cores Cyberpunk/Neon "Hostis" (Vermelhos, Roxos, Magentas)
    // Removido Cyan e Verde para não confundir com XP e Player
    const colors = ['#ff0055', '#ff0000', '#aa00ff', '#ff00ff', '#ff3300'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Reseta o estado do inimigo para reuso (Object Pooling).
   */
  reset(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.hp = this.maxHp; 
    this.isDead = false;
    this.flashTimer = 0;
    this.damageText = '';
    this.damageTextTimer = 0;
    this.speed = 100 + Math.random() * 50; // Reset speed base
    
    // Recalcula cor aleatória
    const colors = ['#ff0055', '#ff0000', '#aa00ff', '#ff00ff', '#ff3300'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(deltaTime: number, player?: Player, _engine?: GameEngine) {
    // Gerencia o efeito de flash branco
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
    }

    if (this.damageTextTimer > 0) {
        this.damageTextTimer -= deltaTime;
    }

    // Lógica de perseguição (Pathfinding simples direto ao alvo)
    if (player) {
      const direction = player.position.sub(this.position).normalize();
      this.velocity = direction.scale(this.speed);
    }
    super.update(deltaTime);
  }

  /**
   * Aplica dano ao inimigo e ativa o feedback visual.
   */
  takeDamage(damage: number) {
    this.hp -= damage;
    this.flashTimer = 0.2; // Flash branco por 200ms
    this.damageText = damage.toString();
    this.damageTextTimer = 0.5;
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    
    // Feedback visual de dano (Flash Branco) ou cor normal Neon
    if (this.flashTimer > 0) {
      ctx.fillStyle = 'white';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'white';
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
    }
    
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Limpa o efeito para não afetar outros desenhos

    if (this.damageTextTimer > 0) {
        this.drawDamageText(ctx);
    }
  }

  private drawDamageText(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    
    // Animação de subida
    const offset = (0.5 - this.damageTextTimer) * 20;
    ctx.fillText(this.damageText, this.position.x, this.position.y - 20 - offset);
    ctx.restore();
  }
}
