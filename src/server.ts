import Fastify from "fastify";
import plugins from "./infrastructure/web/fastify/plugins";
import { registerRoutes } from "./infrastructure/web/fastify/routes";
import { registerErrorHandler } from "./infrastructure/web/fastify/errorHandler";
import { InMemoryCheckpointRepository } from "./infrastructure/persistence/InMemoryCheckpointRepository";
import { InMemoryIdempotencyStore } from "./infrastructure/persistence/InMemoryIdempotencyStore";
import { CheckpointService } from "./application/services/CheckpointService";
import { UnitOfWork } from "./application/ports/UnitOfWork";

const app = Fastify({ logger: true });

await app.register(plugins);

// Infra & DI
const repo = new InMemoryCheckpointRepository();
const idem = new InMemoryIdempotencyStore();
const uow: UnitOfWork = { runInTransaction: async <T>(fn: () => Promise<T>) => fn() }; // no-op en memoria

const svc = new CheckpointService(repo, idem, uow);

await registerRoutes(app, svc);
registerErrorHandler(app);

const port = Number(process.env.PORT || 3000);
try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Server running at http://0.0.0.0:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
