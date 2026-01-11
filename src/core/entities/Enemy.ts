import { GameObject } from './GameObject';
import { Player } from './Player';

/**
 * Inimigo que persegue o jogador.
 * Possui cores neon aleatórias e efeito visual ao receber dano.
 */
export class Enemy extends GameObject {
  speed: number;
  hp: number = 2;
  maxHp: number = 2;
  flashTimer: number = 0;

  constructor(x: number, y: number) {
    // Inicializa com cor padrão, mas logo sobrescreve
    super(x, y, 12, '#00ffff');
    
    // Velocidade variável para evitar que todos os inimigos se movam em uníssono
    this.speed = 100 + Math.random() * 50;
    
    // Cores Cyberpunk/Neon aleatórias
    const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime: number, player?: Player) {
    // Gerencia o efeito de flash branco
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
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
    this.flashTimer = 0.1; // Flash branco por 100ms
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
  }
}
