import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";

import {
  randomUUID,
} from "node:crypto";

import {
  db,
  applicationAdvancedSettings,
  applicationAnswers,
  applicationAppeals,
  applicationAssignments,
  applicationAuditLogs,
  applicationCustomStatuses,
  applicationForms,
  applicationInterviews,
  applicationPortalSlugs,
  applicationQuestions,
  applicationQuestionScores,
  applicationQuestionSettings,
  applicationReviews,
  applicationStatusHistory,
  applicationSubmissionCodes,
  applicationSubmissions,
  applicationTemplates,
} from "@utilityx/db";

function cleanText(
  value: unknown,
  max: number
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(
    0,
    max
  );
}

function cleanStrings(
  value: unknown,
  limit = 50,
  maxLength = 100
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    )
    .map(
      (item) =>
        item
          .trim()
          .slice(
            0,
            maxLength
          )
    )
    .filter(Boolean)
    .slice(
      0,
      limit
    );
}

function clamp(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return Math.max(
    min,
    Math.min(
      max,
      Math.round(
        parsed
      )
    )
  );
}

function slugify(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      60
    );
}

export async function getAdvancedApplicationSettings(
  guildId: string,
  formId: string
) {
  let [settings] =
    await db
      .select()
      .from(
        applicationAdvancedSettings
      )
      .where(
        and(
          eq(
            applicationAdvancedSettings.guildId,
            guildId
          ),
          eq(
            applicationAdvancedSettings.formId,
            formId
          )
        )
      )
      .limit(1);

  if (!settings) {
    await db
      .insert(
        applicationAdvancedSettings
      )
      .values({
        guildId,
        formId,
      })
      .onConflictDoNothing();

    [settings] =
      await db
        .select()
        .from(
          applicationAdvancedSettings
        )
        .where(
          and(
            eq(
              applicationAdvancedSettings.guildId,
              guildId
            ),
            eq(
              applicationAdvancedSettings.formId,
              formId
            )
          )
        )
        .limit(1);
  }

  return settings;
}

export async function updateAdvancedApplicationSettings(
  guildId: string,
  formId: string,
  input: {
    applicationPrefix?: string;
    cooldownHours?: number;
    maxTotalSubmissions?: number | null;
    autoCloseAtLimit?: boolean;
    minDiscordAccountAgeDays?: number;
    minServerJoinAgeDays?: number;
    requiredRoleIds?: string[];
    blockedRoleIds?: string[];
    reviewerRoleIds?: string[];
    scoringEnabled?: boolean;
    smartReviewEnabled?: boolean;
    applicantDmEnabled?: boolean;
    submitMessage?: string | null;
    interviewMessage?: string | null;
    acceptedMessage?: string | null;
    deniedMessage?: string | null;
    successMessage?: string | null;
    brandingAccent?: string | null;
    bannerUrl?: string | null;
  }
) {
  const current =
    await getAdvancedApplicationSettings(
      guildId,
      formId
    );

  const [updated] =
    await db
      .update(
        applicationAdvancedSettings
      )
      .set({
        applicationPrefix:
          input.applicationPrefix ===
            undefined
            ? undefined
            : cleanText(
                input.applicationPrefix,
                12
              )
                ?.toUpperCase()
                .replace(
                  /[^A-Z0-9]/g,
                  ""
                ) ||
              current.applicationPrefix,

        cooldownHours:
          input.cooldownHours ===
            undefined
            ? undefined
            : clamp(
                input.cooldownHours,
                0,
                8760,
                current.cooldownHours
              ),

        maxTotalSubmissions:
          input.maxTotalSubmissions ===
            undefined
            ? undefined
            : input.maxTotalSubmissions ===
                null
              ? null
              : clamp(
                  input.maxTotalSubmissions,
                  1,
                  100000,
                  100
                ),

        autoCloseAtLimit:
          input.autoCloseAtLimit,

        minDiscordAccountAgeDays:
          input.minDiscordAccountAgeDays ===
            undefined
            ? undefined
            : clamp(
                input.minDiscordAccountAgeDays,
                0,
                3650,
                current.minDiscordAccountAgeDays
              ),

        minServerJoinAgeDays:
          input.minServerJoinAgeDays ===
            undefined
            ? undefined
            : clamp(
                input.minServerJoinAgeDays,
                0,
                3650,
                current.minServerJoinAgeDays
              ),

        requiredRoleIds:
          input.requiredRoleIds ===
            undefined
            ? undefined
            : cleanStrings(
                input.requiredRoleIds
              ),

        blockedRoleIds:
          input.blockedRoleIds ===
            undefined
            ? undefined
            : cleanStrings(
                input.blockedRoleIds
              ),

        reviewerRoleIds:
          input.reviewerRoleIds ===
            undefined
            ? undefined
            : cleanStrings(
                input.reviewerRoleIds
              ),

        scoringEnabled:
          input.scoringEnabled,

        smartReviewEnabled:
          input.smartReviewEnabled,

        applicantDmEnabled:
          input.applicantDmEnabled,

        submitMessage:
          input.submitMessage ===
            undefined
            ? undefined
            : input.submitMessage ===
                null
              ? null
              : cleanText(
                  input.submitMessage,
                  2000
                ),

        interviewMessage:
          input.interviewMessage ===
            undefined
            ? undefined
            : input.interviewMessage ===
                null
              ? null
              : cleanText(
                  input.interviewMessage,
                  2000
                ),

        acceptedMessage:
          input.acceptedMessage ===
            undefined
            ? undefined
            : input.acceptedMessage ===
                null
              ? null
              : cleanText(
                  input.acceptedMessage,
                  2000
                ),

        deniedMessage:
          input.deniedMessage ===
            undefined
            ? undefined
            : input.deniedMessage ===
                null
              ? null
              : cleanText(
                  input.deniedMessage,
                  2000
                ),

        successMessage:
          input.successMessage ===
            undefined
            ? undefined
            : input.successMessage ===
                null
              ? null
              : cleanText(
                  input.successMessage,
                  2000
                ),

        brandingAccent:
          input.brandingAccent ===
            undefined
            ? undefined
            : input.brandingAccent ===
                null
              ? null
              : cleanText(
                  input.brandingAccent,
                  20
                ),

        bannerUrl:
          input.bannerUrl ===
            undefined
            ? undefined
            : input.bannerUrl ===
                null
              ? null
              : cleanText(
                  input.bannerUrl,
                  500
                ),

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          applicationAdvancedSettings.formId,
          formId
        )
      )
      .returning();

  return updated;
}

