import { Projectile } from './Projectile';
import { Vector2 } from '../engine/Vector2';
import { GameEngine } from '../engine/GameEngine';

export class RocketProjectile extends Projectile {
  wobbleTimer: number = 0;
  
  constructor() {
    super();
    this.speed = 600; // Fast moving (matches normal bullet)
    this.life = 3.0;
    this.radius = 8; // Larger hit area
    this.color = '#ff4400'; // Neon Orange/Red
  }

  reset(x: number, y: number, direction: Vector2) {
    super.reset(x, y, direction);
    this.speed = 600;
    this.life = 3.0;
    this.radius = 8;
    this.color = '#ff4400';
    this.wobbleTimer = Math.random() * 10;
  }

  update(deltaTime: number) {
    super.update(deltaTime);
    this.wobbleTimer += deltaTime * 10;
  }

  // Method to spawn trail particles
  spawnTrail(engine: GameEngine) {
    // Spawn smoke/fire at the back
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    // Offset para a cauda do foguete
    const backX = this.position.x - Math.cos(angle) * 15;
    const backY = this.position.y - Math.sin(angle) * 15;
    
    // Neon Smoke Trail (Blue/Purple/Cyan mix)
    if (Math.random() < 0.6) {
      const colors = ['#00ffff', '#bd00ff', '#00ffaa'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const p = engine.particlePool.get(backX, backY, color);
      
      // Velocidade oposta ao foguete + dispersão aleatória
      p.velocity = this.velocity.scale(-0.1).add(new Vector2((Math.random()-0.5)*20, (Math.random()-0.5)*20));
      p.life = 0.6; // Rastro dura um pouco
      p.radius = Math.random() * 4 + 2;
      engine.activeParticles.push(p);
    }
    
    // Core Engine Flame (White/Yellow center)
    if (Math.random() < 0.4) {
      const p = engine.particlePool.get(backX, backY, '#ffffff');
      p.velocity = this.velocity.scale(-0.3); // Sai mais rápido para trás
      p.life = 0.2; // Queima rápido
      p.radius = Math.random() * 2 + 1;
      engine.activeParticles.push(p);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    // Rotate to face velocity
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    // Remove wobble from rotation to ensure "straight line" visual stability, 
    // but keep wobbleTimer for internal logic if needed (or remove it).
    // User asked for "straight line" so visual stability is key.
    ctx.rotate(angle + Math.PI / 2); 

    // Neon Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;
    
    // Main Body (Sleek Capsule)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Neon Core/Stripes
    ctx.fillStyle = this.color;
    ctx.fillRect(-2, -8, 4, 16);
    
    // Fins (Futuristic Wings)
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-8, 15);
    ctx.lineTo(-3, 15);
    ctx.lineTo(0, 8);
    ctx.lineTo(3, 15);
    ctx.lineTo(8, 15);
    ctx.lineTo(0, 5);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Engine Nozzle
    ctx.fillStyle = '#888888';
    ctx.fillRect(-3, 10, 6, 4);

    ctx.restore();
  }
}
