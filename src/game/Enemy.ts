import { GameObject } from './GameObject';
import { Player } from './Player';

export class Enemy extends GameObject {
  speed: number;

  constructor(x: number, y: number) {
    super(x, y, 10, 'red');
    this.speed = 100 + Math.random() * 50;
  }

  // Update agora aceita o jogador para perseguição
  update(deltaTime: number, player?: Player) {
    if (player) {
      // Vetores Matemáticos: Normalização de vetores para calcular a direção do inimigo
      const direction = player.position.sub(this.position).normalize();
      this.velocity = direction.scale(this.speed);
    }
    super.update(deltaTime);
  }
}
