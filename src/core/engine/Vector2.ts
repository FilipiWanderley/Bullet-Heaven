/**
 * Representa um vetor 2D para cálculos físicos e posicionamento.
 * Utilizado para velocidade, posição e direção no plano cartesiano.
 */
export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Soma dois vetores.
   * Útil para aplicar velocidade à posição.
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtrai dois vetores.
   * Útil para calcular a diferença (distância) entre dois pontos.
   */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplica o vetor por um escalar.
   * Útil para aumentar ou diminuir a magnitude (velocidade).
   */
  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  /**
   * Calcula a magnitude (comprimento) do vetor.
   * Usado para determinar a distância ou velocidade escalar.
   */
  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normaliza o vetor (transforma em unitário com magnitude 1).
   * Essencial para manter a direção consistente independente da distância.
   */
  normalize(): Vector2 {
    const m = this.mag();
    if (m === 0) return new Vector2(0, 0);
    return new Vector2(this.x / m, this.y / m);
  }

  /**
   * Método estático para calcular a distância entre dois vetores.
   * Otimiza a leitura do código ao invés de fazer sub().mag() manualmente.
   */
  static distance(v1: Vector2, v2: Vector2): number {
    return v1.sub(v2).mag();
  }

  /**
   * Interpolação linear entre este vetor e outro.
   * t é o fator de interpolação entre 0 e 1.
   */
  lerp(v: Vector2, t: number): Vector2 {
    const x = this.x + (v.x - this.x) * t;
    const y = this.y + (v.y - this.y) * t;
    return new Vector2(x, y);
  }
}