export async function saveQuestionSettings(
  guildId: string,
  formId: string,
  questionId: string,
  input: {
    minLength?: number | null;
    maxLength?: number | null;
    weight?: number;
    conditionalQuestionId?: string | null;
    conditionalOperator?: string | null;
    conditionalValue?:
      | string
      | string[]
      | boolean
      | null;
  }
) {
  const [existing] =
    await db
      .select()
      .from(
        applicationQuestionSettings
      )
      .where(
        eq(
          applicationQuestionSettings.questionId,
          questionId
        )
      )
      .limit(1);

  const values = {
    guildId,
    formId,
    questionId,

    minLength:
      input.minLength ===
        null
        ? null
        : input.minLength ===
            undefined
          ? existing?.minLength ??
            null
          : clamp(
              input.minLength,
              0,
              4000,
              0
            ),

    maxLength:
      input.maxLength ===
        null
        ? null
        : input.maxLength ===
            undefined
          ? existing?.maxLength ??
            null
          : clamp(
              input.maxLength,
              1,
              4000,
              500
            ),

    weight:
      input.weight ===
        undefined
        ? existing?.weight ??
          1
        : clamp(
            input.weight,
            1,
            100,
            1
          ),

    conditionalQuestionId:
      input.conditionalQuestionId ===
        undefined
        ? existing?.conditionalQuestionId ??
          null
        : cleanText(
            input.conditionalQuestionId,
            100
          ),

    conditionalOperator:
      input.conditionalOperator ===
        undefined
        ? existing?.conditionalOperator ??
          null
        : cleanText(
            input.conditionalOperator,
            30
          ),

    conditionalValue:
      input.conditionalValue ===
        undefined
        ? existing?.conditionalValue ??
          null
        : input.conditionalValue,

    updatedAt:
      new Date(),
  };

  if (existing) {
    const [updated] =
      await db
        .update(
          applicationQuestionSettings
        )
        .set(values)
        .where(
          eq(
            applicationQuestionSettings.questionId,
            questionId
          )
        )
        .returning();

    return updated;
  }

  const [created] =
    await db
      .insert(
        applicationQuestionSettings
      )
      .values(values)
      .returning();

  return created;
}

export async function getQuestionSettings(
  guildId: string,
  formId: string
) {
  return db
    .select()
    .from(
      applicationQuestionSettings
    )
    .where(
      and(
        eq(
          applicationQuestionSettings.guildId,
          guildId
        ),
        eq(
          applicationQuestionSettings.formId,
          formId
        )
      )
    );
}

