import { GameObject } from './GameObject';

/**
 * Representa o jogador controlado pelo usuário.
 * Gerencia vida, XP e mecânicas de nível.
 */
export class Player extends GameObject {
  speed: number = 300; // pixels por segundo
  hp: number = 100;
  maxHp: number = 100;
  xp: number = 0;
  level: number = 1;
  xpToNextLevel: number = 100;
  invulnerableTimer: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 15, 'white');
  }

  update(deltaTime: number) {
    // Reduz o temporizador de invulnerabilidade se ativo
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }
    super.update(deltaTime);
  }

  /**
   * Aplica dano ao jogador respeitando o tempo de invulnerabilidade.
   */
  takeDamage(amount: number) {
    if (this.invulnerableTimer > 0) return;
    this.hp -= amount;
    this.invulnerableTimer = 0.5; // 0.5s de invulnerabilidade pós-dano
  }

  /**
   * Adiciona XP e verifica se houve Level Up.
   */
  addXp(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
  }

  /**
   * Processa a lógica de subir de nível.
   * Aumenta a dificuldade do próximo nível e cura o jogador.
   */
  levelUp() {
    this.level++;
    this.xp -= this.xpToNextLevel;
    // Curva de XP simples: 50% mais difícil a cada nível
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    this.hp = this.maxHp;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Efeito visual de piscar quando invulnerável
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    // Desenha o corpo do jogador com brilho (Shadow Blur)
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;

    // Desenha a Barra de Vida Flutuante
    this.drawHealthBar(ctx);
  }

  /**
   * Renderiza a barra de vida acima do jogador.
   * Separado para manter o método draw mais limpo.
   */
  private drawHealthBar(ctx: CanvasRenderingContext2D) {
    const barWidth = 40;
    const barHeight = 6;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 15;

    // Fundo da barra
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Barra de vida atual (colorida baseada na porcentagem)
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.2 ? '#ffff00' : '#ff0000';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
}
