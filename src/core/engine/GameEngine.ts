import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Particle } from '../entities/Particle';
import { Projectile } from '../entities/Projectile';
import { FloatingText } from '../entities/FloatingText';
import { Vector2 } from './Vector2';
import type { GameState, InputKeys } from '../../types';
import { SpatialHashGrid } from './SpatialGrid';
import { PowerUp } from '../entities/PowerUp';
import { PowerUpFactory } from '../factories/PowerUpFactory';
import { AudioManager } from '../audio/AudioManager';
import { ObjectPool } from '../pool/ObjectPool';

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
  enemyPool: ObjectPool<Enemy>;
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
  score: number = 0;
  highScore: number = 0;
  playTime: number = 0;
  boss: Boss | null = null;
  
  // Efeitos Visuais e Câmera
  screenShake: number = 0;
  hitStopTimer: number = 0;
  camera: Vector2 = new Vector2(0, 0); // Posição da Câmera (World Space)

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
    
    // Inicializa a grade com células de 100px
    this.grid = new SpatialHashGrid(100);

    // Inicializa Pools
    // Pré-aloca objetos para evitar lag spikes durante o jogo
    this.particlePool = new ObjectPool<Particle>(() => new Particle(), 100);
    this.projectilePool = new ObjectPool<Projectile>(() => new Projectile(), 50);
    // Enemy pool - aloca 50 inicialmente
    this.enemyPool = new ObjectPool<Enemy>(() => new Enemy(0, 0), 50);
    // Text pool - aloca 20
    this.textPool = new ObjectPool<FloatingText>(() => new FloatingText(), 20);

    this.loadHighScore();
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('neon-survivor-highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    } catch (e) {
      console.warn('LocalStorage not available');
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('neon-survivor-highscore', this.highScore.toString());
      } catch (e) {
        console.warn('LocalStorage not available');
      }
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
    
    this.activeProjectiles.forEach(p => this.projectilePool.release(p));
    this.activeProjectiles = [];

    this.powerUps = [];
    this.score = 0;
    this.screenShake = 0;
    this.camera = new Vector2(0, 0);
  }

  /**
   * Ajusta as dimensões do mundo do jogo quando a janela é redimensionada.
   */
  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.grid = new SpatialHashGrid(100);
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
    for(let i=0; i<count; i++) {
      const p = this.particlePool.get(position.x, position.y, color);
      this.activeParticles.push(p);
    }
  }

  /**
   * Loop principal de atualização lógica (Physics Update).
   * @param deltaTime Tempo decorrido desde o último frame (em segundos).
   */
  setJoystickInput(x: number, y: number) {
    this.joystickInput.x = x;
    this.joystickInput.y = y;
  }

  update(deltaTime: number) {
    if (this.gameState !== 'playing' && this.gameState !== 'boss_fight') return;

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
        this.boss.update(deltaTime, this.player);
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
      if (p.isDead) {
        this.projectilePool.release(p);
        return false;
      }
      return true;
    });

    this.enemies = this.enemies.filter(e => {
      e.update(deltaTime, this.player);
      if (e.isDead) {
        this.enemyPool.release(e);
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
    
    // PowerUps update
    this.powerUps = this.powerUps.filter(p => !p.collected);

    // Detecção de Colisões
    this.checkCollisions();
  }

  spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 800;
    const x = this.player.position.x + Math.cos(angle) * distance;
    const y = this.player.position.y + Math.sin(angle) * distance;
    this.boss = new Boss(x, y);
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(this.canvasWidth, this.canvasHeight) / 1.5; // Spawn off-screen
    const x = this.player.position.x + Math.cos(angle) * distance;
    const y = this.player.position.y + Math.sin(angle) * distance;
    
    // Use Pool instead of new
    const enemy = this.enemyPool.get(x, y);
    // Aumenta dificuldade com o tempo
    enemy.speed += this.player.level * 5;
    this.enemies.push(enemy);
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
        // Game Over
        this.gameState = 'gameover';
        this.saveHighScore();
        this.screenShake = 20;
        AudioManager.getInstance().playExplosion();
      }
    }

    // 4. Player vs PowerUps
    this.powerUps.forEach(p => {
        if (p.collected) return;
        const dist = Vector2.distance(this.player.position, p.position);
        if (dist < this.player.radius + p.radius) {
            p.collected = true;
            p.effect(this.player);
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
        this.spawnParticles(enemy.position, 100, '#ff0055');
        this.boss = null;
        this.gameState = 'playing'; // Volta ao normal?
        this.playTime = 0; // Reseta timer do boss
        this.saveHighScore();
        this.player.addXp(1000); // Level up garantido
    } else {
        this.score += 10;
        this.player.addXp(20);
        
        // Chance de 5% de dropar PowerUp
        if (Math.random() < 0.05) {
            const pu = PowerUpFactory.createRandomDrop(enemy.position.x, enemy.position.y);
            if (pu) this.powerUps.push(pu);
        }
    }
    
    // Devolve ao pool - REMOVIDO DAQUI, feito no loop principal
    // this.enemyPool.release(enemy);
    
    AudioManager.getInstance().playExplosion();
  }

  /**
   * Renderiza o jogo.
   * Chamado a cada frame pelo Game Loop.
   */
  draw(ctx: CanvasRenderingContext2D) {
    // Limpa a tela (background)
    ctx.fillStyle = '#050505'; 
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    ctx.save();

    // 1. Screen Shake Effect
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // 2. Câmera (World Space -> Screen Space)
    ctx.translate(-this.camera.x, -this.camera.y);

    // 3. Grid
    this.drawGrid(ctx);

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