import { Player } from './Player';
import { Enemy } from './Enemy';
import { Particle } from './Particle';
import { Projectile } from './Projectile';
import { Vector2 } from './Vector2';

export class GameEngine {
  player: Player;
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  projectiles: Projectile[] = [];
  keys: { [key: string]: boolean } = {};
  canvasWidth: number;
  canvasHeight: number;
  spawnTimer: number = 0;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = new Player(width / 2, height / 2);
  }

  resize(width: number, height: number) {
      this.canvasWidth = width;
      this.canvasHeight = height;
  }

  handleInput(keys: { [key: string]: boolean }) {
      this.keys = keys;
  }

  spawnProjectile(target: Vector2) {
      const direction = target.sub(this.player.position).normalize();
      this.projectiles.push(new Projectile(this.player.position.x, this.player.position.y, direction));
  }

  update(deltaTime: number) {
    // Input handling
    const inputDir = new Vector2(0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputDir.y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputDir.y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputDir.x += 1;
    
    this.player.velocity = inputDir.normalize().scale(this.player.speed);
    
    this.player.update(deltaTime);
    
    this.spawnTimer += deltaTime;
    if (this.spawnTimer > 1.0) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));
    this.particles.forEach(particle => particle.update(deltaTime));
    this.projectiles.forEach(proj => proj.update(deltaTime));

    this.checkCollisions();

    // Gerenciamento de memória ao remover objetos mortos
    this.enemies = this.enemies.filter(e => !e.isDead);
    this.particles = this.particles.filter(p => !p.isDead);
    this.projectiles = this.projectiles.filter(p => !p.isDead);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    this.player.draw(ctx);
    this.enemies.forEach(e => e.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
  }

  spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (edge === 0) { x = Math.random() * this.canvasWidth; y = -20; }
    else if (edge === 1) { x = this.canvasWidth + 20; y = Math.random() * this.canvasHeight; }
    else if (edge === 2) { x = Math.random() * this.canvasWidth; y = this.canvasHeight + 20; }
    else { x = -20; y = Math.random() * this.canvasHeight; }
    
    this.enemies.push(new Enemy(x, y));
  }

  spawnParticles(position: Vector2, count: number) {
      for(let i=0; i<count; i++) {
          this.particles.push(new Particle(position.x, position.y));
      }
  }

  checkCollisions() {
    // Cálculo de colisão circular: Projectile vs Enemy
    for (const proj of this.projectiles) {
        if (proj.isDead) continue;
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;
            
            const dist = Vector2.distance(proj.position, enemy.position);
            if (dist < proj.radius + enemy.radius) {
                enemy.isDead = true;
                proj.isDead = true;
                this.spawnParticles(enemy.position, 10);
            }
        }
    }

    // Player vs Enemy
    for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Vector2.distance(this.player.position, enemy.position);
        if (dist < this.player.radius + enemy.radius) {
            // Game Over - Reset
            this.enemies = [];
            this.particles = [];
            this.projectiles = [];
            this.player.position = new Vector2(this.canvasWidth/2, this.canvasHeight/2);
        }
    }
  }
}
