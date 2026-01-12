/**
 * Interface para objetos que podem ser inseridos na grade espacial.
 * Exige posição e raio para cálculo de colisão.
 */
export interface SpatialObject {
  id?: string;
  position: { x: number, y: number };
  radius: number;
  type?: string;
  entity?: any; // Referência para a entidade real do jogo
}

/**
 * Sistema de Particionamento Espacial (Spatial Hash Grid).
 * Otimização de Algoritmo O(N).
 * 
 * Justificativa Técnica:
 * Em vez de comparar todos contra todos (O(N^2)), dividimos o espaço em "baldes" (células).
 * Apenas entidades no mesmo balde (e vizinhos) são testadas.
 * Isso reduz drasticamente as verificações de colisão em cenários com muitas entidades.
 */
export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, SpatialObject[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    // width e height removidos pois a implementação agora é infinita (Map)
    this.grid = new Map();
  }

  /**
   * Limpa a grade para reconstrução a cada frame.
   */
  clear() {
    this.grid.clear();
  }

  private getKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Adiciona um objeto à célula correspondente.
   * Complexidade: O(1)
   */
  insert(obj: SpatialObject) {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);
    const key = this.getKey(cellX, cellY);

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(obj);
  }

  /**
   * Recupera candidatos a colisão (Broad Phase).
   * Retorna objetos na mesma célula e nas adjacentes (3x3).
   * Complexidade: O(1) (constante, pois checa no máximo 9 células)
   */
  retrieve(obj: SpatialObject): SpatialObject[] {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);
    const candidates: SpatialObject[] = [];

    // Verifica 3x3 vizinhos
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = this.getKey(cellX + i, cellY + j);
        const cellObjects = this.grid.get(key);
        
        if (cellObjects) {
          for (let k = 0; k < cellObjects.length; k++) {
            candidates.push(cellObjects[k]);
          }
        }
      }
    }

    return candidates;
  }
}