export async function addApplicationAssignment(
  guildId: string,
  submissionId: string,
  input: {
    reviewerUserId?: string;
    reviewerUsername?: string;
    assignedByUserId?: string;
    assignedByUsername?: string;
  }
) {
  const reviewerUserId =
    cleanText(
      input.reviewerUserId,
      40
    );

  const reviewerUsername =
    cleanText(
      input.reviewerUsername,
      100
    );

  if (
    !reviewerUserId ||
    !reviewerUsername
  ) {
    throw new Error(
      "Reviewer is required."
    );
  }

  const existing =
    await db
      .select()
      .from(
        applicationAssignments
      )
      .where(
        and(
          eq(
            applicationAssignments.guildId,
            guildId
          ),
          eq(
            applicationAssignments.submissionId,
            submissionId
          )
        )
      );

  const duplicate =
    existing.find(
      (item) =>
        item.reviewerUserId ===
        reviewerUserId &&
        item.status ===
        "assigned"
    );

  if (duplicate) {
    return duplicate;
  }

  const [assignment] =
    await db
      .insert(
        applicationAssignments
      )
      .values({
        id:
          randomUUID(),

        guildId,
        submissionId,

        reviewerUserId,
        reviewerUsername,

        assignedByUserId:
          cleanText(
            input.assignedByUserId,
            40
          ),

        assignedByUsername:
          cleanText(
            input.assignedByUsername,
            100
          ),

        updatedAt:
          new Date(),
      })
      .returning();

  await writeApplicationAudit({
    guildId,
    submissionId,
    actorUserId:
      input.assignedByUserId,
    actorUsername:
      input.assignedByUsername,
    action:
      "reviewer_assigned",
    metadata: {
      reviewerUserId,
      reviewerUsername,
    },
  });

  return assignment;
}

export async function removeApplicationAssignment(
  guildId: string,
  assignmentId: string
) {
  const [assignment] =
    await db
      .select()
      .from(
        applicationAssignments
      )
      .where(
        and(
          eq(
            applicationAssignments.id,
            assignmentId
          ),
          eq(
            applicationAssignments.guildId,
            guildId
          )
        )
      )
      .limit(1);

  if (!assignment) {
    throw new Error(
      "Assignment not found."
    );
  }

  await db
    .delete(
      applicationAssignments
    )
    .where(
      eq(
        applicationAssignments.id,
        assignmentId
      )
    );

  return assignment;
}

export async function scoreApplicationQuestion(
  guildId: string,
  submissionId: string,
  questionId: string,
  input: {
    reviewerUserId?: string;
    reviewerUsername?: string;
    score?: number;
    note?: string | null;
  }
) {
  const reviewerUserId =
    cleanText(
      input.reviewerUserId,
      40
    );

  const reviewerUsername =
    cleanText(
      input.reviewerUsername,
      100
    );

  if (
    !reviewerUserId ||
    !reviewerUsername
  ) {
    throw new Error(
      "Reviewer identity is required."
    );
  }

  const score =
    clamp(
      input.score,
      1,
      5,
      3
    );

  const existing =
    await db
      .select()
      .from(
        applicationQuestionScores
      )
      .where(
        and(
          eq(
            applicationQuestionScores.submissionId,
            submissionId
          ),
          eq(
            applicationQuestionScores.questionId,
            questionId
          ),
          eq(
            applicationQuestionScores.reviewerUserId,
            reviewerUserId
          )
        )
      )
      .limit(1);

  if (existing[0]) {
    const [updated] =
      await db
        .update(
          applicationQuestionScores
        )
        .set({
          score,

          note:
            input.note ===
              null
              ? null
              : cleanText(
                  input.note,
                  1000
                ),

          reviewerUsername,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            applicationQuestionScores.id,
            existing[0].id
          )
        )
        .returning();

    return updated;
  }

  const [created] =
    await db
      .insert(
        applicationQuestionScores
      )
      .values({
        id:
          randomUUID(),

        guildId,
        submissionId,
        questionId,

        reviewerUserId,
        reviewerUsername,

        score,

        note:
          cleanText(
            input.note,
            1000
          ),

        updatedAt:
          new Date(),
      })
      .returning();

  return created;
}

export async function getSubmissionScoring(
  guildId: string,
  submissionId: string
) {
  const scores =
    await db
      .select()
      .from(
        applicationQuestionScores
      )
      .where(
        and(
          eq(
            applicationQuestionScores.guildId,
            guildId
          ),
          eq(
            applicationQuestionScores.submissionId,
            submissionId
          )
        )
      );

  const submission =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        and(
          eq(
            applicationSubmissions.guildId,
            guildId
          ),
          eq(
            applicationSubmissions.id,
            submissionId
          )
        )
      )
      .limit(1);

  if (!submission[0]) {
    throw new Error(
      "Submission not found."
    );
  }

  const settings =
    await getQuestionSettings(
      guildId,
      submission[0].formId
    );

  const weights =
    new Map(
      settings.map(
        (item) => [
          item.questionId,
          item.weight,
        ]
      )
    );

  let weightedTotal = 0;
  let totalWeight = 0;

  for (
    const score
    of scores
  ) {
    const weight =
      weights.get(
        score.questionId
      ) ??
      1;

    weightedTotal +=
      score.score *
      weight;

    totalWeight +=
      5 *
      weight;
  }

  return {
    scores,

    scorePercent:
      totalWeight
        ? Math.round(
            (
              weightedTotal /
              totalWeight
            ) *
              100
          )
        : null,
  };
}

