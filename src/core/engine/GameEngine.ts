import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Particle } from '../entities/Particle';
import { Projectile } from '../entities/Projectile';
import { RocketProjectile } from '../entities/RocketProjectile';
import { RocketEnemy } from '../entities/RocketEnemy';
import { FloatingText } from '../entities/FloatingText';
import { Vector2 } from './Vector2';
import type { GameState, InputKeys } from '../../types';
import { SpatialHashGrid } from './SpatialGrid';
import { PowerUp } from '../entities/PowerUp';
import { PowerUpFactory } from '../factories/PowerUpFactory';
import { AudioManager } from '../audio/AudioManager';
import { ObjectPool } from '../pool/ObjectPool';
import { BackgroundSystem } from '../systems/BackgroundSystem';

/**
 * Motor principal do jogo (Game Engine).
 * Responsável pelo Game Loop, gerenciamento de entidades e física.
 * 
 * Arquitetura Sênior:
 * - Separação clara entre lógica (Engine) e renderização (Canvas).
 * - Uso de Object Pooling para gerenciamento de memória.
 * - Spatial Hash Grid para otimização de colisões.
 * - State Machine para fluxo de jogo.
 */
export class GameEngine {
  player: Player;
  enemies: Enemy[] = [];
  powerUps: PowerUp[] = []; // Lista de itens coletáveis
  
  // Arrays de entidades ativas (gerenciadas pelo Pool)
  activeParticles: Particle[] = [];
  activeProjectiles: Projectile[] = [];
  activeTexts: FloatingText[] = [];

  // Object Pools
  particlePool: ObjectPool<Particle>;
  projectilePool: ObjectPool<Projectile>;
  rocketPool: ObjectPool<RocketProjectile>;
  enemyPool: ObjectPool<Enemy>;
  rocketEnemyPool: ObjectPool<RocketEnemy>;
  textPool: ObjectPool<FloatingText>;

  // Input State
  keys: InputKeys = {};
  joystickInput: Vector2 = new Vector2(0, 0);
  mousePosition: Vector2 = new Vector2(0, 0);
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer: number = 0;
  
  // Otimização: Spatial Hash Grid
  grid: SpatialHashGrid;
  
  // Estado do Jogo
  gameState: GameState = 'start';
  previousState: GameState = 'start'; // Para pausar/despausar
  score: number = 0;
  highScore: number = 0;
  playTime: number = 0;
  boss: Boss | null = null;
  
  // Efeitos Visuais e Câmera
  screenShake: number = 0;
  hitStopTimer: number = 0;
  damageFlashTimer: number = 0; // Timer para flash vermelho e vignette
  pickupFlashTimer: number = 0; // Flash branco para power-ups/kills
  gameOverTimer: number = 0; // Timer para animação de Game Over
  lowHpThreshold: number = 0.25;
  lowHpBeepTimer: number = 0;
  camera: Vector2 = new Vector2(0, 0); // Posição da Câmera (World Space)
  backgroundSystem: BackgroundSystem;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
    
    // Inicializa a grade com células de 100px
    this.grid = new SpatialHashGrid(100);
    this.backgroundSystem = new BackgroundSystem(width, height);

    // Inicializa Pools
    // Pré-aloca objetos para evitar lag spikes durante o jogo
    this.particlePool = new ObjectPool<Particle>(() => new Particle(), 100);
    this.projectilePool = new ObjectPool<Projectile>(() => new Projectile(), 50);
    this.rocketPool = new ObjectPool<RocketProjectile>(() => new RocketProjectile(), 20);
    // Enemy pool - aloca 50 inicialmente
    this.enemyPool = new ObjectPool<Enemy>(() => new Enemy(0, 0), 50);
    this.rocketEnemyPool = new ObjectPool<RocketEnemy>(() => new RocketEnemy(0, 0), 20);
    // Text pool - aloca 20
    this.textPool = new ObjectPool<FloatingText>(() => new FloatingText(), 20);

    this.loadHighScore();

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyP') this.togglePause();
      // Debug: Spawn Boss
      if (e.code === 'KeyB') this.spawnBoss();
      if (e.code === 'KeyR' && this.gameState === 'gameover') this.startGame();
      
