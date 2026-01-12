import { Vector2 } from '../engine/Vector2';

/**
 * Classe base para todos os objetos do jogo.
 * Encapsula propriedades físicas comuns como posição, velocidade e renderização básica.
 */
export class GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  isDead: boolean = false;
  active: boolean = false; // Required for ObjectPool

  constructor(x: number, y: number, radius: number, color: string) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.radius = radius;
    this.color = color;
  }

  /**
   * Atualiza o estado físico do objeto.
   * Aplica a velocidade à posição baseado no tempo delta (frame rate independente).
   */
  update(deltaTime: number) {
    this.position = this.position.add(this.velocity.scale(deltaTime));
  }

  /**
   * Renderiza o objeto no Canvas.
   * Pode ser sobrescrito por classes filhas para desenhos mais complexos.
   */
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
