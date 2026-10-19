import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import {
  addApplicationAssignment,
  createApplicationAppeal,
  createApplicationTemplate,
  deleteCustomApplicationStatus,
  getAdvancedApplicationSettings,
  getAdvancedSubmissionDetail,
  getApplicantApplicationHistory,
  getApplicationAnalytics,
  getQuestionSettings,
  listApplicationInterviews,
  listApplicationFormSections,
  createApplicationFormSection,
  updateApplicationFormSection,
  deleteApplicationFormSection,
  reorderApplicationFormSections,
  listApplicationWorkflowStages,
  createApplicationWorkflowStage,
  updateApplicationWorkflowStage,
  deleteApplicationWorkflowStage,
  reorderApplicationWorkflowStages,
  listApplicationTemplates,
  listCustomApplicationStatuses,
  removeApplicationAssignment,
  reviewApplicationAppeal,
  saveCustomApplicationStatus,
  saveQuestionSettings,
  scheduleApplicationInterview,
  scoreApplicationQuestion,
  setApplicationPortalSlug,
  updateAdvancedApplicationSettings,
  updateApplicationInterview,
} from "./applicationAdvanced.js";

function authorized(
  request: FastifyRequest
) {
  const secret =
    request.headers[
      "x-utilityx-internal-secret"
    ];

  return (
    !!process.env.INTERNAL_API_SECRET &&
    typeof secret ===
      "string" &&
    secret ===
      process.env.INTERNAL_API_SECRET
  );
}

function guard(
  request: FastifyRequest,
  reply: any
) {
  if (
    authorized(
      request
    )
  ) {
    return true;
  }

  reply
    .code(401)
    .send({
      error:
        "Unauthorized",
    });

  return false;
}

