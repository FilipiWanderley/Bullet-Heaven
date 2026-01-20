/**
 * Gerenciador de Reciclagem de Objetos (Object Pooling).
 * 
 * Justificativa Técnica:
 * A alocação frequente de memória (new) dentro do Game Loop causa pressão no Garbage Collector,
 * levando a "soluços" (frame drops) perceptíveis. O Pooling reutiliza instâncias inativas,
 * mantendo o consumo de memória estável e a performance fluida.
 */
export interface Poolable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset(...args: any[]): void;
  active: boolean;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 0) {
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn()); // Expande o pool inicialmente
    }
  }

  /**
   * Obtém uma instância do pool ou cria uma nova se vazio.
   * Complexidade: O(1)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(...args: any[]): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.createFn();
    }
    item.reset(...args);
    item.active = true;
    return item;
  }

  /**
   * Devolve uma instância ao pool para reutilização futura.
   * Complexidade: O(1)
   */
  release(item: T) {
    item.active = false;
    this.pool.push(item);
  }
}
