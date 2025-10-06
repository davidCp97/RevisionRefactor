import { FastifyInstance } from "fastify";
import { AlreadyExistsError, BadRequestError, DomainRuleViolation } from "../../../shared/errors";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    app.log.error({ err }, "Unhandled error");

    if (err instanceof BadRequestError) {
      return reply.status(400).send({ error: "BadRequest", message: err.message });
    }
    if (err instanceof DomainRuleViolation) {
      return reply.status(409).send({ error: "DomainRuleViolation", message: err.message });
    }
    if (err instanceof AlreadyExistsError) {
      return reply.status(409).send({ error: "AlreadyProcessed", message: err.message });
    }
    // Validación fastify
    if ((err as any).validation) {
      return reply.status(400).send({ error: "ValidationError", message: err.message });
    }
    return reply.status(500).send({ error: "InternalError", message: "Unexpected error" });
  });
}
