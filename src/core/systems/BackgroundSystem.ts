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
  
  private backgroundImage: HTMLImageElement | null = null;
  private bgLoaded: boolean = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init();
    
    // Carrega imagem de fundo de alta qualidade
    // Fallback: Se falhar, usa o sistema procedural
    this.backgroundImage = new Image();
    this.backgroundImage.src = 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80';
    this.backgroundImage.onload = () => {
        this.bgLoaded = true;
        console.log('Background Image Loaded');
    };
    this.backgroundImage.onerror = () => {
        console.warn('Failed to load background image, using procedural generation');
        this.bgLoaded = false;
    };
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
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
    this.createStars(150, 1.0, 2.0, 0.1, 0.3);
    // Layer 2: Mid, medium, medium speed
    this.createStars(80, 2.0, 3.0, 0.3, 0.5);
    // Layer 3: Near, large, fast (rare)
    this.createStars(20, 3.0, 4.5, 0.6, 0.8);
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
    if (this.width <= 0 || this.height <= 0) return;

    // 1. Clear Background
    ctx.fillStyle = '#020210'; 
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();

    // 1.5 Draw Background Image (if loaded)
    if (this.bgLoaded && this.backgroundImage) {
        const bgW = this.backgroundImage.width;
        const bgH = this.backgroundImage.height;
        
        // Simple parallax tiling
        const scale = Math.max(this.width / bgW, this.height / bgH) * 1.2;
        const scaledW = bgW * scale;
        const scaledH = bgH * scale;

        // Move slower than camera (0.1 parallax)
        const x = (-(camera.x * 0.1) % scaledW);
        const y = (-(camera.y * 0.1) % scaledH);

        // Draw 4 tiles to cover movement
        ctx.globalAlpha = 0.4; // Darken it a bit so gameplay is visible
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                ctx.drawImage(this.backgroundImage, x + i * scaledW, y + j * scaledH, scaledW, scaledH);
            }
        }
        ctx.globalAlpha = 1.0;
    } else {
        // Fallback: Procedural Nebulas
        this.drawProceduralNebulas(ctx, camera);
    }

    // 2. Draw Stars (Middle to Near) - Always draw stars on top for depth
    this.drawStars(ctx, camera);
    
    // 3. Draw Meteors (Front)
    this.drawMeteors(ctx);

    ctx.restore();
  }

  private drawProceduralNebulas(ctx: CanvasRenderingContext2D, camera: Vector2) {
    this.nebulas.forEach(n => {
      // Calculate parallax position with wrapping
      let x = (n.x - camera.x * n.parallax) % this.width;
      let y = (n.y - camera.y * n.parallax) % this.height;
      
      // Handle negative modulo wrapping
      if (x < 0) x += this.width;
      if (y < 0) y += this.height;

      // Draw 4 times to ensure seamless wrapping for large objects
      const positions = [
          { dx: 0, dy: 0 },
          { dx: this.width, dy: 0 },
          { dx: -this.width, dy: 0 },
          { dx: 0, dy: this.height },
          { dx: 0, dy: -this.height }
      ];

      positions.forEach(pos => {
          const drawX = x + pos.dx;
          const drawY = y + pos.dy;
          
          // Optimization: only draw if visible
          if (drawX + n.radius < 0 || drawX - n.radius > this.width || 
              drawY + n.radius < 0 || drawY - n.radius > this.height) return;

          const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, n.radius);
          gradient.addColorStop(0, n.colorStart);
          gradient.addColorStop(1, n.colorEnd);

          ctx.fillStyle = gradient;
          ctx.globalCompositeOperation = 'screen'; 
          ctx.beginPath();
          ctx.arc(drawX, drawY, n.radius, 0, Math.PI * 2);
          ctx.fill();
      });
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawStars(ctx: CanvasRenderingContext2D, camera: Vector2) {
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
      // Boost alpha for visibility
      ctx.globalAlpha = Math.max(0.3, Math.min(1, alpha));
      
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
  }

  private drawMeteors(ctx: CanvasRenderingContext2D) {
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
  }
}
