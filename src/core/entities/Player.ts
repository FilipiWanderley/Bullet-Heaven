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
  speed: number = 300;
  hp: number = 100;
  maxHp: number = 100;
  xp: number = 0;
  level: number = 1;
  xpToNextLevel: number = 100;
  invulnerableTimer: number = 0;
  trail: { x: number, y: number, alpha: number }[] = [];
  shieldActive: boolean = false;
  magnetActive: boolean = false;
  
  // Habilidade de Escudo (Cyberpunk Skill)
  shieldDuration: number = 5.0;
  shieldCooldown: number = 20.0;
  shieldTimer: number = 0.0;
  shieldCooldownTimer: number = 0.0;
  
  // Habilidade Elite Rocket (Shift)
  eliteMode: boolean = false;
  eliteTimer: number = 0.0;
  eliteCooldown: number = 0.0; // Opcional se for powerup, mas vamos por cooldown
  eliteDuration: number = 5.0;
  originalSpeed: number = 300;
  
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


  /**
   * Tenta ativar a habilidade de escudo.
   * Retorna true se ativou com sucesso.
   */
  activateShield(): boolean {
    if (this.shieldCooldownTimer <= 0 && !this.shieldActive && !this.eliteMode) {
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration;
        this.shieldCooldownTimer = this.shieldCooldown;
        return true;
    }
    return false;
  }

  /**
   * Ativa o modo Elite Rocket.
   */
  activateEliteMode(): boolean {
      if (this.eliteCooldown <= 0 && !this.eliteMode) {
          this.eliteMode = true;
          this.eliteTimer = this.eliteDuration;
          this.eliteCooldown = 30.0; // 30s cooldown
          this.originalSpeed = this.speed;
          this.speed = 800; // Super velocidade
          this.invulnerableTimer = 5.0; // Invulnerável durante o dash
          return true;
      }
      return false;
  }

  update(deltaTime: number) {
    // Gerenciamento Elite Mode
    if (this.eliteMode) {
        this.eliteTimer -= deltaTime;
        
        // Spawn de partículas de fumaça/fogo é feito no GameEngine ou aqui se tiver acesso
        // Como não tenho acesso ao engine aqui facilmente sem passar como argumento,
        // o efeito visual será tratado no draw ou no engine.
        
        if (this.eliteTimer <= 0) {
            this.eliteMode = false;
            this.speed = this.originalSpeed; // Restaura velocidade
            this.invulnerableTimer = 0;
        }
    }
    if (this.eliteCooldown > 0) {
        this.eliteCooldown -= deltaTime;
    }

    // Gerenciamento do Escudo
    if (this.shieldActive) {
        this.shieldTimer -= deltaTime;
        if (this.shieldTimer <= 0) {
            this.shieldActive = false;
        }
    }

    if (this.shieldCooldownTimer > 0) {
        this.shieldCooldownTimer -= deltaTime;
    }

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
    if (this.shieldActive) return;
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
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0 && !this.eliteMode) {
      return;
    }

    // Desenho do ELITE ROCKET
    if (this.eliteMode) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Rotação baseada na velocidade
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.globalCompositeOperation = 'lighter';
        
        // Fogo do motor
        const flameSize = Math.random() * 20 + 20;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(0, 10 + flameSize);
        ctx.lineTo(5, 10);
        ctx.fill();

        // Corpo do Foguete Elite
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes Neon
        ctx.fillStyle = '#00ffff'; // Cyan Neon
        ctx.fillRect(-3, -15, 6, 30);
        
        // Asas
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(-15, 25);
        ctx.lineTo(-5, 25);
        ctx.lineTo(0, 15);
        ctx.lineTo(5, 25);
        ctx.lineTo(15, 25);
        ctx.lineTo(0, 5);
        ctx.fillStyle = '#00ffff';
        ctx.fill();

        ctx.restore();
        
        // Desenha a Barra de Vida Flutuante
        this.drawHealthBar(ctx);
        return; // Não desenha o corpo normal
    }

    // Aura de Escudo (Cyberpunk Neon)
    if (this.shieldActive) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Efeito de pulso
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        
        // Aura Externa
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; // Cyan Neon Transparente
        ctx.fill();
        
        // Borda de Energia
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Partículas Orbitais (Simuladas visualmente)
        const time = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * (Math.PI * 2) / 3);
            const ox = this.position.x + Math.cos(angle) * (this.radius * 2);
            const oy = this.position.y + Math.sin(angle) * (this.radius * 2);
            
            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        ctx.restore();
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
