import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { sql } from "drizzle-orm";
import { db } from "@utilityx/db";

const app = Fastify({
  logger: true
});

await app.register(helmet);

await app.register(cors, {
  origin: true
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "utilityx-api"
  };
});

app.get("/health/database", async () => {
  await db.execute(sql`SELECT 1`);

  return {
    status: "ok",
    database: "connected"
  };
});

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
