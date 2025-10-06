import { Checkpoint } from "../../domain/checkpoint";
import { CheckpointRepository } from "../../application/ports/CheckpointRepository";

export class InMemoryCheckpointRepository implements CheckpointRepository {
  private store: Checkpoint[] = [];

  async findByUnit(unitId: string, page: number, pageSize: number) {
    const filtered = this.store.filter(c => c.unitId === unitId)
      .sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map(c => ({ ...c }));
    return { items, total };
  }

  async getAllByUnit(unitId: string): Promise<Checkpoint[]> {
    return this.store
      .filter(c => c.unitId === unitId)
      .sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime())
      .map(c => ({ ...c }));
  }

  async save(cp: Checkpoint): Promise<void> {
    this.store.push({ ...cp });
  }

  // helper para demo
  async listAllUnits(): Promise<string[]> {
    return Array.from(new Set(this.store.map(c => c.unitId)));
  }
}
