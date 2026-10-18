import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import {
  cancelManagedSession,
  createManagedSession,
  endManagedSession,
  getActiveSessionPreview,
  getManagedSessionDetail,
  getManagedSessions,
  startManagedSession,
} from "./erlcManagedSessions.js";

function authorized(
  request: FastifyRequest
) {
  const header =
    request.headers[
      "x-utilityx-internal-secret"
    ];

  return (
    !!process.env.INTERNAL_API_SECRET &&
    typeof header === "string" &&
    header ===
      process.env.INTERNAL_API_SECRET
  );
}

export function registerErlcManagedSessionRoutes(
  app: FastifyInstance
) {
  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/erlc/:guildId/command-sessions",
    async (
      request,
      reply
    ) => {
      if (!authorized(request)) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized",
          });
      }

      return {
        sessions:
          await getManagedSessions(
            request.params.guildId
          ),
      };
    }
  );

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/erlc/:guildId/command-sessions/active",
    async (
      request,
      reply
    ) => {
      if (!authorized(request)) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized",
          });
      }

      return getActiveSessionPreview(
        request.params.guildId
      );
    }
  );

  app.get<{
    Params: {
      guildId: string;
      sessionId: string;
    };
  }>(
    "/internal/erlc/:guildId/command-sessions/:sessionId",
    async (
      request,
      reply
    ) => {
      if (!authorized(request)) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized",
          });
      }

      try {
        return await getManagedSessionDetail(
          request.params.guildId,
          request.params.sessionId
        );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Session not found.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
    };

    Body: {
      title?: string;
      sessionType?: string;
      hostUserId?: string;
      hostUsername?: string;
      coHosts?: string[];
      minimumAttendanceSeconds?: number;
      notes?: string | null;
      scheduledFor?: string | null;
      createdBy?: string | null;
    };
  }>(
    "/internal/erlc/:guildId/command-sessions",
    async (
      request,
      reply
    ) => {
      if (!authorized(request)) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized",
          });
      }

      try {
        return {
          session:
            await createManagedSession(
              request.params.guildId,
              request.body ?? {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to create session.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
      sessionId: string;
      action: string;
    };
  }>(
    "/internal/erlc/:guildId/command-sessions/:sessionId/:action",
    async (
      request,
      reply
    ) => {
      if (!authorized(request)) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized",
          });
      }

      try {
        const {
          guildId,
          sessionId,
          action,
        } =
          request.params;

        if (
          action ===
          "start"
        ) {
          return {
            session:
              await startManagedSession(
                guildId,
                sessionId
              ),
          };
        }

        if (
          action ===
          "end"
        ) {
          return {
            session:
              await endManagedSession(
                guildId,
                sessionId
              ),
          };
        }

        if (
          action ===
          "cancel"
        ) {
          return {
            session:
              await cancelManagedSession(
                guildId,
                sessionId
              ),
          };
        }

        return reply
          .code(400)
          .send({
            error:
              "Unknown session action.",
          });
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Session action failed.",
          });
      }
    }
  );
}
