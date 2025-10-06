export interface IdempotencyStore {
  /**
   * Guarda/lee un resultado idempotente por clave. Si existe, retorna el valor previo.
   */
  putIfAbsent<T>(key: string, value: T, ttlMs?: number): Promise<T | null>;
  get<T>(key: string): Promise<T | null>;
}