export async function scheduleApplicationInterview(
  guildId: string,
  submissionId: string,
  input: {
    scheduledFor?: string | null;
    interviewerUserId?: string | null;
    interviewerUsername?: string | null;
    notes?: string | null;
  }
) {
  const scheduledFor =
    input.scheduledFor
      ? new Date(
          input.scheduledFor
        )
      : null;

  if (
    scheduledFor &&
    Number.isNaN(
      scheduledFor.getTime()
    )
  ) {
    throw new Error(
      "Invalid interview date."
    );
  }

  const [interview] =
    await db
      .insert(
        applicationInterviews
      )
      .values({
        id:
          randomUUID(),

        guildId,
        submissionId,

        status:
          "scheduled",

        scheduledFor,

        interviewerUserId:
          cleanText(
            input.interviewerUserId,
            40
          ),

        interviewerUsername:
          cleanText(
            input.interviewerUsername,
            100
          ),

        notes:
          cleanText(
            input.notes,
            2000
          ),

        updatedAt:
          new Date(),
      })
      .returning();

  await writeApplicationAudit({
    guildId,
    submissionId,
    actorUserId:
      input.interviewerUserId,
    actorUsername:
      input.interviewerUsername,
    action:
      "interview_scheduled",
    metadata: {
      scheduledFor:
        scheduledFor?.toISOString() ??
        null,
    },
  });

  return interview;
}

export async function updateApplicationInterview(
  guildId: string,
  interviewId: string,
  input: {
    status?: string;
    scheduledFor?: string | null;
    interviewerUserId?: string | null;
    interviewerUsername?: string | null;
    notes?: string | null;
    outcome?: string | null;
  }
) {
  const [current] =
    await db
      .select()
      .from(
        applicationInterviews
      )
      .where(
        and(
          eq(
            applicationInterviews.guildId,
            guildId
          ),
          eq(
            applicationInterviews.id,
            interviewId
          )
        )
      )
      .limit(1);

  if (!current) {
    throw new Error(
      "Interview not found."
    );
  }

  let scheduledFor:
    Date |
    null |
    undefined =
      undefined;

  if (
    input.scheduledFor ===
    null
  ) {
    scheduledFor =
      null;
  } else if (
    input.scheduledFor
  ) {
    const parsed =
      new Date(
        input.scheduledFor
      );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      throw new Error(
        "Invalid interview date."
      );
    }

    scheduledFor =
      parsed;
  }

  const [updated] =
    await db
      .update(
        applicationInterviews
      )
      .set({
        status:
          cleanText(
            input.status,
            30
          ) ??
          undefined,

        scheduledFor,

        interviewerUserId:
          input.interviewerUserId ===
            undefined
            ? undefined
            : cleanText(
                input.interviewerUserId,
                40
              ),

        interviewerUsername:
          input.interviewerUsername ===
            undefined
            ? undefined
            : cleanText(
                input.interviewerUsername,
                100
              ),

        notes:
          input.notes ===
            undefined
            ? undefined
            : input.notes ===
                null
              ? null
              : cleanText(
                  input.notes,
                  2000
                ),

        outcome:
          input.outcome ===
            undefined
            ? undefined
            : input.outcome ===
                null
              ? null
              : cleanText(
                  input.outcome,
                  1000
                ),

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          applicationInterviews.id,
          interviewId
        )
      )
      .returning();

  return updated;
}

export async function listApplicationInterviews(
  guildId: string,
  submissionId?: string
) {
  return db
    .select()
    .from(
      applicationInterviews
    )
    .where(
      submissionId
        ? and(
            eq(
              applicationInterviews.guildId,
              guildId
            ),
            eq(
              applicationInterviews.submissionId,
              submissionId
            )
          )
        : eq(
            applicationInterviews.guildId,
            guildId
          )
    )
    .orderBy(
      desc(
        applicationInterviews.createdAt
      )
    );
}