      // Habilidade: Escudo (Espaço)
      if (e.code === 'Space') {
        if (this.player.activateShield()) {
            AudioManager.getInstance().playPowerUp(); // Som de ativação
            this.spawnNeonExplosion(this.player.position, 20); // Efeito visual extra
        }
      }

      // Habilidade: Elite Rocket (Shift)
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          if (this.player.activateEliteMode()) {
              AudioManager.getInstance().playPowerUp();
              this.screenShake = 15; // Impacto visual
          }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('neon-survivor-highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    } catch {
      console.warn('LocalStorage not available');
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('neon-survivor-highscore', this.highScore.toString());
      } catch {
        console.warn('LocalStorage not available');
      }
    }
  }

  togglePause() {
    if (this.gameState === 'playing' || this.gameState === 'boss_fight') {
        this.previousState = this.gameState;
        this.gameState = 'paused';
    } else if (this.gameState === 'paused') {
        this.gameState = this.previousState;
    }
  }


  /**
   * Inicia ou reinicia a sessão de jogo.
   */
  startGame() {
    this.gameState = 'playing';
    this.reset();
    
    // Inicializa o sistema de áudio (requer interação do usuário)
    AudioManager.getInstance().init();
  }

  /**
   * Reseta todas as entidades e pontuações para um novo jogo.
   */
  reset() {
    this.player = new Player(this.canvasWidth / 2, this.canvasHeight / 2);
    
    // Release all enemies back to pool
    this.enemies.forEach(e => this.enemyPool.release(e));
    this.enemies = [];

    // Release all texts
    this.activeTexts.forEach(t => this.textPool.release(t));
    this.activeTexts = [];

    this.boss = null;
    this.playTime = 0;
    
    // Libera todos os objetos ativos de volta para o pool
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeParticles = [];
    
    this.activeProjectiles.forEach(p => {
      if (p instanceof RocketProjectile) {
        this.rocketPool.release(p);
      } else {
        this.projectilePool.release(p);
      }
    });
    this.activeProjectiles = [];

    this.powerUps = [];
    this.score = 0;
    this.screenShake = 0;
    this.gameOverTimer = 0;
    this.lowHpBeepTimer = 0;
    this.camera = new Vector2(0, 0);
  }

  /**
   * Ajusta as dimensões do mundo do jogo quando a janela é redimensionada.
   */
  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.grid = new SpatialHashGrid(100);
    this.backgroundSystem.resize(width, height);
  }

  /**
   * Atualiza o estado dos inputs atuais.
   */
  handleInput(keys: InputKeys) {
    this.keys = keys;
  }

  /**
   * Dispara projétil(eis) delegando a estratégia da arma do jogador.
   */
  spawnProjectile(target: Vector2) {
    if (this.gameState !== 'playing' && this.gameState !== 'boss_fight') return;
    
    // O Player agora decide COMO atirar (Strategy Pattern)
    this.player.shoot(target, this);
  }

  /**
   * Gera partículas de explosão usando Object Pooling.
   */
  spawnParticles(position: Vector2, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get(position.x, position.y, color);
      this.activeParticles.push(p);
    }
  }

  spawnNeonExplosion(position: Vector2, count: number = 20) {
    const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0055']; // Blue, Pink, Green, Yellow, Red
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.get();
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Pass true for flicker effect
      particle.reset(position.x, position.y, color, 'normal', true);
      this.activeParticles.push(particle);
    }
  }

  spawnRocketExplosion(position: Vector2) {
    // 1. Shockwave
    const shockwave = this.particlePool.get(position.x, position.y, '#ffffff', 'shockwave');
    this.activeParticles.push(shockwave);

    // 2. Neon Burst (Blue, Pink, Orange)
    const colors = ['#00ffff', '#ff00ff', '#ff4400'];
    for (let i = 0; i < 50; i++) { // Intense explosion
        const color = colors[Math.floor(Math.random() * colors.length)];
        const p = this.particlePool.get(position.x, position.y, color, 'normal');
        // Make them faster for "powerful" feel
        p.velocity = p.velocity.scale(1.5);
        this.activeParticles.push(p);
    }

    // 3. Screen Shake
    this.screenShake = 20;
    AudioManager.getInstance().playExplosion();
  }

  /**
   * Loop principal de atualização lógica (Physics Update).
   * @param deltaTime Tempo decorrido desde o último frame (em segundos).
   */
  setJoystickInput(x: number, y: number) {
    this.joystickInput.x = x;
    this.joystickInput.y = y;
  }

  setMousePosition(x: number, y: number) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
  }

  update(deltaTime: number) {
    if (this.gameState === 'gameover') {
      this.gameOverTimer += deltaTime;
      return;
    }

    if (this.gameState !== 'playing' && this.gameState !== 'boss_fight') return;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= deltaTime;
      if (this.hitStopTimer < 0) this.hitStopTimer = 0;
      return;
    }

    if (this.lowHpBeepTimer > 0) {
      this.lowHpBeepTimer -= deltaTime;
      if (this.lowHpBeepTimer < 0) this.lowHpBeepTimer = 0;
    }

    if (this.damageFlashTimer > 0) {
        this.damageFlashTimer -= deltaTime * 3; // Fade rápido
        if (this.damageFlashTimer < 0) this.damageFlashTimer = 0;
    }

    if (this.pickupFlashTimer > 0) {
        this.pickupFlashTimer -= deltaTime * 5; // Very fast fade
        if (this.pickupFlashTimer < 0) this.pickupFlashTimer = 0;
    }

    const hpRatio = this.player.hp / this.player.maxHp;
    if (hpRatio > 0 && hpRatio <= this.lowHpThreshold && this.lowHpBeepTimer === 0) {
      AudioManager.getInstance().playHeartbeat();
      this.lowHpBeepTimer = 0.8;
    }

    // Atualiza Background
    this.backgroundSystem.update(deltaTime, this.player.velocity);

    // Gerenciamento de Estados e Tempo
    this.playTime += deltaTime;

    // State Machine: Transição para Boss Fight após 60 segundos
    if (this.gameState === 'playing' && this.playTime >= 60) {
        this.gameState = 'boss_fight';
        this.spawnBoss();
        AudioManager.getInstance().playPowerUp(); // Som de alerta
    }

    // Decaimento do Screen Shake
    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 30;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Input Player
    const inputDir = new Vector2(0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1;
    
    // Combine Keyboard + Joystick
    if (this.joystickInput.x !== 0 || this.joystickInput.y !== 0) {
        inputDir.x = this.joystickInput.x;
        inputDir.y = this.joystickInput.y;
    }

    this.player.velocity = inputDir.normalize().scale(this.player.speed);
    this.player.update(deltaTime);
    
    // Câmera Lerp (Suavização)
    const targetCamX = this.player.position.x - this.canvasWidth / 2;
    const targetCamY = this.player.position.y - this.canvasHeight / 2;
    const lerpFactor = 5 * deltaTime;
    this.camera.x += (targetCamX - this.camera.x) * lerpFactor;
    this.camera.y += (targetCamY - this.camera.y) * lerpFactor;
    
    // Spawning Inimigos
    this.spawnTimer += deltaTime;
    // Se estiver no Boss, spawna menos inimigos
    const shouldSpawn = this.gameState === 'playing' || (this.gameState === 'boss_fight' && this.spawnTimer > 3.0);
    
    if (shouldSpawn && this.spawnTimer > Math.max(0.2, 1.0 - this.player.level * 0.05)) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Atualização de Boss
    if (this.boss && !this.boss.isDead) {
        this.boss.update(deltaTime, this.player, this);
    }

    // Atualização de Entidades (Inimigos)
    this.activeParticles = this.activeParticles.filter(p => {
      p.update(deltaTime);
      if (p.life <= 0) {
        this.particlePool.release(p);
        return false;
      }
      return true;
    });

    this.activeProjectiles = this.activeProjectiles.filter(p => {
      p.update(deltaTime);
      if (p instanceof RocketProjectile) {
        p.spawnTrail(this);
      }
      if (p.isDead) {
        if (p instanceof RocketProjectile) {
          this.rocketPool.release(p);
        } else {
          this.projectilePool.release(p);
        }
        return false;
      }
      return true;
    });

    this.enemies = this.enemies.filter(e => {
      e.update(deltaTime, this.player, this);
      if (e instanceof RocketEnemy) {
        e.spawnTrail(this);
      }
      if (e.isDead) {
        if (e instanceof RocketEnemy) {
            this.rocketEnemyPool.release(e);
        } else {
            this.enemyPool.release(e);
        }
        return false;
      }
      return true;
    });

    // Update Floating Texts
    this.activeTexts = this.activeTexts.filter(t => {
      t.update(deltaTime);
      if (t.isDead) {
        this.textPool.release(t);
        return false;
      }
      return true;
    });
    
    this.powerUps = this.powerUps.filter(p => {
      if (this.player.magnetActive && p.type === 'xp') {
        const dx = this.player.position.x - p.position.x;
        const dy = this.player.position.y - p.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 250) {
          const speed = 200;
          const nx = dx / dist;
          const ny = dy / dist;
          p.position.x += nx * speed * deltaTime;
          p.position.y += ny * speed * deltaTime;
        }
      }
      p.update(deltaTime);
      if (p.lifeTime <= 0) return false;
      return !p.collected;
    });

    // Detecção de Colisões
    this.checkCollisions();
  }

  spawnBoss() {
    if (this.boss) return;
    this.boss = new Boss(this.canvasWidth / 2, -100);
    this.gameState = 'boss_fight';
    AudioManager.getInstance().playBossSpawn();
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvasWidth, this.canvasHeight) / 1.5; // Spawn off-screen
    const x = this.player.position.x + Math.cos(angle) * distance;
    const y = this.player.position.y + Math.sin(angle) * distance;
    
    // 30% de chance de spawnar um RocketEnemy
    if (Math.random() < 0.3) {
        const enemy = this.rocketEnemyPool.get(x, y);
        enemy.speed = 150 + Math.random() * 100 + this.player.level * 5;
        this.enemies.push(enemy);
    } else {
        // Use Pool instead of new
        const enemy = this.enemyPool.get(x, y);
        // Aumenta dificuldade com o tempo
        enemy.speed += this.player.level * 5;
        this.enemies.push(enemy);
    }
  }

  checkCollisions() {
    // 1. Popula a grade espacial
    this.grid.clear();
    this.enemies.forEach(e => this.grid.insert(e));
    if (this.boss && !this.boss.isDead) this.grid.insert(this.boss);

    // 2. Projéteis vs Inimigos/Boss
    this.activeProjectiles.forEach(proj => {
      const nearbyEnemies = this.grid.retrieve(proj) as Enemy[];
      
      for (const enemy of nearbyEnemies) {
        if (enemy.isDead) continue;

        const dist = Vector2.distance(proj.position, enemy.position);
        if (dist < enemy.radius + proj.radius) {
          enemy.takeDamage(10);
          
          // Spawn Floating Text
          const text = this.textPool.get(enemy.position.x, enemy.position.y - 20, "10", "#fff");
          this.activeTexts.push(text);

          proj.isDead = true;
          
          this.spawnParticles(enemy.position, 5, enemy.color);
          
          if (enemy.isDead) {
            this.handleEnemyDeath(enemy);
          }
          break; // Um projétil atinge apenas um inimigo
        }
      }
    });

    // 3. Player vs Inimigos/Boss
    const nearbyToPlayer = this.grid.retrieve(this.player) as Enemy[];
    for (const enemy of nearbyToPlayer) {
      if (enemy.isDead) continue;

      const dist = Vector2.distance(this.player.position, enemy.position);
      if (dist < this.player.radius + enemy.radius) {
        if (this.player.invulnerableTimer <= 0) {
            this.player.takeDamage(10);
            AudioManager.getInstance().playPlayerDamage();
            this.screenShake = 25; // Aumentado para 25 para ser "intenso"
            this.damageFlashTimer = 0.5; // Inicia flash de 0.5s
            
            if (this.player.hp <= 0) {
                this.gameState = 'gameover';
                this.saveHighScore();
                this.screenShake = 30;
                AudioManager.getInstance().playExplosion();
            }
        }
      }
    }

    // 4. Player vs PowerUps
    this.powerUps.forEach(p => {
        if (p.collected) return;
        const dist = Vector2.distance(this.player.position, p.position);
        if (dist < this.player.radius + p.radius) {
            p.collected = true;
            const prevLevel = this.player.level;
            p.effect(this.player);
            if (this.player.level > prevLevel) {
              this.handleLevelUpFeedback();
            }
            
            this.spawnNeonExplosion(p.position, 20);
            this.pickupFlashTimer = 0.2; // Satisfying flash

            AudioManager.getInstance().playPowerUp();
        }
    });
  }

  handleEnemyDeath(enemy: Enemy) {
    if (enemy instanceof Boss) {
        // Boss Defeated!
        this.score += 5000;
        
        const text = this.textPool.get(enemy.position.x, enemy.position.y - 50, "BOSS DEFEATED!", "#FFD700");
        this.activeTexts.push(text);

        this.screenShake = 50; // HUGE SHAKE
        this.spawnNeonExplosion(enemy.position, 100); // Massive Neon Explosion
        this.pickupFlashTimer = 0.5; // Big Flash

        this.boss = null;
        this.gameState = 'playing'; // Volta ao normal?
        this.playTime = 0; // Reseta timer do boss
        this.saveHighScore();

        const prevLevel = this.player.level;
        this.player.addXp(1000); // Level up garantido
        if (this.player.level > prevLevel) {
          this.handleLevelUpFeedback();
        }
    } else if (enemy instanceof RocketEnemy) {
        this.score += 50;
        const prevLevel = this.player.level;
        this.player.addXp(30);
        if (this.player.level > prevLevel) {
          this.handleLevelUpFeedback();
        }
        
        this.spawnRocketExplosion(enemy.position);
        this.pickupFlashTimer = 0.05; // Tiny flash

        if (Math.random() < 0.25) { 
            const pu = PowerUpFactory.createRandomDrop(enemy.position.x, enemy.position.y);
            if (pu) this.powerUps.push(pu);
        }
    } else {
        this.score += 10;
        const prevLevel = this.player.level;
        this.player.addXp(15);
        if (this.player.level > prevLevel) {
          this.handleLevelUpFeedback();
        }
        
        if (Math.random() < 0.20) { // Aumentado drop rate de 8% para 20%
            const pu = PowerUpFactory.createRandomDrop(enemy.position.x, enemy.position.y);
            if (pu) this.powerUps.push(pu);
        }
        
        this.spawnNeonExplosion(enemy.position, 15);
        this.pickupFlashTimer = 0.05; // Tiny flash
    }
    
    // Devolve ao pool - REMOVIDO DAQUI, feito no loop principal
    // this.enemyPool.release(enemy);
    
    AudioManager.getInstance().playExplosion();
  }

  private handleLevelUpFeedback() {
    this.screenShake = Math.max(this.screenShake, 25);
    this.hitStopTimer = Math.max(this.hitStopTimer, 0.12);

    const text = this.textPool.get(
      this.player.position.x,
      this.player.position.y - 60,
      `LEVEL ${this.player.level}!`,
      '#22d3ee'
    );
    this.activeTexts.push(text);

    this.spawnParticles(this.player.position, 40, '#22d3ee');
    AudioManager.getInstance().playPowerUp();
  }

  /**
   * Renderiza o jogo.
   * Chamado a cada frame pelo Game Loop.
   */
  draw(ctx: CanvasRenderingContext2D) {
    // Renderiza o Background Dinâmico (Stars, Nebulas, Meteors)
    this.backgroundSystem.draw(ctx, this.camera);
    
    ctx.save();

    // 1. Screen Shake Effect
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // 2. Câmera (World Space -> Screen Space)
    ctx.translate(-this.camera.x, -this.camera.y);

    // 3. Grid (Desativado em favor do Background Espacial)
    // this.drawGrid(ctx);

    // 4. Entidades
    this.powerUps.forEach(p => p.draw(ctx));
    this.activeParticles.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.activeTexts.forEach(t => t.draw(ctx));
    
    if (this.boss && !this.boss.isDead) {
        this.boss.draw(ctx);
    }
    
    // Player desenhado ANTES dos projéteis para que os tiros saiam "de cima" dele
    this.player.draw(ctx);
    
    this.activeProjectiles.forEach(p => p.draw(ctx));

    ctx.restore();

    // 5. Post-Process Effects (UI Overlay / Damage Flash)
    if (this.damageFlashTimer > 0) {
        ctx.save();
        // Red Flash
        const alpha = Math.min(0.6, this.damageFlashTimer);
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Vignette Blur (Radial Gradient)
        // Simula visão de túnel/dano nas bordas
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;
        const outerRadius = Math.max(this.canvasWidth, this.canvasHeight) * 0.8;
        const innerRadius = Math.max(this.canvasWidth, this.canvasHeight) * 0.3;
        
        const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(150, 0, 0, ${alpha})`); // Bordas vermelhas escuras
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.restore();
    }

    if (this.pickupFlashTimer > 0) {
        ctx.save();
        // White Flash (Additive)
        const alpha = Math.min(0.3, this.pickupFlashTimer); 
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.globalCompositeOperation = 'lighter'; // "Luz"
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        ctx.restore();
    }

    // Distorção de Velocidade (Elite Mode)
    if (this.player.eliteMode) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Linhas de velocidade (Speed Lines)
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200 + 100;
            const len = Math.random() * 100 + 50;
            
            const x1 = cx + Math.cos(angle) * dist;
            const y1 = cy + Math.sin(angle) * dist;
            const x2 = cx + Math.cos(angle) * (dist + len);
            const y2 = cy + Math.sin(angle) * (dist + len);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(0, 255, 255, ${Math.random() * 0.5})`;
            ctx.lineWidth = Math.random() * 2 + 1;
            ctx.stroke();
        }
        
        // Bordas Ciano
        const grad = ctx.createRadialGradient(cx, cy, this.canvasWidth * 0.4, cx, cy, this.canvasWidth * 0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        ctx.restore();
    }

    // 6. UI Overlay (Boss Health Bar)
    if (this.boss && !this.boss.isDead) {
        const barWidth = 400;
        const barHeight = 20;
        const x = (this.canvasWidth - barWidth) / 2;
        const y = 50;

        ctx.save();
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        
        // Health Bar
        const hpPercent = Math.max(0, this.boss.hp / this.boss.maxHp);
        ctx.fillStyle = '#ff0055'; // Boss color
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("ROCKET BOSS", this.canvasWidth / 2, y - 10);
        ctx.restore();
    }

    // 7. Game Over Screen
    if (this.gameState === 'gameover') {
        this.drawGameOver(ctx);
    }
  }

  private drawGameOver(ctx: CanvasRenderingContext2D) {
      const w = this.canvasWidth;
      const h = this.canvasHeight;
      const t = this.gameOverTimer;

      ctx.save();
      
      // 1. Dark Overlay with noise
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);

      // Static Noise (Glitch lines)
      for (let i = 0; i < 20; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const rw = Math.random() * w;
          const rh = Math.random() * 5;
          ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, ${Math.random() * 0.1})`;
          ctx.fillRect(x, y, rw, rh);
      }

      // 2. Text Setup
      const colors = ['#ff0055', '#00ffaa', '#00ffff'];
      const colorIndex = Math.floor(t * 10) % colors.length;
      const currentColor = colors[colorIndex];
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Pulse Effect
      const scale = 1 + Math.sin(t * 5) * 0.05;
      
      // Shake Effect
      const shakeX = (Math.random() - 0.5) * 10;
      const shakeY = (Math.random() - 0.5) * 10;
      
      const centerX = w / 2 + shakeX;
      const centerY = h / 2 + shakeY;

      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      // 3. Glitch Text (RGB Split / Multiple Draws)
      ctx.font = 'bold 80px monospace';
      
      // Shadow / Neon
      ctx.shadowBlur = 20 + Math.random() * 20;
      ctx.shadowColor = currentColor;

      // Draw Offset 1 (Red/Pink)
      ctx.fillStyle = 'rgba(255, 0, 85, 0.5)';
      ctx.fillText("GAME OVER", 4, 0);

      // Draw Offset 2 (Blue/Cyan)
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.fillText("GAME OVER", -4, 0);

      // Main Text
      ctx.fillStyle = currentColor;
      ctx.fillText("GAME OVER", 0, 0);

      // Subtext
      ctx.shadowBlur = 0;
      ctx.font = '24px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${Math.floor(this.score)}`, 0, 60);
      
      if (Math.floor(t * 2) % 2 === 0) { // Blink
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText("Press R to Restart", 0, 100);
      }

      ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      const gridSize = 100;
      
      const startX = Math.floor(this.camera.x / gridSize) * gridSize;
      const startY = Math.floor(this.camera.y / gridSize) * gridSize;
      const endX = startX + this.canvasWidth + gridSize;
      const endY = startY + this.canvasHeight + gridSize;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
      }
      ctx.stroke();
  }
}
