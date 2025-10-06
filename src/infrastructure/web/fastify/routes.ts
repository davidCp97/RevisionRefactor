import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { CreateCheckpointBody, PaginationQuery } from "./schemas";
import { Status } from "../../../domain/status";
import { CheckpointService } from "../../../application/services/CheckpointService";

export async function registerRoutes(app: FastifyInstance, svc: CheckpointService) {
  app.post(
    "/units/:unitId/checkpoints",
    {
      schema: {
        body: CreateCheckpointBody,
        params: Type.Object({ unitId: Type.String() }),
        headers: Type.Object({ "idempotency-key": Type.String() }, { additionalProperties: true }),
        response: { 201: Type.Any() },
      },
    },
    async (req, reply) => {
      const { unitId } = req.params as { unitId: string };
      const { status, eventTime } = req.body as { status: string; eventTime?: string };
      const idem = (req.headers["idempotency-key"] as string) || "";

      if (unitId !== (req.body as any).unitId) {
        // Forzar consistencia entre path y body
        throw new Error("unitId en path y body deben coincidir.");
      }
      if (!Object.values(Status).includes(status as Status)) {
        throw new Error("status inválido.");
      }

      const created = await svc.create(
        {
          unitId,
          status: status as Status,
          eventTime: eventTime ? new Date(eventTime) : new Date(),
        },
        idem
      );
      return reply.code(201).send(created);
    }
  );

  app.get(
    "/units/:unitId/history",
    { schema: { params: Type.Object({ unitId: Type.String() }), querystring: PaginationQuery } },
    async (req, reply) => {
      const { unitId } = req.params as { unitId: string };
      const { page = 1, pageSize = 50 } = req.query as any;
      const pageNum = Number(page);
      const pageSz = Number(pageSize);
      const out = await svc.history(unitId, pageNum, pageSz);
      return reply.send(out);
    }
  );

  app.get(
    "/units",
    { schema: { querystring: Type.Intersect([PaginationQuery, Type.Object({ status: Type.Optional(Type.String()) })]) } },
    async (req, reply) => {
      const { status, page = 1, pageSize = 50 } = req.query as any;
      if (!status) return reply.status(400).send({ error: "BadRequest", message: "status requerido" });
      if (!Object.values(Status).includes(status as Status)) {
        return reply.status(400).send({ error: "BadRequest", message: "status inválido" });
      }
      const out = await svc.unitsByStatus(status, Number(page), Number(pageSize));
      return reply.send(out);
    }
  );
}