export function registerApplicationAdvancedRoutes(
  app: FastifyInstance
) {
  app.get<{
    Params: {
      guildId: string;
      formId: string;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/advanced",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      const [
        settings,
        questionSettings,
      ] =
        await Promise.all([
          getAdvancedApplicationSettings(
            request.params.guildId,
            request.params.formId
          ),

          getQuestionSettings(
            request.params.guildId,
            request.params.formId
          ),
        ]);

      return {
        settings,
        questionSettings,
      };
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/forms/:formId/advanced",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          settings:
            await updateAdvancedApplicationSettings(
              request.params.guildId,
              request.params.formId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save advanced settings.",
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
    "/internal/applications/:guildId/forms/:formId/workflow",
    async (
      request,
      reply
    ) => {
      if (
        !authorized(
          request
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized.",
          });
      }

      try {
        return {
          stages:
            await listApplicationWorkflowStages(
              request.params.guildId,
              request.params.formId
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to load workflow.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: {
      name?: string;
      stageType?: string;
      terminal?: boolean;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/workflow",
    async (
      request,
      reply
    ) => {
      if (
        !authorized(
          request
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized.",
          });
      }

      try {
        return {
          stage:
            await createApplicationWorkflowStage(
              request.params.guildId,
              request.params.formId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to create workflow stage.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      formId: string;
      stageId: string;
    };

    Body: {
      name?: string;
      stageType?: string;
      terminal?: boolean;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/workflow/:stageId",
    async (
      request,
      reply
    ) => {
      if (
        !authorized(
          request
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized.",
          });
      }

      try {
        return {
          stage:
            await updateApplicationWorkflowStage(
              request.params.guildId,
              request.params.formId,
              request.params.stageId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to update workflow stage.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      formId: string;
      stageId: string;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/workflow/:stageId",
    async (
      request,
      reply
    ) => {
      if (
        !authorized(
          request
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized.",
          });
      }

      try {
        return await deleteApplicationWorkflowStage(
          request.params.guildId,
          request.params.formId,
          request.params.stageId
        );
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to delete workflow stage.",
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
      stageIds?: string[];
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/workflow/reorder",
    async (
      request,
      reply
    ) => {
      if (
        !authorized(
          request
        )
      ) {
        return reply
          .code(401)
          .send({
            error:
              "Unauthorized.",
          });
      }

      try {
        return {
          stages:
            await reorderApplicationWorkflowStages(
              request.params.guildId,
              request.params.formId,
              Array.isArray(
                request.body
                  ?.stageIds
              )
                ? request.body
                    .stageIds
                : []
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to reorder workflow.",
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
    "/internal/applications/:guildId/forms/:formId/sections",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return {
        sections:
          await listApplicationFormSections(
            request.params.guildId,
            request.params.formId
          ),
      };
    }
  );

  app.post<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/forms/:formId/sections",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          section:
            await createApplicationFormSection(
              request.params.guildId,
              request.params.formId,
              request.body ?? {}
            ),
        };
      } catch (
        error
      ) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to create section.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      formId: string;
      sectionId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/forms/:formId/sections/:sectionId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          section:
            await updateApplicationFormSection(
              request.params.guildId,
              request.params.formId,
              request.params.sectionId,
              request.body ?? {}
            ),
        };
      } catch (
        error
      ) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to update section.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      formId: string;
      sectionId: string;
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/sections/:sectionId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return await deleteApplicationFormSection(
          request.params.guildId,
          request.params.formId,
          request.params.sectionId
        );
      } catch (
        error
      ) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to delete section.",
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
      sectionIds?: string[];
    };
  }>(
    "/internal/applications/:guildId/forms/:formId/sections/reorder",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          sections:
            await reorderApplicationFormSections(
              request.params.guildId,
              request.params.formId,
              request.body
                ?.sectionIds ??
                []
            ),
        };
      } catch (
        error
      ) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to reorder sections.",
          });
      }
    }
  );

  app.put<{
    Params: {
      guildId: string;
      formId: string;
      questionId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/forms/:formId/questions/:questionId/settings",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          settings:
            await saveQuestionSettings(
              request.params.guildId,
              request.params.formId,
              request.params.questionId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save question settings.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
      submissionId: string;
    };
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/advanced",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return await getAdvancedSubmissionDetail(
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
                : "Unable to load advanced submission data.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
      submissionId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/assignments",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          assignment:
            await addApplicationAssignment(
              request.params.guildId,
              request.params.submissionId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to assign reviewer.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      assignmentId: string;
    };
  }>(
    "/internal/applications/:guildId/assignments/:assignmentId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          assignment:
            await removeApplicationAssignment(
              request.params.guildId,
              request.params.assignmentId
            ),
        };
      } catch (error) {
        return reply
          .code(404)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Assignment not found.",
          });
      }
    }
  );

  app.put<{
    Params: {
      guildId: string;
      submissionId: string;
      questionId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/scores/:questionId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          score:
            await scoreApplicationQuestion(
              request.params.guildId,
              request.params.submissionId,
              request.params.questionId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save score.",
          });
      }
    }
  );

  app.post<{
    Params: {
      guildId: string;
      submissionId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/interviews",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          interview:
            await scheduleApplicationInterview(
              request.params.guildId,
              request.params.submissionId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to schedule interview.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      interviewId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/interviews/:interviewId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          interview:
            await updateApplicationInterview(
              request.params.guildId,
              request.params.interviewId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to update interview.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/applications/:guildId/interviews",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return {
        interviews:
          await listApplicationInterviews(
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
    "/internal/applications/:guildId/statuses",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return {
        statuses:
          await listCustomApplicationStatuses(
            request.params.guildId
          ),
      };
    }
  );

  app.put<{
    Params: {
      guildId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/statuses",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          status:
            await saveCustomApplicationStatus(
              request.params.guildId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save status.",
          });
      }
    }
  );

  app.delete<{
    Params: {
      guildId: string;
      statusId: string;
    };
  }>(
    "/internal/applications/:guildId/statuses/:statusId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      await deleteCustomApplicationStatus(
        request.params.guildId,
        request.params.statusId
      );

      return {
        ok: true,
      };
    }
  );

  app.post<{
    Params: {
      guildId: string;
      formId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/forms/:formId/templates",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          template:
            await createApplicationTemplate(
              request.params.guildId,
              request.params.formId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to create template.",
          });
      }
    }
  );

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/applications/:guildId/templates",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return {
        templates:
          await listApplicationTemplates(
            request.params.guildId
          ),
      };
    }
  );

  app.get<{
    Params: {
      guildId: string;
      userId: string;
    };
  }>(
    "/internal/applications/:guildId/applicants/:userId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return {
        applications:
          await getApplicantApplicationHistory(
            request.params.guildId,
            request.params.userId
          ),
      };
    }
  );

  app.get<{
    Params: {
      guildId: string;
    };
  }>(
    "/internal/applications/:guildId/analytics",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      return getApplicationAnalytics(
        request.params.guildId
      );
    }
  );

  app.put<{
    Params: {
      guildId: string;
    };

    Body: {
      slug?: string;
    };
  }>(
    "/internal/applications/:guildId/slug",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          portal:
            await setApplicationPortalSlug(
              request.params.guildId,
              String(
                request.body
                  ?.slug ??
                ""
              )
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to save portal URL.",
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
      applicantUserId?: string;
      reason?: string;
    };
  }>(
    "/internal/applications/:guildId/submissions/:submissionId/appeals",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          appeal:
            await createApplicationAppeal(
              request.params.guildId,
              request.params.submissionId,
              String(
                request.body
                  ?.applicantUserId ??
                ""
              ),
              String(
                request.body
                  ?.reason ??
                ""
              )
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to submit appeal.",
          });
      }
    }
  );

  app.patch<{
    Params: {
      guildId: string;
      appealId: string;
    };

    Body: any;
  }>(
    "/internal/applications/:guildId/appeals/:appealId",
    async (
      request,
      reply
    ) => {
      if (
        !guard(
          request,
          reply
        )
      ) {
        return;
      }

      try {
        return {
          appeal:
            await reviewApplicationAppeal(
              request.params.guildId,
              request.params.appealId,
              request.body ??
                {}
            ),
        };
      } catch (error) {
        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Unable to review appeal.",
          });
      }
    }
  );
}
