/**
 * Interface para objetos que podem ser inseridos na grade espacial.
 * Exige posição e raio para cálculo de colisão.
 */
export interface SpatialObject {
  id?: string;
  position: { x: number, y: number };
  radius: number;
  type?: string;
  entity?: unknown; // Referência para a entidade real do jogo
}

/**
 * Sistema de Particionamento Espacial (Spatial Hash Grid).
 * Otimização de Algoritmo O(N).
 * 
 * Justificativa Técnica:
 * Em vez de comparar todos contra todos (O(N^2)), dividimos o espaço em "baldes" (células).
 * Apenas entidades no mesmo balde (e vizinhos) são testadas.
 * Isso reduz drasticamente as verificações de colisão em cenários com muitas entidades.
 * 
 * OTIMIZAÇÃO V2:
 * - Chaves numéricas (bitwise) para evitar alocação de Strings.
 * - Reuso de Arrays para evitar Garbage Collection (GC).
 */
export class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<number, SpatialObject[]>;
  private activeKeys: number[]; // Rastreia chaves usadas no frame atual

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.activeKeys = [];
  }

  /**
   * Limpa a grade para reconstrução a cada frame.
   * OTIMIZADO: Não deleta os arrays, apenas zera o length.
   */
  clear() {
    for (let i = 0; i < this.activeKeys.length; i++) {
        const key = this.activeKeys[i];
        const cell = this.grid.get(key);
        if (cell) {
            cell.length = 0; // Limpeza rápida sem desalocar memória
        }
    }
    this.activeKeys.length = 0;
  }

  /**
   * Gera uma chave numérica única para a célula.
   * Usa bitwise packing para performance.
   * Suporta coordenadas de célula entre -32768 e +32767.
   */
  private getKey(x: number, y: number): number {
    // (x & 0xFFFF) pega os 16 bits inferiores
    // << 16 move y para os 16 bits superiores
    return ((x & 0xFFFF) | ((y & 0xFFFF) << 16));
  }

  /**
   * Adiciona um objeto à célula correspondente.
   * Complexidade: O(1)
   */
  insert(obj: SpatialObject) {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);
    const key = this.getKey(cellX, cellY);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }

    // Se a célula estava vazia (limpa), marcamos como ativa neste frame
    if (cell.length === 0) {
        this.activeKeys.push(key);
    }
    
    cell.push(obj);
  }

  /**
   * Recupera candidatos a colisão (Broad Phase).
   * Retorna objetos na mesma célula e nas adjacentes (3x3).
   * Complexidade: O(1) (constante, pois checa no máximo 9 células)
   * 
   * @param outArray Array opcional para popular com os resultados (evita alocação)
   */
  retrieve(obj: SpatialObject, outArray: SpatialObject[]): SpatialObject[] {
    const cellX = Math.floor(obj.position.x / this.cellSize);
    const cellY = Math.floor(obj.position.y / this.cellSize);
    
    // Se nenhum array for passado, usa um novo (comportamento antigo)
    // Mas o ideal é passar um array reusável
    const candidates = outArray;
    candidates.length = 0; // Limpa o array recebido

    // Verifica 3x3 vizinhos
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = this.getKey(cellX + i, cellY + j);
        const cellObjects = this.grid.get(key);
        
        if (cellObjects && cellObjects.length > 0) {
          // Push manual pode ser mais rápido que concat em loops quentes
          for (let k = 0; k < cellObjects.length; k++) {
            candidates.push(cellObjects[k]);
          }
        }
      }
    }

    return candidates;
  }
}
