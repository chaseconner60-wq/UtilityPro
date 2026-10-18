import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import {
  deleteDepartmentMapping,
  deleteStaffProfile,
  getManagementOverview,
  getManagementPlayerDetail,
  saveDepartmentMapping,
  saveStaffProfile,
  updateManagementSettings,
} from "./erlcManagement.js";

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

export function registerErlcManagementRoutes(
  app: FastifyInstance
) {
  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/erlc/:guildId/management",
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

      return getManagementOverview(
        request.params.guildId
      );
    }
  );

  app.get<{
    Params: {
      guildId: string;
      userId: string;
    };
  }>(
    "/internal/erlc/:guildId/management/player/:userId",
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
        return await getManagementPlayerDetail(
          request.params.guildId,
          request.params.userId
        );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Player not found.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
    };

    Body: {
      minimumTrackedSeconds?: number;
      minimumSessions?: number;
      inactivityDays?: number;
      promotionReadySeconds?: number;
      promotionReadySessions?: number;
    };
  }>(
    "/internal/erlc/:guildId/management/settings",
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

      const settings =
        await updateManagementSettings(
          request.params.guildId,
          request.body ?? {}
        );

      return {
        settings,
      };
    }
  );

  app.put<{
    Params: {
      guildId: string;
      userId: string;
    };

    Body: {
      username?: string;
      isStaff?: boolean;
      role?: string | null;
      department?: string | null;
      rank?: string | null;
      notes?: string | null;
      activityExempt?: boolean;
    };
  }>(
    "/internal/erlc/:guildId/management/staff/:userId",
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

      const profile =
        await saveStaffProfile(
          request.params.guildId,
          request.params.userId,
          request.body ?? {}
        );

      return {
        profile,
      };
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      userId: string;
    };
  }>(
    "/internal/erlc/:guildId/management/staff/:userId",
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

      return deleteStaffProfile(
        request.params.guildId,
        request.params.userId
      );
    }
  );

  app.put<{
    Params: {
      guildId: string;
    };

    Body: {
      sourceTeam?: string;
      departmentName?: string;
      isStaffDepartment?: boolean;
    };
  }>(
    "/internal/erlc/:guildId/management/departments",
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
        const mapping =
          await saveDepartmentMapping(
            request.params.guildId,
            request.body ?? {}
          );

        return {
          mapping,
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save department mapping.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      mappingId: string;
    };
  }>(
    "/internal/erlc/:guildId/management/departments/:mappingId",
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

      return deleteDepartmentMapping(
        request.params.guildId,
        request.params.mappingId
      );
    }
  );
}
