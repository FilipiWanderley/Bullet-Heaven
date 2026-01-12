import { GameObject } from './GameObject';
import { DefaultWeaponStrategy } from '../strategies/WeaponStrategies';
import type { WeaponStrategy } from '../strategies/WeaponStrategies';
import type { GameEngine } from '../engine/GameEngine';
import { Vector2 } from '../engine/Vector2';

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
  trail: { x: number, y: number, alpha: number }[] = [];
  
  // Strategy Pattern para armas
  weaponStrategy: WeaponStrategy;

  constructor(x: number, y: number) {
    super(x, y, 15, 'white');
    this.weaponStrategy = new DefaultWeaponStrategy();
  }

  /**
   * Executa o disparo usando a estratégia atual.
   */
  shoot(target: Vector2, engine: GameEngine) {
      this.weaponStrategy.shoot(this, target, engine);
  }

  /**
   * Troca a estratégia de arma (Upgrade).
   */
  setWeaponStrategy(strategy: WeaponStrategy) {
      this.weaponStrategy = strategy;
  }


  update(deltaTime: number) {
    // Reduz o temporizador de invulnerabilidade se ativo
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    // Atualiza o rastro (Trail Effect)
    // Adiciona posição atual a cada frame (ou a cada X ms para performance)
    this.trail.push({ x: this.position.x, y: this.position.y, alpha: 0.5 });
    
    // Remove pontos antigos e reduz alpha
    for (let i = this.trail.length - 1; i >= 0; i--) {
        this.trail[i].alpha -= deltaTime * 2; // Fade out rápido
        if (this.trail[i].alpha <= 0) {
            this.trail.splice(i, 1);
        }
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
   * Cura o jogador.
   */
  heal(amount: number) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
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
    // Desenha o rastro
    this.trail.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${point.alpha})`;
        ctx.fill();
        ctx.closePath();
    });

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
