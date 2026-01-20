import { Enemy } from './Enemy';
import { Player } from './Player';
import { Vector2 } from '../engine/Vector2';
import type { GameEngine } from '../engine/GameEngine';

type BossState = 'chase' | 'prepare_rockets' | 'firing_rockets' | 'prepare_slam' | 'slamming';

/**
 * Entidade Boss: O desafio final.
 * Possui mais vida, é maior e tem comportamento de perseguição implacável.
 */
export class Boss extends Enemy {
  state: BossState = 'chase';
  stateTimer: number = 0;
  attackCooldown: number = 0;
  fireTimer: number = 0;
  
  // Visuals
  pulseAngle: number = 0;
  rotation: number = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.radius = 80; // Massive
    this.hp = 3000; // Increased HP
    this.maxHp = 3000;
    this.speed = 80; 
    this.color = '#ff00aa'; // Neon Pink/Magenta
  }

  update(deltaTime: number, player: Player, engine: GameEngine) {
    if (this.isDead) return;

    this.stateTimer -= deltaTime;
    this.pulseAngle += deltaTime * 5;
    // Rotate slowly towards player or idle spin
    // this.rotation += deltaTime; 

    // Face the player
    const toPlayer = player.position.sub(this.position);
    const targetAngle = Math.atan2(toPlayer.y, toPlayer.x);
    // Smooth rotation
    let angleDiff = targetAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.rotation += angleDiff * 2.0 * deltaTime;


    // State Machine
    switch (this.state) {
        case 'chase':
            this.handleChase(deltaTime, player);
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                // Decide next attack based on distance or random
                const dist = Vector2.distance(this.position, player.position);
                if (dist < 250) {
                    this.enterState('prepare_slam');
                } else {
                    this.enterState('prepare_rockets');
                }
            }
            break;

        case 'prepare_rockets':
            // Carregando ataque (flash visual)
            if (this.stateTimer <= 0) {
                this.enterState('firing_rockets');
            }
            break;

        case 'firing_rockets':
             // Rapid Fire Logic
             this.fireTimer -= deltaTime;
             if (this.fireTimer <= 0) {
                 this.fireSingleRocket(engine, player);
                 // Faster fire rate as HP drops (0.2s -> 0.05s)
                 const hpRatio = this.hp / this.maxHp;
                 this.fireTimer = Math.max(0.05, hpRatio * 0.2); 
             }
             
             if (this.stateTimer <= 0) {
                 this.enterState('chase');
                 this.attackCooldown = Math.max(1.0, (this.hp / this.maxHp) * 3.0); // Faster recovery when low HP
             }
             break;

        case 'prepare_slam':
            // "Pula" (aumenta escala visualmente)
            if (this.stateTimer <= 0) {
                this.enterState('slamming');
            }
            break;

        case 'slamming':
            // Cai no chão e cria shockwave
            this.slamAttack(engine);
            this.enterState('chase');
            this.attackCooldown = 3.0;
            break;
    }

    // Aumenta dificuldade conforme HP cai (Enrage)
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio < 0.5) {
        this.speed = 150; // Mais rápido
    }
  }

  private enterState(newState: BossState) {
      this.state = newState;
      switch (newState) {
          case 'prepare_rockets':
              this.stateTimer = 1.0; // 1s charging
              break;
          case 'firing_rockets':
              this.stateTimer = 2.0; // 2s of continuous firing
              this.fireTimer = 0;
              break;
          case 'prepare_slam':
              this.stateTimer = 0.8; // 0.8s warning
              break;
          case 'chase':
              this.stateTimer = 0;
              break;
      }
  }

  private handleChase(deltaTime: number, player: Player) {
    const direction = player.position.sub(this.position).normalize();
    this.velocity = direction.scale(this.speed);
    this.position = this.position.add(this.velocity.scale(deltaTime));
  }

  private fireSingleRocket(engine: GameEngine, player: Player) {
      // Spread Pattern
      const toPlayer = player.position.sub(this.position).normalize();
      const spread = 0.5; // Radians spread
      const angleOffset = (Math.random() - 0.5) * spread;
      
      const angle = Math.atan2(toPlayer.y, toPlayer.x) + angleOffset;
      const dir = new Vector2(Math.cos(angle), Math.sin(angle));
      
      const rocket = engine.rocketEnemyPool.get(this.position.x, this.position.y);
      rocket.velocity = dir.scale(350); // Fast rockets
      rocket.life = 4.0;
      engine.enemies.push(rocket);
      
      engine.screenShake = 2; // Subtle shake per shot
  }

  private slamAttack(engine: GameEngine) {
      // Shockwave visual
      engine.spawnRocketExplosion(this.position); // Reusa o efeito legal que criei
      engine.screenShake = 30; // Tremor forte
      
      // Dano em área (simulado pela colisão do shockwave se eu tivesse física nisso, 
      // mas por enquanto é visual + check de distância no player)
      const dist = Vector2.distance(this.position, engine.player.position);
      if (dist < 200) { // Raio do slam
          engine.player.takeDamage(20);
          engine.screenShake = 40;
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Efeito de Aura Pulsante
    const pulse = 1 + Math.sin(this.pulseAngle) * 0.1;
    
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.scale(pulse, pulse);
    
    // Rotate to face movement or player (handled by this.rotation)
    ctx.rotate(this.rotation);

    // Warning colors state
    if (this.state === 'prepare_rockets' || this.state === 'prepare_slam') {
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff0000'; // Aviso vermelho
    } else {
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
    }

    // --- Draw Rocket Boss Shape ---
    
    // 1. Main Body (Dark Hull with Neon Edge)
    ctx.beginPath();
    // Nose
    ctx.moveTo(30, 0); 
    // Right Wing
    ctx.lineTo(-20, 25);
    ctx.lineTo(-20, 15);
    // Right Engine
    ctx.lineTo(-40, 20);
    // Back
    ctx.lineTo(-30, 0);
    // Left Engine
    ctx.lineTo(-40, -20);
    // Left Wing
    ctx.lineTo(-20, -15);
    ctx.lineTo(-20, -25);
    ctx.closePath();

    ctx.fillStyle = '#1a1a1a'; // Dark core
    ctx.fill();
    
    // Neon Edge
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    // 2. Glowing Core / Engine
    ctx.beginPath();
    ctx.arc(-20, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffffff';
    ctx.fill();

    // 3. Engine Thrusters (Animated)
    const thrusterLen = 20 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.lineTo(-40 - thrusterLen, 15);
    ctx.lineTo(-40, 20);
    ctx.moveTo(-40, -10);
    ctx.lineTo(-40 - thrusterLen, -15);
    ctx.lineTo(-40, -20);
    ctx.fillStyle = '#00ffff'; // Blue flame
    ctx.fill();

    ctx.restore();
  }
}
