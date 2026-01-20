import { Vector2 } from '../engine/Vector2';

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  parallax: number;
  blinkOffset: number;
  baseAlpha: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  colorStart: string;
  colorEnd: string;
  parallax: number;
}

interface Meteor {
  position: Vector2;
  velocity: Vector2;
  length: number;
  lifeTime: number;
  maxLifeTime: number;
  color: string;
}

export class BackgroundSystem {
  private width: number;
  private height: number;
  private stars: Star[] = [];
  private nebulas: Nebula[] = [];
  private meteors: Meteor[] = [];
  private meteorTimer: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init();
  }

  private init() {
    this.stars = [];
    this.nebulas = [];

    // 1. Generate Nebulas (Background Layers)
    // Cyberpunk Colors: Deep Purple, Magenta, Cyan, Dark Blue
    const nebulaColors = [
      { start: 'rgba(76, 29, 149, 0.2)', end: 'rgba(76, 29, 149, 0)' }, // Purple
      { start: 'rgba(192, 38, 211, 0.15)', end: 'rgba(192, 38, 211, 0)' }, // Magenta
      { start: 'rgba(8, 145, 178, 0.15)', end: 'rgba(8, 145, 178, 0)' }, // Cyan
      { start: 'rgba(29, 78, 216, 0.2)', end: 'rgba(29, 78, 216, 0)' }, // Blue
    ];

    for (let i = 0; i < 6; i++) {
      const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
      this.nebulas.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 300 + Math.random() * 400,
        colorStart: color.start,
        colorEnd: color.end,
        parallax: 0.05 + Math.random() * 0.05 // Very slow movement
      });
    }

    // 2. Generate Stars (3 Layers of depth)
    // Layer 1: Far, small, slow, numerous
    this.createStars(150, 0.5, 1.5, 0.1, 0.3);
    // Layer 2: Mid, medium, medium speed
    this.createStars(80, 1.5, 2.5, 0.3, 0.5);
    // Layer 3: Near, large, fast (rare)
    this.createStars(20, 2.5, 3.5, 0.6, 0.8);
  }

  private createStars(count: number, minSize: number, maxSize: number, minParallax: number, maxParallax: number) {
    const colors = ['#ffffff', '#00ffff', '#ff00ff', '#bd00ff', '#ffff00'];
    
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors[Math.floor(Math.random() * colors.length)],
        parallax: minParallax + Math.random() * (maxParallax - minParallax),
        blinkOffset: Math.random() * Math.PI * 2,
        baseAlpha: 0.5 + Math.random() * 0.5
      });
    }
  }

  update(deltaTime: number, cameraVelocity: Vector2) {
    // Meteors logic
    this.meteorTimer += deltaTime;
    // Spawn meteor every 5-15 seconds
    if (this.meteorTimer > 5 + Math.random() * 10) {
      this.spawnMeteor();
      this.meteorTimer = 0;
    }

    // Update active meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.position = m.position.add(m.velocity.scale(deltaTime));
      m.lifeTime -= deltaTime;

      if (m.lifeTime <= 0) {
        this.meteors.splice(i, 1);
      }
    }
  }

  private spawnMeteor() {
    // Random start position (usually top or right side)
    const side = Math.floor(Math.random() * 2); // 0: Top, 1: Right
    let startX, startY;
    let velX, velY;

    if (side === 0) { // Top
      startX = Math.random() * this.width;
      startY = -50;
      velX = (Math.random() - 0.5) * 500; // Left or Right
      velY = 500 + Math.random() * 500;   // Down fast
    } else { // Right
      startX = this.width + 50;
      startY = Math.random() * this.height;
      velX = -(500 + Math.random() * 500); // Left fast
      velY = (Math.random() - 0.5) * 500;  // Up or Down
    }

    this.meteors.push({
      position: new Vector2(startX, startY),
      velocity: new Vector2(velX, velY),
      length: 50 + Math.random() * 100,
      lifeTime: 2.0,
      maxLifeTime: 2.0,
      color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff'
    });
  }

  draw(ctx: CanvasRenderingContext2D, camera: Vector2) {
    // 1. Clear Background (Deep Space Black)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();

    // 2. Draw Nebulas (Furthest)
    this.nebulas.forEach(n => {
      // Calculate parallax position with wrapping
      let x = (n.x - camera.x * n.parallax) % this.width;
      let y = (n.y - camera.y * n.parallax) % this.height;
      if (x < -n.radius) x += this.width;
      if (y < -n.radius) y += this.height;
      
      // Since nebulas are large, we might need to draw them multiple times if they cross edges
      // Simple approach: Draw once, if it looks poppy we can improve later.
      // Better approach for seamless wrapping: Draw 4 times if near edge? 
      // For now, simple modulo wrapping is fine for a background layer.
      
      // Correction for negative modulo in JS
      if (x < 0) x += this.width;
      if (y < 0) y += this.height;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, n.radius);
      gradient.addColorStop(0, n.colorStart);
      gradient.addColorStop(1, n.colorEnd);

      ctx.fillStyle = gradient;
      ctx.globalCompositeOperation = 'screen'; // Blend mode for glowing effect
      ctx.beginPath();
      ctx.arc(x, y, n.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';

    // 3. Draw Stars (Middle to Near)
    const now = Date.now();
    this.stars.forEach(s => {
      let x = (s.x - camera.x * s.parallax) % this.width;
      let y = (s.y - camera.y * s.parallax) % this.height;
      
      if (x < 0) x += this.width;
      if (y < 0) y += this.height;

      // Twinkle Logic
      const twinkle = Math.sin(now * 0.003 + s.blinkOffset);
      const alpha = s.baseAlpha + twinkle * 0.3;

      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      
      // Neon Glow for larger stars
      if (s.size > 2.0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // 4. Draw Meteors (Front)
    this.meteors.forEach(m => {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      // Fade out tail
      const gradient = ctx.createLinearGradient(
        m.position.x, m.position.y,
        m.position.x - m.velocity.x * 0.2, m.position.y - m.velocity.y * 0.2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = m.color;

      ctx.beginPath();
      ctx.moveTo(m.position.x, m.position.y);
      // Trail length based on velocity
      ctx.lineTo(
        m.position.x - m.velocity.x * 0.15, 
        m.position.y - m.velocity.y * 0.15
      );
      ctx.stroke();
    });

    ctx.restore();
  }
}
