import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { eq, sql } from "drizzle-orm";
import { db, guilds } from "@utilityx/db";

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


app.get<{ Params: { id: string } }>("/guilds/:id", async (request, reply) => {
  const { id } = request.params;

  const [guild] = await db
    .select()
    .from(guilds)
    .where(eq(guilds.id, id))
    .limit(1);

  if (!guild) {
    return reply.code(404).send({
      error: "Guild not found"
    });
  }

  return {
    guild
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
