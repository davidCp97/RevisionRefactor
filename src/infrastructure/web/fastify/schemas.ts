import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";

export const CreateCheckpointBody = Type.Object({
  unitId: Type.String({ minLength: 1 }),
  status: Type.String({ enum: ["CREATED", "IN_TRANSIT", "ARRIVED", "EXCEPTION", "COMPLETED"] }),
  eventTime: Type.Optional(Type.String({ format: "date-time" })), // opcional: si no viene, usamos now
});
export type CreateCheckpointBodyT = Static<typeof CreateCheckpointBody>;

export const PaginationQuery = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 200 })),
});
export type PaginationQueryT = Static<typeof PaginationQuery>;
