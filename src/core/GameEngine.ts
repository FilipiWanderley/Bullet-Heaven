import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Particle } from './entities/Particle';
import { Projectile } from './entities/Projectile';
import { Vector2 } from './physics/Vector2';
import type { GameState, InputKeys } from '../types';

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
  keys: InputKeys = {};
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer: number = 0;
  
  // Estado do Jogo
  gameState: GameState = 'start';
  score: number = 0;
  
  // Efeitos Visuais
  screenShake: number = 0;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
  }

  /**
   * Inicia ou reinicia a sessão de jogo.
   */
  startGame() {
    this.gameState = 'playing';
    this.reset();
  }

  /**
   * Reseta todas as entidades e pontuações para um novo jogo.
   */
  reset() {
    this.player = new Player(this.canvasWidth / 2, this.canvasHeight / 2);
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.score = 0;
    this.screenShake = 0;
  }

  /**
   * Ajusta as dimensões do mundo do jogo quando a janela é redimensionada.
   */
  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
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
    const direction = target.sub(this.player.position).normalize();
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

    this.checkCollisions();

    // Garbage Collection Manual: Remove entidades "mortas"
    this.enemies = this.enemies.filter(e => !e.isDead);
    this.particles = this.particles.filter(p => !p.isDead);
    this.projectiles = this.projectiles.filter(p => !p.isDead);
  }

  /**
   * Loop principal de renderização.
   */
  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Fundo Dark Cyberpunk
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    ctx.save();
    
    // Aplica o efeito de tremedeira na câmera (Screen Shake)
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    this.player.draw(ctx);
    this.enemies.forEach(e => e.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
    
    ctx.restore();
  }

  /**
   * Gera um inimigo em uma das bordas da tela aleatoriamente.
   */
  spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * this.canvasWidth; y = -20; }
    else if (edge === 1) { x = this.canvasWidth + 20; y = Math.random() * this.canvasHeight; }
    else if (edge === 2) { x = Math.random() * this.canvasWidth; y = this.canvasHeight + 20; }
    else { x = -20; y = Math.random() * this.canvasHeight; }
    
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
   * Utiliza detecção de círculo vs círculo.
   */
  checkCollisions() {
    // Projétil vs Inimigo
    for (const proj of this.projectiles) {
      if (proj.isDead) continue;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        
        const dist = Vector2.distance(proj.position, enemy.position);
        if (dist < proj.radius + enemy.radius) {
          proj.isDead = true;
          enemy.takeDamage(1);
          
          if (enemy.isDead) {
            this.spawnParticles(enemy.position, 15, enemy.color);
            this.player.addXp(20);
            this.score += 100;
            this.screenShake = 5; // Tremor leve ao matar
          } else {
            this.spawnParticles(enemy.position, 5, 'white'); // Faíscas ao acertar
          }
        }
      }
    }

    // Jogador vs Inimigo
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Vector2.distance(this.player.position, enemy.position);
      if (dist < this.player.radius + enemy.radius) {
        this.player.takeDamage(10);
        this.screenShake = 15; // Tremor forte ao receber dano
        enemy.isDead = true; // Inimigo "Kamikaze" morre ao colidir
        this.spawnParticles(enemy.position, 10, enemy.color);

        if (this.player.hp <= 0) {
          this.gameState = 'gameover';
        }
      }
    }
  }
}
