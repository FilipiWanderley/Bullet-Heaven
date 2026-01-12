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
  private cols: number;
  private rows: number;
  private grid: SpatialObject[][][];

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    
    // Inicializa a grade
    this.grid = [];
    this.clear();
  }

  /**
   * Limpa a grade para reconstrução a cada frame.
   * Em jogos dinâmicos, reconstruir é mais eficiente que mover objetos entre células.
   */
  clear() {
    this.grid = [];
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        this.grid[x][y] = [];
      }
    }
  }

  /**
   * Adiciona um objeto à célula correspondente.
   * Complexidade: O(1)
   */
  insert(obj: SpatialObject) {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);

    if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
      this.grid[cellX][cellY].push(obj);
    }
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

    // Verifica 3x3 vizinhos para lidar com objetos na borda das células
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const checkX = cellX + i;
        const checkY = cellY + j;

        if (checkX >= 0 && checkX < this.cols && checkY >= 0 && checkY < this.rows) {
          const cellObjects = this.grid[checkX][checkY];
          for (let k = 0; k < cellObjects.length; k++) {
            candidates.push(cellObjects[k]);
          }
        }
      }
    }

    return candidates;
  }
}
