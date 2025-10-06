import { Status } from "../domain/status";

export interface CreateCheckpointDTO {
  unitId: string;
  status: Status;
  eventTime: Date; // Mantener Date en dominio
}

export interface CheckpointView {
  id: string;
  unitId: string;
  status: Status;
  eventTime: string; // ISO en interfaz
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
