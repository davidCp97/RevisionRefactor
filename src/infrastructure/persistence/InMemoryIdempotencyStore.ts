import { IdempotencyStore } from "../../application/ports/IdempotencyStore";

type Entry = { value: unknown; expiresAt: number };

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private map = new Map<string, Entry>();

  async putIfAbsent<T>(key: string, value: T, ttlMs = 3600000): Promise<T | null> {
    const now = Date.now();
    const existing = this.map.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.value as T;
    }
    this.map.set(key, { value, expiresAt: now + ttlMs });
    return null;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value as T;
    }
}