export async function saveCustomApplicationStatus(
  guildId: string,
  input: {
    id?: string;
    formId?: string | null;
    name?: string;
    position?: number;
    terminal?: boolean;
  }
) {
  const name =
    cleanText(
      input.name,
      80
    );

  if (!name) {
    throw new Error(
      "Status name is required."
    );
  }

  const statusSlug =
    slugify(name);

  if (!statusSlug) {
    throw new Error(
      "Invalid status name."
    );
  }

  if (input.id) {
    const [updated] =
      await db
        .update(
          applicationCustomStatuses
        )
        .set({
          name,
          slug:
            statusSlug,

          formId:
            input.formId ===
              undefined
              ? undefined
              : input.formId,

          position:
            input.position ===
              undefined
              ? undefined
              : clamp(
                  input.position,
                  0,
                  1000,
                  0
                ),

          terminal:
            input.terminal,

        })
        .where(
          and(
            eq(
              applicationCustomStatuses.guildId,
              guildId
            ),
            eq(
              applicationCustomStatuses.id,
              input.id
            )
          )
        )
        .returning();

    return updated;
  }

  const [created] =
    await db
      .insert(
        applicationCustomStatuses
      )
      .values({
        id:
          randomUUID(),

        guildId,

        formId:
          input.formId ??
          null,

        name,
        slug:
          statusSlug,

        position:
          clamp(
            input.position,
            0,
            1000,
            0
          ),

        terminal:
          Boolean(
            input.terminal
          ),
      })
      .returning();

  return created;
}

export async function deleteCustomApplicationStatus(
  guildId: string,
  statusId: string
) {
  await db
    .delete(
      applicationCustomStatuses
    )
    .where(
      and(
        eq(
          applicationCustomStatuses.guildId,
          guildId
        ),
        eq(
          applicationCustomStatuses.id,
          statusId
        )
      )
    );
}

export async function listCustomApplicationStatuses(
  guildId: string
) {
  return db
    .select()
    .from(
      applicationCustomStatuses
    )
    .where(
      eq(
        applicationCustomStatuses.guildId,
        guildId
      )
    )
    .orderBy(
      asc(
        applicationCustomStatuses.position
      )
    );
}

export async function writeApplicationAudit(
  input: {
    guildId: string;
    formId?: string | null;
    submissionId?: string | null;
    actorUserId?: string | null;
    actorUsername?: string | null;
    action: string;
    metadata?: Record<
      string,
      unknown
    >;
  }
) {
  await db
    .insert(
      applicationAuditLogs
    )
    .values({
      id:
        randomUUID(),

      guildId:
        input.guildId,

      formId:
        input.formId ??
        null,

      submissionId:
        input.submissionId ??
        null,

      actorUserId:
        cleanText(
          input.actorUserId,
          40
        ),

      actorUsername:
        cleanText(
          input.actorUsername,
          100
        ),

      action:
        input.action.slice(
          0,
          100
        ),

      metadata:
        input.metadata ??
        {},
    });
}

async function nextSubmissionCode(
  guildId: string,
  formId: string
) {
  const settings =
    await getAdvancedApplicationSettings(
      guildId,
      formId
    );

  const existing =
    await db
      .select()
      .from(
        applicationSubmissionCodes
      )
      .where(
        and(
          eq(
            applicationSubmissionCodes.guildId,
            guildId
          ),
          eq(
            applicationSubmissionCodes.formId,
            formId
          )
        )
      );

  let highest = 0;

  for (
    const item
    of existing
  ) {
    const match =
      item.code.match(
        /-(\d+)$/
      );

    if (match) {
      highest =
        Math.max(
          highest,
          Number(
            match[1]
          ) ||
            0
        );
    }
  }

  return `${settings.applicationPrefix}-${String(
    highest + 1
  ).padStart(
    4,
    "0"
  )}`;
}

export async function recordApplicationSubmissionCreated(
  guildId: string,
  formId: string,
  submissionId: string,
  applicantUserId: string,
  applicantUsername: string
) {
  const code =
    await nextSubmissionCode(
      guildId,
      formId
    );

  await db
    .insert(
      applicationSubmissionCodes
    )
    .values({
      submissionId,
      guildId,
      formId,
      code,
    })
    .onConflictDoNothing();

  await db
    .insert(
      applicationStatusHistory
    )
    .values({
      id:
        randomUUID(),

      guildId,
      submissionId,

      fromStatus:
        null,

      toStatus:
        "pending",

      actorUserId:
        applicantUserId,

      actorUsername:
        applicantUsername,
    });

  await writeApplicationAudit({
    guildId,
    formId,
    submissionId,

    actorUserId:
      applicantUserId,

    actorUsername:
      applicantUsername,

    action:
      "application_submitted",

    metadata: {
      code,
    },
  });

  return code;
}

export async function recordApplicationStatusChange(
  guildId: string,
  submissionId: string,
  fromStatus: string | null,
  toStatus: string,
  actorUserId?: string | null,
  actorUsername?: string | null,
  note?: string | null
) {
  await db
    .insert(
      applicationStatusHistory
    )
    .values({
      id:
        randomUUID(),

      guildId,
      submissionId,

      fromStatus,
      toStatus,

      actorUserId:
        cleanText(
          actorUserId,
          40
        ),

      actorUsername:
        cleanText(
          actorUsername,
          100
        ),

      note:
        cleanText(
          note,
          2000
        ),
    });

  await writeApplicationAudit({
    guildId,
    submissionId,
    actorUserId,
    actorUsername,

    action:
      "application_status_changed",

    metadata: {
      fromStatus,
      toStatus,
    },
  });
}

