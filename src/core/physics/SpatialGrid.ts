
/**
 * Interface para objetos que podem ser inseridos na grade espacial.
 * Exige posição e raio para cálculo de colisão.
 */
export interface SpatialObject {
  id?: string; // Opcional, se quisermos usar mapa
  position: { x: number, y: number };
  radius: number;
  type?: string;
  entity?: any; // Referência para a entidade real do jogo
}

/**
 * Sistema de Particionamento Espacial (Spatial Partitioning).
 * Divide o mundo do jogo em uma grade de células fixas.
 * Otimiza a detecção de colisão de O(N^2) para O(N * K), onde K é pequeno (vizinhos).
 * 
 * Estratégia:
 * - Cada célula armazena uma lista de objetos que estão dentro dela.
 * - Para checar colisão de um objeto, verificamos apenas os objetos na mesma célula e nas adjacentes.
 */
export class SpatialGrid {
  private cellSize: number;
  private width: number;
  private height: number;
  private cols: number;
  private rows: number;
  private grid: SpatialObject[][][];

  constructor(width: number, height: number, cellSize: number) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    
    // Inicializa a grade vazia
    this.grid = [];
    this.clear();
  }

  /**
   * Limpa a grade para reconstrução a cada frame.
   * Em jogos dinâmicos, reconstruir é frequentemente mais rápido que atualizar.
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
   * Adiciona um objeto à(s) célula(s) correspondente(s).
   * Se um objeto estiver na borda, ele pode pertencer a múltiplas células?
   * Simplificação: Adicionamos baseados no centro. Para colisão precisa,
   * checamos vizinhos de qualquer forma.
   */
  addObject(obj: SpatialObject) {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);

    // Verifica limites para não crashar se sair da tela
    if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
      this.grid[cellX][cellY].push(obj);
    }
  }

  /**
   * Recupera possíveis candidatos a colisão para um dado objeto.
   * Retorna objetos na mesma célula e nas 8 células vizinhas.
   */
  retrieve(obj: SpatialObject): SpatialObject[] {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);
    const candidates: SpatialObject[] = [];

    // Itera sobre 3x3 células ao redor do objeto (incluindo a própria)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const checkX = cellX + i;
        const checkY = cellY + j;

        if (checkX >= 0 && checkX < this.cols && checkY >= 0 && checkY < this.rows) {
          const cellObjects = this.grid[checkX][checkY];
          // Adiciona objetos da célula vizinha
          // Usamos um loop for simples por performance (evitar spread/concat em hot path)
          for (let k = 0; k < cellObjects.length; k++) {
            candidates.push(cellObjects[k]);
          }
        }
      }
    }

    return candidates;
  }
}
