import { CreateCheckpointDTO, CheckpointView, Paginated } from "../dto";
import { CheckpointRepository } from "../ports/CheckpointRepository";
import { IdempotencyStore } from "../ports/IdempotencyStore";
import { UnitOfWork } from "../ports/UnitOfWork";
import { TransitionPolicy } from "../../domain/policies/TransitionPolicy";
import { Checkpoint } from "../../domain/checkpoint";
import { toISO, uuid } from "../../shared/utils";
import { AlreadyExistsError, BadRequestError } from "../../shared/errors";

export class CheckpointService {
  constructor(
    private readonly repo: CheckpointRepository,
    private readonly idem: IdempotencyStore,
    private readonly uow: UnitOfWork
  ) {}

  async create(dto: CreateCheckpointDTO, idempotencyKey?: string): Promise<CheckpointView> {
    if (!idempotencyKey) {
      throw new BadRequestError("Falta encabezado Idempotency-Key.");
    }
    // Si ya existe, devolvemos el resultado previo
    const existing = await this.idem.get<CheckpointView>(idempotencyKey);
    if (existing) return existing;

    // Validar reglas de dominio con historia
    const history = await this.repo.getAllByUnit(dto.unitId);
    TransitionPolicy.validate(dto, history);

    // Crear entidad y persistir en una “transacción”
    const created = await this.uow.runInTransaction(async () => {
      const cp: Checkpoint = {
        id: uuid(),
        unitId: dto.unitId,
        status: dto.status,
        eventTime: dto.eventTime,
      };
      await this.repo.save(cp);
      const view: CheckpointView = { ...cp, eventTime: toISO(cp.eventTime) };
      const prev = await this.idem.putIfAbsent(idempotencyKey, view, 1000 * 60 * 60); // TTL 1h
      if (prev) throw new AlreadyExistsError("Operación ya procesada con esta Idempotency-Key.");
      return view;
    });

    return created;
  }

  async history(unitId: string, page: number, pageSize: number): Promise<Paginated<CheckpointView>> {
    const { items, total } = await this.repo.findByUnit(unitId, page, pageSize);
    return {
      items: items.map(i => ({ ...i, eventTime: toISO(i.eventTime) })),
      total,
      page,
      pageSize,
    };
  }

  async unitsByStatus(status: string, page: number, pageSize: number): Promise<Paginated<{ unitId: string }>> {
    // Derivar por checkpoints, no doble store
    // Estrategia simple: escanear unidades conocidas desde el repo (in-memory en este ejemplo)
    // En un DB real, esto sería una consulta agregada.
    const allUnits = await (this.repo as any).listAllUnits?.(); // helper opcional en impl in-memory
    const matched: string[] = [];
    for (const unitId of allUnits) {
      const history = await this.repo.getAllByUnit(unitId);
      const last = TransitionPolicy.deriveLastStatus(history).lastStatus;
      if (last && last === status) matched.push(unitId);
    }
    const start = (page - 1) * pageSize;
    const slice = matched.slice(start, start + pageSize).map(u => ({ unitId: u }));
    return { items: slice, total: matched.length, page, pageSize };
  }
}
