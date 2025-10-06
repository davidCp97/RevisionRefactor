import { Checkpoint } from "../../domain/checkpoint";

export interface CheckpointRepository {
  findByUnit(unitId: string, page: number, pageSize: number): Promise<{ items: Checkpoint[]; total: number }>;
  getAllByUnit(unitId: string): Promise<Checkpoint[]>;
  save(cp: Checkpoint): Promise<void>;
}
