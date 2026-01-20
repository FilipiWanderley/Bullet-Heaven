import { Enemy } from './Enemy';
import { Player } from './Player';
import { Vector2 } from '../engine/Vector2';
import { GameEngine } from '../engine/GameEngine';

export class RocketEnemy extends Enemy {
  wobbleTimer: number = 0;
  turnSpeed: number = 2.0; // Radianos por segundo
  wanderAngle: number = 0;
  life: number = 0; // Se > 0, funciona como temporizador de vida (míssil)

  constructor(x: number, y: number) {
    super(x, y);
    this.radius = 15;
    this.maxHp = 3; // Um pouco mais resistente que o inimigo comum
    this.hp = 3;
    
    // Velocidades variadas e geralmente mais rápidas
    this.speed = 150 + Math.random() * 100;

    // Cores Neon Vibrantes (Roxo, Azul, Vermelho)
    const colors = ['#aa00ff', '#00bfff', '#ff0000', '#ff0055'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    this.wanderAngle = Math.random() * Math.PI * 2;
  }

  reset(x: number, y: number) {
    super.reset(x, y);
    this.maxHp = 3;
    this.hp = 3;
    this.speed = 150 + Math.random() * 100;
    const colors = ['#aa00ff', '#00bfff', '#ff0000', '#ff0055'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.life = 0; // Reset life
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(deltaTime: number, player?: Player, _engine?: GameEngine) {
    if (this.flashTimer > 0) this.flashTimer -= deltaTime;
    if (this.damageTextTimer > 0) this.damageTextTimer -= deltaTime;

    if (this.life > 0) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.takeDamage(9999); // Auto-detonate
            return;
        }
    }

    this.wobbleTimer += deltaTime * 15;

    if (player) {
      // Comportamento "Homing Missile" com um pouco de imprevisibilidade
      
      // 1. Vetor desejado (direto para o player)
      const toPlayer = player.position.sub(this.position).normalize();
      
      // 2. Adiciona um vetor de "wander" (ruído)
      this.wanderAngle += (Math.random() - 0.5) * 5 * deltaTime;
      const wanderVec = new Vector2(Math.cos(this.wanderAngle), Math.sin(this.wanderAngle)).scale(0.5);
      
      // 3. Vetor alvo final (mistura player + wander)
      const targetDir = toPlayer.add(wanderVec).normalize();

      // 4. Smooth Steering (Girar gradualmente para o alvo)
      // Se a velocidade atual for zero (inicio), define direto
      if (this.velocity.x === 0 && this.velocity.y === 0) {
          this.velocity = targetDir.scale(this.speed);
      } else {
          const currentDir = this.velocity.normalize();
          // Lerp simples vetorial para girar
          const newDir = currentDir.lerp(targetDir, this.turnSpeed * deltaTime).normalize();
          this.velocity = newDir.scale(this.speed);
      }
    }

    // Atualiza posição (GameObject)
    this.position = this.position.add(this.velocity.scale(deltaTime));
  }

  spawnTrail(engine: GameEngine) {
    // Similar ao RocketProjectile, mas talvez cores diferentes baseadas na cor do inimigo
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    const backX = this.position.x - Math.cos(angle) * 15;
    const backY = this.position.y - Math.sin(angle) * 15;

    // OTIMIZAÇÃO: Reduzir frequência (0.4 -> 0.2)
    if (Math.random() < 0.2) {
        // Fogo/Rastro
        const p = engine.particlePool.get(backX, backY, this.color); // Rastro da cor do inimigo
        p.velocity = this.velocity.scale(-0.2).add(new Vector2((Math.random()-0.5)*30, (Math.random()-0.5)*30));
        p.life = 0.5;
        p.radius = Math.random() * 3 + 2;
        engine.activeParticles.push(p);
    }
    
    // OTIMIZAÇÃO: Reduzir frequência (0.2 -> 0.1)
    if (Math.random() < 0.1) {
        // Fumaça escura
        const p = engine.particlePool.get(backX, backY, '#222222');
        p.velocity = this.velocity.scale(-0.1);
        p.life = 0.8;
        p.radius = Math.random() * 4 + 2;
        engine.activeParticles.push(p);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    const wobble = Math.sin(this.wobbleTimer) * 0.1;
    ctx.rotate(angle + Math.PI / 2 + wobble);

    // Feedback de dano
    if (this.flashTimer > 0) {
        ctx.fillStyle = 'white';
        // OTIMIZAÇÃO: Remover shadowBlur
        ctx.globalCompositeOperation = 'lighter'; 
    } else {
        ctx.fillStyle = '#222'; // Corpo escuro para contraste neon
        // OTIMIZAÇÃO: Remover shadowBlur
        // ctx.shadowBlur = 15;
        // ctx.shadowColor = this.color;
    }

    // Desenho do Foguete Inimigo (Mais agressivo/afiado)
    ctx.beginPath();
    // Corpo
    ctx.moveTo(0, -20); // Nariz
    ctx.lineTo(8, 10);  // Asa Dir
    ctx.lineTo(0, 5);   // Centro Base
    ctx.lineTo(-8, 10); // Asa Esq
    ctx.closePath();
    ctx.fill();
    
    // Contorno Neon (Agora usando lighter se não estiver em flash)
    if (this.flashTimer <= 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Glow falso
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        // Se estiver em flash, contorno branco
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Engine Glow
    ctx.beginPath();
    ctx.arc(0, 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.flashTimer > 0 ? 'white' : this.color;
    if (this.flashTimer <= 0) ctx.globalCompositeOperation = 'lighter';
    ctx.fill();

    ctx.restore();

    if (this.damageTextTimer > 0) {
        // Renderiza texto de dano (substituto do método privado)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const offset = (0.5 - this.damageTextTimer) * 20;
        ctx.fillText(this.damageText, 0, -30 - offset); // Relativo ao translate
        ctx.restore();
    }
  }
}
