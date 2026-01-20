import { GameObject } from './GameObject';
import { Player } from './Player';
import { TripleShotWeaponStrategy, OrbitalFireStrategy, DefaultWeaponStrategy, RocketLauncherStrategy, TripleRocketStrategy } from '../strategies/WeaponStrategies';

export type PowerUpType = 'health' | 'xp' | 'weapon_triple' | 'weapon_orbital' | 'weapon_rocket' | 'weapon_triple_rocket' | 'speed' | 'shield' | 'magnet';

/**
 * Entidade PowerUp (Item coletável).
 * Representa itens deixados por inimigos (drop).
 */
export class PowerUp extends GameObject {
  type: PowerUpType;
  value: number;
  lifeTime: number = 10; // Segundos antes de desaparecer
  floatOffset: number = 0; // Para animação de flutuar
  collected: boolean = false;

  constructor(x: number, y: number, type: PowerUpType, value: number) {
    let color = '#ffffff';
    switch (type) {
        case 'health': color = '#00ff00'; break;
        case 'xp': color = '#FFD700'; break;
        case 'weapon_triple': color = '#ffaa00'; break;
        case 'weapon_orbital': color = '#aa00ff'; break;
        case 'weapon_rocket': color = '#ff4400'; break;
        case 'weapon_triple_rocket': color = '#ff00aa'; break; // Neon Magenta/Pink
        case 'speed': color = '#00bfff'; break;
        case 'shield': color = '#ff69b4'; break;
        case 'magnet': color = '#00ffe0'; break;
    }
    
    super(x, y, 10, color);
    this.type = type;
    this.value = value;
  }

  update(deltaTime: number) {
    this.lifeTime -= deltaTime;
    
    // Animação simples de flutuação (senóide)
    this.floatOffset += deltaTime * 5;
  }

  /**
   * Aplica o efeito do PowerUp no jogador/engine
   */
  effect(player: Player) {
      switch (this.type) {
          case 'health':
              player.heal(this.value);
              break;
          case 'xp':
              player.addXp(this.value);
              break;
          case 'weapon_triple':
              player.setWeaponStrategy(new TripleShotWeaponStrategy());
              setTimeout(() => {
                  if (!player.isDead) player.setWeaponStrategy(new DefaultWeaponStrategy());
              }, 10000); // 10 segundos de poder
              break;
          case 'weapon_orbital':
              player.setWeaponStrategy(new OrbitalFireStrategy());
              setTimeout(() => {
                if (!player.isDead) player.setWeaponStrategy(new DefaultWeaponStrategy());
            }, 10000);
              break;
          case 'weapon_rocket':
              player.setWeaponStrategy(new RocketLauncherStrategy());
              setTimeout(() => {
                if (!player.isDead) player.setWeaponStrategy(new DefaultWeaponStrategy());
            }, 10000);
              break;
          case 'weapon_triple_rocket':
              player.setWeaponStrategy(new TripleRocketStrategy());
              setTimeout(() => {
                if (!player.isDead) player.setWeaponStrategy(new DefaultWeaponStrategy());
            }, 10000);
              break;
          case 'speed': {
              const baseSpeed = 300;
              player.speed = baseSpeed * 1.5;
              setTimeout(() => {
                if (!player.isDead) player.speed = baseSpeed;
              }, 8000);
              break;
          }
          case 'shield': {
              player.shieldActive = true;
              setTimeout(() => {
                if (!player.isDead) player.shieldActive = false;
              }, 8000);
              break;
          }
          case 'magnet': {
              player.magnetActive = true;
              setTimeout(() => {
                if (!player.isDead) player.magnetActive = false;
              }, 8000);
              break;
          }
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Efeito de pulsação
    const pulse = 1 + Math.sin(this.floatOffset) * 0.2;
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.min(this.lifeTime, 1); // Fade out no final
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.closePath();

    // Ícone ou Texto indicativo
    if (this.type === 'weapon_triple_rocket') {
        // Custom Icon: Neon Orb with Glowing Rocket Symbol
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(pulse, pulse);

        // Rocket Body (Simple Triangle/Line representation)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        
        // Rocket Body
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();

        // Small side rockets (Triple indication)
        ctx.fillStyle = '#ff00aa'; // Pinkish
        ctx.beginPath();
        ctx.arc(-6, 2, 2, 0, Math.PI * 2);
        ctx.arc(6, 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    } else {
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let label = '';
        switch(this.type) {
            case 'health': label = '+HP'; break;
            case 'xp': label = 'XP'; break;
            case 'weapon_triple': label = '3X'; break;
            case 'weapon_orbital': label = 'ORB'; break;
            case 'weapon_rocket': label = 'RCK'; break;
            case 'speed': label = 'SPD'; break;
            case 'shield': label = 'SHD'; break;
            case 'magnet': label = 'MAG'; break;
        }
        ctx.fillText(label, this.position.x, this.position.y);
    }

    // Brilho externo
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
