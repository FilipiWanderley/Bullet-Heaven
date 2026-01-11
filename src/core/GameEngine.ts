import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Particle } from './entities/Particle';
import { Projectile } from './entities/Projectile';
import { Vector2 } from './physics/Vector2';
import type { GameState, InputKeys } from '../types';
import { SpatialGrid } from './physics/SpatialGrid';
import { PowerUp } from './entities/PowerUp';
import { PowerUpFactory } from './factories/PowerUpFactory';
import { AudioManager } from './audio/AudioManager';

/**
 * Motor principal do jogo.
 * Gerencia o loop de atualização, detecção de colisões e estados globais.
 * Mantém a lógica separada da camada de renderização (React).
 */
export class GameEngine {
  player: Player;
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  powerUps: PowerUp[] = []; // Lista de itens coletáveis
  keys: InputKeys = {};
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer: number = 0;
  
  // Otimização: Grade Espacial
  grid: SpatialGrid;
  
  // Estado do Jogo
  gameState: GameState = 'start';
  score: number = 0;
  
  // Efeitos Visuais e Câmera
  screenShake: number = 0;
  camera: Vector2 = new Vector2(0, 0); // Posição da Câmera (World Space)

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
    
    // Inicializa a grade com células de 100px (tamanho razoável para entidades)
    this.grid = new SpatialGrid(width, height, 100);
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
    this.particles = [];
    this.projectiles = [];
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
    // Recria a grade com novas dimensões
    this.grid = new SpatialGrid(width, height, 100);
  }

  /**
   * Atualiza o estado dos inputs atuais.
   */
  handleInput(keys: InputKeys) {
    this.keys = keys;
  }

  /**
   * Cria um novo projétil na direção do alvo (mouse).
   */
  spawnProjectile(target: Vector2) {
    if (this.gameState !== 'playing') return;
    
    // Ajusta o alvo baseado na posição da câmera (Screen -> World)
    const worldTarget = target.add(this.camera);
    
    const direction = worldTarget.sub(this.player.position).normalize();
    this.projectiles.push(new Projectile(this.player.position.x, this.player.position.y, direction));
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

    // Processamento de Input de Movimento
    const inputDir = new Vector2(0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1;
    
    // Normaliza para evitar movimento mais rápido na diagonal
    this.player.velocity = inputDir.normalize().scale(this.player.speed);
    
    this.player.update(deltaTime);
    
    // Atualização da Câmera (Juice: Lerp)
    // A câmera tenta centralizar o jogador suavemente
    // Alvo da câmera: Posição do jogador - Metade da tela (para centralizar)
    const targetCamX = this.player.position.x - this.canvasWidth / 2;
    const targetCamY = this.player.position.y - this.canvasHeight / 2;
    
    // Interpolação Linear (Lerp): Move 10% da distância por frame (ou ajustado por deltaTime)
    // Fórmula: current + (target - current) * factor
    const lerpFactor = 5 * deltaTime;
    this.camera.x += (targetCamX - this.camera.x) * lerpFactor;
    this.camera.y += (targetCamY - this.camera.y) * lerpFactor;
    
    // Sistema de Spawning de Inimigos
    this.spawnTimer += deltaTime;
    // Dificuldade progressiva baseada no nível do jogador
    if (this.spawnTimer > Math.max(0.2, 1.0 - this.player.level * 0.05)) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Atualização de Entidades
    this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));
    this.particles.forEach(particle => particle.update(deltaTime));
    this.projectiles.forEach(proj => proj.update(deltaTime));
    this.powerUps.forEach(p => p.update(deltaTime));

    // Otimização: Reconstrução da Grade Espacial
    this.grid.clear();
    this.enemies.forEach(e => this.grid.addObject({ 
      id: 'enemy', position: e.position, radius: e.radius, type: 'enemy' 
    }));
    // Adicionamos PowerUps na grade também para colisão com player
    this.powerUps.forEach(p => this.grid.addObject({
        id: 'powerup', position: p.position, radius: p.radius, type: 'powerup'
    }));

    this.checkCollisions();

    // Garbage Collection Manual: Remove entidades "mortas"
    this.enemies = this.enemies.filter(e => !e.isDead);
    this.particles = this.particles.filter(p => !p.isDead);
    this.projectiles = this.projectiles.filter(p => !p.isDead);
    this.powerUps = this.powerUps.filter(p => p.lifeTime > 0);
  }

  /**
   * Loop principal de renderização.
   */
  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Fundo Dark Cyberpunk
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Grade de fundo para dar sensação de movimento (Parallax/Referência)
    this.drawBackgroundGrid(ctx);

    ctx.save();
    
    // Aplica a transformação da câmera (move o mundo na direção oposta)
    // Com Screen Shake somado
    let shakeX = 0, shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }
    
    // Translate global: -camera + shake
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    this.powerUps.forEach(p => p.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
    this.player.draw(ctx);
    
    ctx.restore();
  }

  /**
   * Desenha uma grade de fundo para referência visual de movimento.
   */
  drawBackgroundGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 100;
    // Offset da grade baseado na câmera (efeito de rolagem infinita)
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

  /**
   * Gera um inimigo nas bordas da CÂMERA (não do canvas fixo).
   */
  spawnEnemy() {
    // Spawna fora da visão da câmera atual
    const buffer = 50;
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    // Coordenadas relativas à câmera (View Rect)
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

  /**
   * Gera partículas de explosão em uma posição específica.
   */
  spawnParticles(position: Vector2, count: number, color: string) {
    for(let i=0; i<count; i++) {
      this.particles.push(new Particle(position.x, position.y, color));
    }
  }

  /**
   * Verifica e resolve colisões entre todas as entidades.
   * Utiliza Spatial Partitioning para otimização de performance.
   * 
   * Complexidade: 
   * - Sem Grid: O(N * M) onde N = projéteis, M = inimigos.
   * - Com Grid: O(N * K) onde K é o número médio de entidades por célula (muito menor que M).
   */
  checkCollisions() {
    // 1. Projétil vs Inimigo (Otimizado com Grid)
    for (const proj of this.projectiles) {
      if (proj.isDead) continue;
      
      // Recupera apenas candidatos na mesma célula ou vizinhas
      const candidates = this.grid.retrieve({ 
          position: proj.position, radius: proj.radius 
      });

      for (const obj of candidates) {
        // Verifica se o objeto é um inimigo
        if (obj.type !== 'enemy' || !obj.entity) continue;
        
        const enemy = obj.entity as Enemy;
        if (enemy.isDead) continue;

        // Matemática Vetorial: Distância Euclidiana
        // Se a distância entre os centros for menor que a soma dos raios, houve colisão.
        // d = sqrt((x2-x1)^2 + (y2-y1)^2)
        if (Vector2.distance(proj.position, enemy.position) < proj.radius + enemy.radius) {
            proj.isDead = true;
            enemy.takeDamage(1);
            
            if (enemy.isDead) {
                this.handleEnemyDeath(enemy);
            } else {
                this.spawnParticles(enemy.position, 5, 'white');
            }
            // Um projétil atinge apenas um inimigo por vez
            break; 
        }
      }
    }
    
    // 2. Player vs Inimigo (Broad Phase usando Grid também)
    // Recupera objetos próximos ao player
    const nearbyObjects = this.grid.retrieve({
        position: this.player.position, radius: this.player.radius
    });

    for (const obj of nearbyObjects) {
        if (obj.type !== 'enemy' || !obj.entity) continue;
        
        const enemy = obj.entity as Enemy;
        if (enemy.isDead) continue;

        if (Vector2.distance(this.player.position, enemy.position) < this.player.radius + enemy.radius) {
            this.player.takeDamage(10);
            this.screenShake = 15;
            enemy.isDead = true;
            this.spawnParticles(enemy.position, 10, enemy.color);
            AudioManager.getInstance().playExplosion();
            
            if (this.player.hp <= 0) {
                this.gameState = 'gameover';
            }
        }
    }

    // 3. Player vs PowerUps
    // Também usamos a grid, pois PowerUps estão nela
    for (const obj of nearbyObjects) { // Reutilizamos a query de proximidade do player
        if (obj.type !== 'powerup' || !obj.entity) continue;
        
        const p = obj.entity as PowerUp;
        if (p.lifeTime <= 0) continue;

        if (Vector2.distance(this.player.position, p.position) < this.player.radius + p.radius) {
            // Efeito Sonoro
            AudioManager.getInstance().playPowerUp();
            
            if (p.type === 'health') this.player.heal(p.value);
            if (p.type === 'xp') this.player.addXp(p.value);
            
            p.lifeTime = 0; // Remove o item
        }
    }
  }

  /**
   * Lida com a lógica de morte do inimigo (Score, XP, Drop).
   */
  handleEnemyDeath(enemy: Enemy) {
      this.spawnParticles(enemy.position, 15, enemy.color);
      this.player.addXp(20);
      this.score += 100;
      this.screenShake = 5;
      AudioManager.getInstance().playExplosion();

      // Drop System (Factory)
      const drop = PowerUpFactory.createRandomDrop(enemy.position.x, enemy.position.y);
      if (drop) {
          this.powerUps.push(drop);
      }
  }
}
