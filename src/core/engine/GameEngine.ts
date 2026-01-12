import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Particle } from '../entities/Particle';
import { Projectile } from '../entities/Projectile';
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
 */
export class GameEngine {
  player: Player;
  enemies: Enemy[] = [];
  powerUps: PowerUp[] = []; // Lista de itens coletáveis
  
  // Arrays de entidades ativas (gerenciadas pelo Pool)
  activeParticles: Particle[] = [];
  activeProjectiles: Projectile[] = [];

  // Object Pools
  particlePool: ObjectPool<Particle>;
  projectilePool: ObjectPool<Projectile>;

  keys: InputKeys = {};
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer: number = 0;
  
  // Otimização: Spatial Hash Grid
  grid: SpatialHashGrid;
  
  // Estado do Jogo
  gameState: GameState = 'start';
  score: number = 0;
  
  // Efeitos Visuais e Câmera
  screenShake: number = 0;
  hitStopTimer: number = 0;
  camera: Vector2 = new Vector2(0, 0); // Posição da Câmera (World Space)

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
    
    // Inicializa a grade com células de 100px
    this.grid = new SpatialHashGrid(width, height, 100);

    // Inicializa Pools
    // Pré-aloca objetos para evitar lag spikes durante o jogo
    this.particlePool = new ObjectPool<Particle>(() => new Particle(), 100);
    this.projectilePool = new ObjectPool<Projectile>(() => new Projectile(), 50);
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
    this.enemies = [];
    
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
    this.grid = new SpatialHashGrid(width, height, 100);
  }

  /**
   * Atualiza o estado dos inputs atuais.
   */
  handleInput(keys: InputKeys) {
    this.keys = keys;
  }

  /**
   * Cria um novo projétil usando Object Pooling.
   * Evita 'new Projectile()' para reduzir pressão no GC.
   */
  spawnProjectile(target: Vector2) {
    if (this.gameState !== 'playing') return;
    
    const worldTarget = target.add(this.camera);
    const direction = worldTarget.sub(this.player.position).normalize();
    
    // Obtém instância reciclada
    const proj = this.projectilePool.get(this.player.position.x, this.player.position.y, direction);
    this.activeProjectiles.push(proj);
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
  update(deltaTime: number) {
    if (this.gameState !== 'playing') return;

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
    if (this.spawnTimer > Math.max(0.2, 1.0 - this.player.level * 0.05)) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Atualização de Entidades (Inimigos)
    // Usamos filter aqui pois inimigos não estão em pool ainda (poderiam estar)
    // Para simplificar o escopo atual, mantemos array simples
    this.enemies = this.enemies.filter(enemy => {
        enemy.update(deltaTime, this.player);
        return !enemy.isDead;
    });

    // Atualização Otimizada de Partículas (Sem filter/new array)
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const p = this.activeParticles[i];
        p.update(deltaTime);
        if (p.isDead) {
            this.particlePool.release(p);
            // Swap-remove: O(1)
            this.activeParticles[i] = this.activeParticles[this.activeParticles.length - 1];
            this.activeParticles.pop();
        }
    }

    // Atualização Otimizada de Projéteis
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
        const p = this.activeProjectiles[i];
        p.update(deltaTime);
        if (p.isDead) {
            this.projectilePool.release(p);
            this.activeProjectiles[i] = this.activeProjectiles[this.activeProjectiles.length - 1];
            this.activeProjectiles.pop();
        }
    }

    this.powerUps.forEach(p => p.update(deltaTime));
    this.powerUps = this.powerUps.filter(p => p.lifeTime > 0);

    // Otimização: Reconstrução da Spatial Hash Grid
    // Custo linear O(N) para inserir
    this.grid.clear();
    this.enemies.forEach(e => this.grid.addObject({ 
      position: e.position, 
      radius: e.radius, 
      type: 'enemy',
      entity: e 
    }));
    this.powerUps.forEach(p => this.grid.addObject({
        position: p.position, 
        radius: p.radius, 
        type: 'powerup',
        entity: p
    }));

    this.checkCollisions();
  }

  /**
   * Verifica e resolve colisões usando Spatial Partitioning.
   */
  checkCollisions() {
    // 1. Projétil vs Inimigo (Broad Phase com Grid)
    for (const proj of this.activeProjectiles) {
      if (proj.isDead) continue;
      
      const candidates = this.grid.retrieve({ 
          position: proj.position, radius: proj.radius 
      });

      for (const obj of candidates) {
        if (obj.type !== 'enemy' || !obj.entity) continue;
        const enemy = obj.entity as Enemy;
        if (enemy.isDead) continue;

        // Narrow Phase: Distância
        if (Vector2.distance(proj.position, enemy.position) < proj.radius + enemy.radius) {
            proj.isDead = true; // Será removido no próximo update loop via pool
            enemy.takeDamage(1);
            
            if (enemy.isDead) {
                this.handleEnemyDeath(enemy);
            } else {
                this.spawnParticles(enemy.position, 5, 'white');
            }
            break; 
        }
      }
    }
    
    // 2. Player vs Inimigo
    const nearbyObjects = this.grid.retrieve({
        position: this.player.position, radius: this.player.radius
    });

    for (const obj of nearbyObjects) {
        if (obj.type === 'enemy' && obj.entity) {
            const enemy = obj.entity as Enemy;
            if (enemy.isDead) continue;

            if (Vector2.distance(this.player.position, enemy.position) < this.player.radius + enemy.radius) {
                this.player.takeDamage(10);
                this.screenShake = 15;
                this.hitStopTimer = 0.1; // 100ms de Hit-Stop
                enemy.isDead = true;
                this.spawnParticles(enemy.position, 10, enemy.color);
                AudioManager.getInstance().playExplosion();
                
                if (this.player.hp <= 0) {
                    this.gameState = 'gameover';
                }
            }
        }
        // 3. Player vs PowerUps
        else if (obj.type === 'powerup' && obj.entity) {
             const p = obj.entity as PowerUp;
             if (p.lifeTime <= 0) continue;

             if (Vector2.distance(this.player.position, p.position) < this.player.radius + p.radius) {
                 AudioManager.getInstance().playPowerUp();
                 if (p.type === 'health') this.player.heal(p.value);
                 if (p.type === 'xp') this.player.addXp(p.value);
                 p.lifeTime = 0;
             }
        }
    }
  }

  handleEnemyDeath(enemy: Enemy) {
      this.spawnParticles(enemy.position, 15, enemy.color);
      this.player.addXp(20);
      this.score += 100;
      this.screenShake = 5;
      AudioManager.getInstance().playExplosion();

      const drop = PowerUpFactory.createRandomDrop(enemy.position.x, enemy.position.y);
      if (drop) {
          this.powerUps.push(drop);
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    this.drawBackgroundGrid(ctx);

    ctx.save();
    
    let shakeX = 0, shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }
    
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    this.powerUps.forEach(p => p.draw(ctx));
    this.activeParticles.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.activeProjectiles.forEach(p => p.draw(ctx));
    this.player.draw(ctx);
    
    ctx.restore();
  }

  drawBackgroundGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 100;
    const offsetX = -this.camera.x % gridSize;
    const offsetY = -this.camera.y % gridSize;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = offsetX; x < this.canvasWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvasHeight);
    }
    for (let y = offsetY; y < this.canvasHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvasWidth, y);
    }
    ctx.stroke();
  }

  spawnEnemy() {
    const buffer = 50;
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    const left = this.camera.x - buffer;
    const right = this.camera.x + this.canvasWidth + buffer;
    const top = this.camera.y - buffer;
    const bottom = this.camera.y + this.canvasHeight + buffer;

    if (edge === 0) { x = Math.random() * (right - left) + left; y = top; }
    else if (edge === 1) { x = right; y = Math.random() * (bottom - top) + top; }
    else if (edge === 2) { x = Math.random() * (right - left) + left; y = bottom; }
    else { x = left; y = Math.random() * (bottom - top) + top; }
    
    this.enemies.push(new Enemy(x, y));
  }
}
