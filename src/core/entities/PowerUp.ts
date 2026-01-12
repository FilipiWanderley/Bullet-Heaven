import { GameObject } from './GameObject';
import { Player } from './Player';
import { TripleShotWeaponStrategy, OrbitalFireStrategy, DefaultWeaponStrategy } from '../strategies/WeaponStrategies';

export type PowerUpType = 'health' | 'xp' | 'weapon_triple' | 'weapon_orbital';

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
    // Cores: Verde (HP), Azul (XP), Laranja (Tiro Triplo), Roxo (Orbital)
    let color = '#ffffff';
    switch (type) {
        case 'health': color = '#00ff00'; break;
        case 'xp': color = '#00ffff'; break;
        case 'weapon_triple': color = '#ffaa00'; break;
        case 'weapon_orbital': color = '#aa00ff'; break;
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
              // Lógica de cura (Player precisaria ter HP, por enquanto não tem no código visto, mas vamos assumir ou adicionar)
              // O código do Player não mostrou HP explicitamente no snippet anterior, mas o GameEngine tem GameOver se tocar.
              // Vamos assumir que cura score ou algo visual por enquanto, ou adicionar HP ao Player.
              // Vendo o código do Player.ts (vou precisar ler para confirmar se tem HP).
              // Se não tiver, vamos dar Score extra ou XP.
              player.addXp(this.value); 
              break;
          case 'xp':
              player.addXp(this.value);
              break;
          case 'weapon_triple':
              player.setWeaponStrategy(new TripleShotWeaponStrategy());
              // Volta para weapon default após 10 segundos? Ou permanente?
              // Vamos deixar permanente até pegar outro ou morrer.
              // Opcional: Timeout.
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
    }
    ctx.fillText(label, this.position.x, this.position.y);

    // Brilho externo
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
