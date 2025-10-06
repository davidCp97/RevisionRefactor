import { CheckpointService } from "../src/application/services/CheckpointService";
import { InMemoryCheckpointRepository } from "../src/infrastructure/persistence/InMemoryCheckpointRepository";
import { InMemoryIdempotencyStore } from "../src/infrastructure/persistence/InMemoryIdempotencyStore";
import { UnitOfWork } from "../src/application/ports/UnitOfWork";
import { Status } from "../src/domain/status";

class NoopUoW implements UnitOfWork {
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

describe("CheckpointService", () => {
  const uow: UnitOfWork = new NoopUoW();

  test("crea checkpoint con idempotencia", async () => {
    const svc = new CheckpointService(
      new InMemoryCheckpointRepository(),
      new InMemoryIdempotencyStore(),
      uow
    );
    const idem = "key-1";
    const dto = { unitId: "U1", status: Status.CREATED, eventTime: new Date("2025-01-01T10:00:00Z") };

    const a = await svc.create(dto, idem);
    const b = await svc.create(dto, idem); // mismo resultado por idempotencia

    expect(a.id).toEqual(b.id);
    expect(a.eventTime).toEqual("2025-01-01T10:00:00.000Z");
  });

  test("rechaza retroceso de estado", async () => {
    const svc = new CheckpointService(
      new InMemoryCheckpointRepository(),
      new InMemoryIdempotencyStore(),
      uow
    );

    await svc.create({ unitId: "U2", status: Status.CREATED,    eventTime: new Date("2025-01-01T10:00Z") }, "k1");
    await svc.create({ unitId: "U2", status: Status.IN_TRANSIT, eventTime: new Date("2025-01-01T11:00Z") }, "k2");

    await expect(
      svc.create({ unitId: "U2", status: Status.CREATED, eventTime: new Date("2025-01-01T12:00Z") }, "k3")
    ).rejects.toThrow();
  });
});
