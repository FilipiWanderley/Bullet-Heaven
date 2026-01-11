import { Vector2 } from './Vector2';

export class GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  isDead: boolean = false;

  constructor(x: number, y: number, radius: number, color: string) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.radius = radius;
    this.color = color;
  }

  update(deltaTime: number) {
    // Basic movement logic
    this.position = this.position.add(this.velocity.scale(deltaTime));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
