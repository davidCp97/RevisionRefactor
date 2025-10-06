import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";

export default fp(async (app) => {
  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyHelmet);
  await app.register(fastifyRateLimit, { max: 100, timeWindow: "1 minute" });
});