export async function createApplicationTemplate(
  guildId: string,
  formId: string,
  input: {
    name?: string;
    description?: string | null;
    createdBy?: string | null;
  }
) {
  const name =
    cleanText(
      input.name,
      100
    );

  if (!name) {
    throw new Error(
      "Template name is required."
    );
  }

  const [form] =
    await db
      .select()
      .from(
        applicationForms
      )
      .where(
        and(
          eq(
            applicationForms.guildId,
            guildId
          ),
          eq(
            applicationForms.id,
            formId
          )
        )
      )
      .limit(1);

  if (!form) {
    throw new Error(
      "Application form not found."
    );
  }

  const questions =
    await db
      .select()
      .from(
        applicationQuestions
      )
      .where(
        and(
          eq(
            applicationQuestions.guildId,
            guildId
          ),
          eq(
            applicationQuestions.formId,
            formId
          )
        )
      )
      .orderBy(
        asc(
          applicationQuestions.position
        )
      );

  const questionSettings =
    await getQuestionSettings(
      guildId,
      formId
    );

  const [template] =
    await db
      .insert(
        applicationTemplates
      )
      .values({
        id:
          randomUUID(),

        guildId,
        name,

        description:
          cleanText(
            input.description,
            1000
          ),

        createdBy:
          cleanText(
            input.createdBy,
            40
          ),

        formSnapshot: {
          form: {
            name:
              form.name,

            description:
              form.description,

            maxApplicationsPerUser:
              form.maxApplicationsPerUser,
          },

          questions:
            questions.map(
              (question) => ({
                label:
                  question.label,

                description:
                  question.description,

                type:
                  question.type,

                required:
                  question.required,

                options:
                  question.options,

                position:
                  question.position,

                settings:
                  questionSettings.find(
                    (item) =>
                      item.questionId ===
                      question.id
                  ) ??
                  null,
              })
            ),
        },
      })
      .returning();

  return template;
}

export async function listApplicationTemplates(
  guildId: string
) {
  return db
    .select()
    .from(
      applicationTemplates
    )
    .where(
      eq(
        applicationTemplates.guildId,
        guildId
      )
    )
    .orderBy(
      desc(
        applicationTemplates.createdAt
      )
    );
}

export async function createApplicationAppeal(
  guildId: string,
  submissionId: string,
  applicantUserId: string,
  reason: string
) {
  const cleanReason =
    cleanText(
      reason,
      4000
    );

  if (!cleanReason) {
    throw new Error(
      "Appeal reason is required."
    );
  }

  const [submission] =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        and(
          eq(
            applicationSubmissions.guildId,
            guildId
          ),
          eq(
            applicationSubmissions.id,
            submissionId
          ),
          eq(
            applicationSubmissions.applicantUserId,
            applicantUserId
          )
        )
      )
      .limit(1);

  if (!submission) {
    throw new Error(
      "Submission not found."
    );
  }

  if (
    submission.status !==
    "denied"
  ) {
    throw new Error(
      "Only denied applications can be appealed."
    );
  }

  const existing =
    await db
      .select()
      .from(
        applicationAppeals
      )
      .where(
        and(
          eq(
            applicationAppeals.guildId,
            guildId
          ),
          eq(
            applicationAppeals.submissionId,
            submissionId
          )
        )
      );

  if (
    existing.some(
      (appeal) =>
        appeal.status ===
        "pending"
    )
  ) {
    throw new Error(
      "A pending appeal already exists."
    );
  }

  const [appeal] =
    await db
      .insert(
        applicationAppeals
      )
      .values({
        id:
          randomUUID(),

        guildId,
        submissionId,
        applicantUserId,

        reason:
          cleanReason,
      })
      .returning();

  await writeApplicationAudit({
    guildId,
    submissionId,
    actorUserId:
      applicantUserId,

    action:
      "appeal_submitted",
  });

  return appeal;
}

export async function reviewApplicationAppeal(
  guildId: string,
  appealId: string,
  input: {
    status?: string;
    reviewerUserId?: string;
    reviewerUsername?: string;
    reviewerNote?: string | null;
  }
) {
  const status =
    cleanText(
      input.status,
      30
    );

  if (
    !status ||
    ![
      "accepted",
      "denied",
    ].includes(
      status
    )
  ) {
    throw new Error(
      "Appeal status must be accepted or denied."
    );
  }

  const [appeal] =
    await db
      .update(
        applicationAppeals
      )
      .set({
        status,

        reviewerUserId:
          cleanText(
            input.reviewerUserId,
            40
          ),

        reviewerUsername:
          cleanText(
            input.reviewerUsername,
            100
          ),

        reviewerNote:
          cleanText(
            input.reviewerNote,
            2000
          ),

        reviewedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            applicationAppeals.guildId,
            guildId
          ),
          eq(
            applicationAppeals.id,
            appealId
          )
        )
      )
      .returning();

  if (!appeal) {
    throw new Error(
      "Appeal not found."
    );
  }

  return appeal;
}

