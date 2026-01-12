import { GameObject } from './GameObject';
import { Vector2 } from '../engine/Vector2';
import type { Poolable } from '../pool/ObjectPool';

/**
 * Projétil disparado pelo jogador.
 * Implementa Poolable para reutilização de memória.
 */
export class Projectile extends GameObject implements Poolable {
  speed: number = 600;
  life: number = 2.0;
  active: boolean = false;

  constructor() {
    // Inicializa zerado para o Pool
    // Cor Cyan neon para alta visibilidade
    super(0, 0, 6, '#00ffff');
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    
    // Bloom Effect (Brilho intenso)
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    
    ctx.fill();
    ctx.closePath();
    
    // Núcleo branco para parecer "energia"
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();
    
    ctx.shadowBlur = 0; // Reset para não poluir o contexto
  }

  /**
   * Reinicializa o projétil para uso.
   * Chamado pelo ObjectPool ao reciclar uma instância.
   */
  reset(x: number, y: number, direction: Vector2) {
    this.position.x = x;
    this.position.y = y;
    
    // Safety check: Se direção for zero (clique no centro do player), atira para direita
    if (direction.x === 0 && direction.y === 0) {
        direction = new Vector2(1, 0);
    }

    this.velocity = direction.normalize().scale(this.speed);
    this.life = 2.0;
    this.isDead = false;
    this.active = true;
  }

  update(deltaTime: number) {
    if (!this.active) return;
    
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.isDead = true;
    }
    super.update(deltaTime);
  }
}
