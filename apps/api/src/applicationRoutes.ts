import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import {
  createApplicationForm,
  deleteApplicationForm,
  getApplicationForm,
  getApplicationPortal,
  getApplicationSubmission,
  getPublicApplicationForm,
  listApplicationForms,
  listApplicationSubmissions,
  listPublicApplicationForms,
  replaceApplicationQuestions,
  reviewApplicationSubmission,
  submitApplication,
  updateApplicationForm,
  updateApplicationPortal,
} from "./applications.js";

function internalAuthorized(
  request:
    FastifyRequest
) {
  const header =
    request.headers[
      "x-utilityx-internal-secret"
    ];

  return (
    !!process.env
      .INTERNAL_API_SECRET &&
    typeof header ===
      "string" &&
    header ===
      process.env
        .INTERNAL_API_SECRET
  );
}

function unauthorized(
  reply: any
) {
  return reply
    .code(401)
    .send({
      error:
        "Unauthorized",
    });
}

export function registerApplicationRoutes(
  app:
    FastifyInstance
) {
  // Public-safe data.
  // These routes do NOT expose reviewer
  // data or server secrets.

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/applications/public/:guildId",
    async (
      request,
      reply
    ) => {
      try {
        return await listPublicApplicationForms(
          request.params.guildId
        );
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to load applications.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
      formId: string;
    };
  }>(
    "/applications/public/:guildId/:formId",
    async (
      request,
      reply
    ) => {
      try {
        return await getPublicApplicationForm(
          request.params.guildId,
          request.params.formId
        );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Application not found.",
          });
      }
    }
  );

  // Submission is called by the UtilityX
  // web layer after Discord identity has
  // been verified there.
  app.post<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: {
      applicantUserId?: string;
      applicantUsername?: string;
      applicantAvatar?: string | null;

      answers?: Array<{
        questionId?: string;
        value?:
          | string
          | string[]
          | boolean
          | null;
      }>;
    };
  }>(
    "/internal/applications/:guildId/:formId/submit",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return {
          submission:
            await submitApplication(
              request.params.guildId,
              request.params.formId,
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
                : "Unable to submit application.",
          });
      }
    }
  );

  // Staff portal.

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/applications/:guildId",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      const [
        portal,
        forms,
        submissions,
      ] =
        await Promise.all([
          getApplicationPortal(
            request.params.guildId
          ),

          listApplicationForms(
            request.params.guildId
          ),

          listApplicationSubmissions(
            request.params.guildId
          ),
        ]);

      return {
        portal,
        forms,
        submissions,
      };
    }
  );

  app.patch<{
    Params: {
      guildId: string;
    };

    Body: {
      enabled?: boolean;
      portalName?: string;
      welcomeMessage?: string | null;
      reviewChannelId?: string | null;
    };
  }>(
    "/internal/applications/:guildId/portal",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      return {
        portal:
          await updateApplicationPortal(
            request.params.guildId,
            request.body ?? {}
          ),
      };
    }
  );

  app.post<{
    Params: {
      guildId: string;
    };

    Body: {
      name?: string;
      description?: string | null;
      status?: string;
      reviewChannelId?: string | null;
      acceptedRoleId?: string | null;
      maxApplicationsPerUser?: number;
      opensAt?: string | null;
      closesAt?: string | null;
      createdBy?: string | null;
    };
  }>(
    "/internal/applications/:guildId/forms",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return {
          form:
            await createApplicationForm(
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
                : "Unable to create application.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
      formId: string;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return await getApplicationForm(
          request.params.guildId,
          request.params.formId
        );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Application not found.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      formId: string;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return await deleteApplicationForm(
          request.params.guildId,
          request.params.formId
        );
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to delete application.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: {
      name?: string;
      description?: string | null;
      status?: string;
      reviewChannelId?: string | null;
      acceptedRoleId?: string | null;
      maxApplicationsPerUser?: number;
      opensAt?: string | null;
      closesAt?: string | null;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return {
          form:
            await updateApplicationForm(
              request.params.guildId,
              request.params.formId,
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
                : "Unable to update application.",
          });
      }
    }
  );

  app.put<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: {
      questions?: Array<{
        id?: string;
        sectionId?: string | null;
        label?: string;
        description?: string | null;
        type?:
          | "short"
          | "long"
          | "yes_no"
          | "single_select"
          | "multi_select";
        required?: boolean;
        options?: string[];
        position?: number;
      }>;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/questions",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return {
          questions:
            await replaceApplicationQuestions(
              request.params.guildId,
              request.params.formId,
              request.body
                ?.questions ??
                []
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save questions.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
    };

    Querystring: {
      formId?: string;
    };
  }>(
    "/internal/applications/:guildId/submissions",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      return {
        submissions:
          await listApplicationSubmissions(
            request.params.guildId,
            request.query.formId
          ),
      };
    }
  );

  app.get<{
    Params: {
      guildId: string;
      submissionId: string;
    };
  }>(
    "/internal/applications/:guildId/submissions/:submissionId",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return await getApplicationSubmission(
          request.params.guildId,
          request.params.submissionId
        );
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Submission not found.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
      submissionId: string;
    };

    Body: {
      status?: string;
      workflowStageId?: string | null;
      reviewerUserId?: string;
      reviewerUsername?: string;
      note?: string | null;
    };
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/review",
    async (
      request,
      reply
    ) => {
      if (
        !internalAuthorized(
          request
        )
      ) {
        return unauthorized(
          reply
        );
      }

      try {
        return {
          submission:
            await reviewApplicationSubmission(
              request.params.guildId,
              request.params.submissionId,
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
                : "Unable to review submission.",
          });
      }
    }
  );
}