export async function getApplicantApplicationHistory(
  guildId: string,
  applicantUserId: string
) {
  const submissions =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        and(
          eq(
            applicationSubmissions.guildId,
            guildId
          ),
          eq(
            applicationSubmissions.applicantUserId,
            applicantUserId
          )
        )
      )
      .orderBy(
        desc(
          applicationSubmissions.submittedAt
        )
      );

  const codes =
    await db
      .select()
      .from(
        applicationSubmissionCodes
      )
      .where(
        eq(
          applicationSubmissionCodes.guildId,
          guildId
        )
      );

  const codeMap =
    new Map(
      codes.map(
        (item) => [
          item.submissionId,
          item.code,
        ]
      )
    );

  return submissions.map(
    (submission) => ({
      ...submission,

      code:
        codeMap.get(
          submission.id
        ) ??
        null,
    })
  );
}

export async function getApplicationAnalytics(
  guildId: string
) {
  const submissions =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        eq(
          applicationSubmissions.guildId,
          guildId
        )
      );

  const now =
    Date.now();

  const sevenDaysAgo =
    now -
    7 *
      24 *
      60 *
      60 *
      1000;

  const thirtyDaysAgo =
    now -
    30 *
      24 *
      60 *
      60 *
      1000;

  const reviewed =
    submissions.filter(
      (item) =>
        item.reviewedAt
    );

  const reviewDurations =
    reviewed.map(
      (item) =>
        Math.max(
          0,
          (
            item.reviewedAt!
              .getTime() -
            item.submittedAt
              .getTime()
          ) /
            1000
        )
    );

  const averageReviewSeconds =
    reviewDurations.length
      ? Math.round(
          reviewDurations.reduce(
            (
              total,
              value
            ) =>
              total +
              value,
            0
          ) /
            reviewDurations.length
        )
      : null;

  const accepted =
    submissions.filter(
      (item) =>
        item.status ===
        "accepted"
    ).length;

  const denied =
    submissions.filter(
      (item) =>
        item.status ===
        "denied"
    ).length;

  const decided =
    accepted +
    denied;

  const byForm:
    Record<
      string,
      number
    > = {};

  for (
    const submission
    of submissions
  ) {
    byForm[
      submission.formId
    ] =
      (
        byForm[
          submission.formId
        ] ??
        0
      ) +
      1;
  }

  return {
    total:
      submissions.length,

    pending:
      submissions.filter(
        (item) =>
          item.status ===
          "pending"
      ).length,

    interview:
      submissions.filter(
        (item) =>
          item.status ===
          "interview"
      ).length,

    accepted,
    denied,

    acceptanceRate:
      decided
        ? Math.round(
            (
              accepted /
              decided
            ) *
              100
          )
        : null,

    last7Days:
      submissions.filter(
        (item) =>
          item.submittedAt
            .getTime() >=
          sevenDaysAgo
      ).length,

    last30Days:
      submissions.filter(
        (item) =>
          item.submittedAt
            .getTime() >=
          thirtyDaysAgo
      ).length,

    averageReviewSeconds,

    byForm,
  };
}

export async function buildReviewerBrief(
  guildId: string,
  submissionId: string
) {
  const [submission] =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        and(
          eq(
            applicationSubmissions.guildId,
            guildId
          ),
          eq(
            applicationSubmissions.id,
            submissionId
          )
        )
      )
      .limit(1);

  if (!submission) {
    throw new Error(
      "Submission not found."
    );
  }

  const questions =
    await db
      .select()
      .from(
        applicationQuestions
      )
      .where(
        and(
          eq(
            applicationQuestions.guildId,
            guildId
          ),
          eq(
            applicationQuestions.formId,
            submission.formId
          )
        )
      )
      .orderBy(
        asc(
          applicationQuestions.position
        )
      );

  const answers =
    await db
      .select()
      .from(
        applicationAnswers
      )
      .where(
        and(
          eq(
            applicationAnswers.guildId,
            guildId
          ),
          eq(
            applicationAnswers.submissionId,
            submissionId
          )
        )
      );

  const answerMap =
    new Map(
      answers.map(
        (answer) => [
          answer.questionId,
          answer.value,
        ]
      )
    );

  const findings: string[] =
    [];

  let answered = 0;
  let totalTextCharacters = 0;

  for (
    const question
    of questions
  ) {
    const value =
      answerMap.get(
        question.id
      );

    const empty =
      value ===
        null ||
      value ===
        undefined ||
      value ===
        "" ||
      (
        Array.isArray(
          value
        ) &&
        value.length ===
          0
      );

    if (empty) {
      if (
        question.required
      ) {
        findings.push(
          `Required question "${question.label}" has no answer.`
        );
      }

      continue;
    }

    answered += 1;

    if (
      typeof value ===
      "string"
    ) {
      totalTextCharacters +=
        value.length;

      if (
        value.length <
        20
      ) {
        findings.push(
          `Very short response to "${question.label}".`
        );
      }
    }
  }

  return {
    answeredQuestions:
      answered,

    totalQuestions:
      questions.length,

    completionPercent:
      questions.length
        ? Math.round(
            (
              answered /
              questions.length
            ) *
              100
          )
        : 100,

    totalTextCharacters,

    findings,

    summary:
      findings.length
        ? `${findings.length} item${findings.length === 1 ? "" : "s"} may deserve reviewer attention.`
        : "No obvious response issues were detected.",
  };
}

export async function getAdvancedSubmissionDetail(
  guildId: string,
  submissionId: string
) {
  const [
    assignments,
    interviews,
    scoring,
    history,
    audits,
    codes,
    brief,
  ] =
    await Promise.all([
      db
        .select()
        .from(
          applicationAssignments
        )
        .where(
          and(
            eq(
              applicationAssignments.guildId,
              guildId
            ),
            eq(
              applicationAssignments.submissionId,
              submissionId
            )
          )
        ),

      listApplicationInterviews(
        guildId,
        submissionId
      ),

      getSubmissionScoring(
        guildId,
        submissionId
      ),

      db
        .select()
        .from(
          applicationStatusHistory
        )
        .where(
          and(
            eq(
              applicationStatusHistory.guildId,
              guildId
            ),
            eq(
              applicationStatusHistory.submissionId,
              submissionId
            )
          )
        )
        .orderBy(
          desc(
            applicationStatusHistory.createdAt
          )
        ),

      db
        .select()
        .from(
          applicationAuditLogs
        )
        .where(
          and(
            eq(
              applicationAuditLogs.guildId,
              guildId
            ),
            eq(
              applicationAuditLogs.submissionId,
              submissionId
            )
          )
        )
        .orderBy(
          desc(
            applicationAuditLogs.createdAt
          )
        ),

      db
        .select()
        .from(
          applicationSubmissionCodes
        )
        .where(
          eq(
            applicationSubmissionCodes.submissionId,
            submissionId
          )
        )
        .limit(1),

      buildReviewerBrief(
        guildId,
        submissionId
      ),
    ]);

  return {
    code:
      codes[0]?.code ??
      null,

    assignments,
    interviews,

    scoring,

    history,
    audits,

    reviewerBrief:
      brief,
  };
}

export async function setApplicationPortalSlug(
  guildId: string,
  requestedSlug: string
) {
  const slug =
    slugify(
      requestedSlug
    );

  if (
    slug.length <
    3
  ) {
    throw new Error(
      "Portal slug must contain at least 3 characters."
    );
  }

  const [existing] =
    await db
      .select()
      .from(
        applicationPortalSlugs
      )
      .where(
        eq(
          applicationPortalSlugs.slug,
          slug
        )
      )
      .limit(1);

  if (
    existing &&
    existing.guildId !==
      guildId
  ) {
    throw new Error(
      "That application URL is already in use."
    );
  }

  const current =
    await db
      .select()
      .from(
        applicationPortalSlugs
      )
      .where(
        eq(
          applicationPortalSlugs.guildId,
          guildId
        )
      );

  for (
    const item
    of current
  ) {
    if (
      item.slug !==
      slug
    ) {
      await db
        .delete(
          applicationPortalSlugs
        )
        .where(
          eq(
            applicationPortalSlugs.slug,
            item.slug
          )
        );
    }
  }

  if (existing) {
    const [updated] =
      await db
        .update(
          applicationPortalSlugs
        )
        .set({
          updatedAt:
            new Date(),
        })
        .where(
          eq(
            applicationPortalSlugs.slug,
            slug
          )
        )
        .returning();

    return updated;
  }

  const [created] =
    await db
      .insert(
        applicationPortalSlugs
      )
      .values({
        slug,
        guildId,
      })
      .returning();

  return created;
}

export async function resolveApplicationPortalSlug(
  slug: string
) {
  const [result] =
    await db
      .select()
      .from(
        applicationPortalSlugs
      )
      .where(
        eq(
          applicationPortalSlugs.slug,
          slugify(
            slug
          )
        )
      )
      .limit(1);

  return result ??
    null;
}
