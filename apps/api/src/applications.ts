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
  recordApplicationStatusChange,
  recordApplicationSubmissionCreated,
} from "./applicationAdvanced.js";

import {
  db,
  applicationPortals,
  applicationForms,
  applicationQuestions,
  applicationSubmissions,
  applicationAnswers,
  applicationReviews,
} from "@utilityx/db";

export type ApplicationQuestionType =
  | "short"
  | "long"
  | "yes_no"
  | "single_select"
  | "multi_select";

type CreateFormInput = {
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

type QuestionInput = {
  id?: string;
  label?: string;
  description?: string | null;
  type?: ApplicationQuestionType;
  required?: boolean;
  options?: string[];
  position?: number;
};

type SubmitInput = {
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

type ReviewInput = {
  status?: string;
  reviewerUserId?: string;
  reviewerUsername?: string;
  note?: string | null;
};

const VALID_FORM_STATUSES =
  new Set([
    "draft",
    "open",
    "closed",
  ]);

const VALID_SUBMISSION_STATUSES =
  new Set([
    "pending",
    "interview",
    "accepted",
    "denied",
    "withdrawn",
  ]);

const VALID_QUESTION_TYPES =
  new Set<ApplicationQuestionType>([
    "short",
    "long",
    "yes_no",
    "single_select",
    "multi_select",
  ]);

function cleanText(
  value: unknown,
  max: number
): string | null {
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

function cleanStringArray(
  value: unknown,
  maxItems = 20,
  maxLength = 100
): string[] {
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
      maxItems
    );
}

function clampInt(
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

function parseDate(
  value: unknown
): Date | null {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed;
}

function formIsOpen(
  form:
    typeof applicationForms.$inferSelect
) {
  if (
    form.status !==
    "open"
  ) {
    return false;
  }

  const now =
    Date.now();

  if (
    form.opensAt &&
    form.opensAt.getTime() >
      now
  ) {
    return false;
  }

  if (
    form.closesAt &&
    form.closesAt.getTime() <
      now
  ) {
    return false;
  }

  return true;
}

export async function getApplicationPortal(
  guildId: string
) {
  let [portal] =
    await db
      .select()
      .from(
        applicationPortals
      )
      .where(
        eq(
          applicationPortals.guildId,
          guildId
        )
      )
      .limit(1);

  if (!portal) {
    [portal] =
      await db
        .insert(
          applicationPortals
        )
        .values({
          guildId,
        })
        .returning();
  }

  return portal;
}

export async function updateApplicationPortal(
  guildId: string,
  input: {
    enabled?: boolean;
    portalName?: string;
    welcomeMessage?: string | null;
    reviewChannelId?: string | null;
  }
) {
  await getApplicationPortal(
    guildId
  );

  const [portal] =
    await db
      .update(
        applicationPortals
      )
      .set({
        enabled:
          typeof input.enabled ===
            "boolean"
            ? input.enabled
            : undefined,

        portalName:
          cleanText(
            input.portalName,
            100
          ) ??
          undefined,

        welcomeMessage:
          input.welcomeMessage ===
            null
            ? null
            : cleanText(
                input.welcomeMessage,
                1000
              ) ??
              undefined,

        reviewChannelId:
          input.reviewChannelId ===
            null
            ? null
            : cleanText(
                input.reviewChannelId,
                40
              ) ??
              undefined,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          applicationPortals.guildId,
          guildId
        )
      )
      .returning();

  return portal;
}

export async function listApplicationForms(
  guildId: string
) {
  return db
    .select()
    .from(
      applicationForms
    )
    .where(
      eq(
        applicationForms.guildId,
        guildId
      )
    )
    .orderBy(
      desc(
        applicationForms.createdAt
      )
    );
}

export async function listPublicApplicationForms(
  guildId: string
) {
  const portal =
    await getApplicationPortal(
      guildId
    );

  if (!portal.enabled) {
    return {
      portal,
      forms: [],
    };
  }

  const forms =
    await listApplicationForms(
      guildId
    );

  return {
    portal,

    forms:
      forms.filter(
        formIsOpen
      ),
  };
}

export async function getApplicationForm(
  guildId: string,
  formId: string
) {
  const [form] =
    await db
      .select()
      .from(
        applicationForms
      )
      .where(
        and(
          eq(
            applicationForms.id,
            formId
          ),
          eq(
            applicationForms.guildId,
            guildId
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
        ),
        asc(
          applicationQuestions.createdAt
        )
      );

  return {
    form,
    questions,
  };
}

export async function getPublicApplicationForm(
  guildId: string,
  formId: string
) {
  const portal =
    await getApplicationPortal(
      guildId
    );

  if (!portal.enabled) {
    throw new Error(
      "Applications are currently disabled."
    );
  }

  const result =
    await getApplicationForm(
      guildId,
      formId
    );

  if (
    !formIsOpen(
      result.form
    )
  ) {
    throw new Error(
      "This application is not currently open."
    );
  }

  return {
    portal,
    ...result,
  };
}

export async function createApplicationForm(
  guildId: string,
  input: CreateFormInput
) {
  const name =
    cleanText(
      input.name,
      100
    );

  if (!name) {
    throw new Error(
      "Application name is required."
    );
  }

  const status =
    cleanText(
      input.status,
      20
    ) ??
    "draft";

  const safeStatus =
    VALID_FORM_STATUSES.has(
      status
    )
      ? status
      : "draft";

  const opensAt =
    parseDate(
      input.opensAt
    );

  const closesAt =
    parseDate(
      input.closesAt
    );

  if (
    opensAt &&
    closesAt &&
    closesAt <=
      opensAt
  ) {
    throw new Error(
      "Application close time must be after the open time."
    );
  }

  const [form] =
    await db
      .insert(
        applicationForms
      )
      .values({
        id:
          randomUUID(),

        guildId,

        name,

        description:
          cleanText(
            input.description,
            1500
          ),

        status:
          safeStatus,

        reviewChannelId:
          cleanText(
            input.reviewChannelId,
            40
          ),

        acceptedRoleId:
          cleanText(
            input.acceptedRoleId,
            40
          ),

        maxApplicationsPerUser:
          clampInt(
            input.maxApplicationsPerUser,
            1,
            25,
            1
          ),

        opensAt,
        closesAt,

        createdBy:
          cleanText(
            input.createdBy,
            40
          ),

        updatedAt:
          new Date(),
      })
      .returning();

  return form;
}

export async function updateApplicationForm(
  guildId: string,
  formId: string,
  input: CreateFormInput
) {
  const existing =
    await getApplicationForm(
      guildId,
      formId
    );

  const nextStatus =
    cleanText(
      input.status,
      20
    );

  if (
    nextStatus &&
    !VALID_FORM_STATUSES.has(
      nextStatus
    )
  ) {
    throw new Error(
      "Invalid application status."
    );
  }

  const opensAt =
    input.opensAt ===
      undefined
      ? existing.form.opensAt
      : parseDate(
          input.opensAt
        );

  const closesAt =
    input.closesAt ===
      undefined
      ? existing.form.closesAt
      : parseDate(
          input.closesAt
        );

  if (
    opensAt &&
    closesAt &&
    closesAt <=
      opensAt
  ) {
    throw new Error(
      "Application close time must be after the open time."
    );
  }

  const [form] =
    await db
      .update(
        applicationForms
      )
      .set({
        name:
          input.name ===
            undefined
            ? undefined
            : cleanText(
                input.name,
                100
              ) ??
              existing.form.name,

        description:
          input.description ===
            undefined
            ? undefined
            : input.description ===
                null
              ? null
              : cleanText(
                  input.description,
                  1500
                ),

        status:
          nextStatus ??
          undefined,

        reviewChannelId:
          input.reviewChannelId ===
            undefined
            ? undefined
            : input.reviewChannelId ===
                null
              ? null
              : cleanText(
                  input.reviewChannelId,
                  40
                ),

        acceptedRoleId:
          input.acceptedRoleId ===
            undefined
            ? undefined
            : input.acceptedRoleId ===
                null
              ? null
              : cleanText(
                  input.acceptedRoleId,
                  40
                ),

        maxApplicationsPerUser:
          input.maxApplicationsPerUser ===
            undefined
            ? undefined
            : clampInt(
                input.maxApplicationsPerUser,
                1,
                25,
                existing.form
                  .maxApplicationsPerUser
              ),

        opensAt,
        closesAt,

        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            applicationForms.id,
            formId
          ),
          eq(
            applicationForms.guildId,
            guildId
          )
        )
      )
      .returning();

  return form;
}

export async function replaceApplicationQuestions(
  guildId: string,
  formId: string,
  questions: QuestionInput[]
) {
  await getApplicationForm(
    guildId,
    formId
  );

  if (
    questions.length >
    50
  ) {
    throw new Error(
      "An application can have up to 50 questions."
    );
  }

  const normalized =
    questions.map(
      (
        question,
        index
      ) => {
        const label =
          cleanText(
            question.label,
            300
          );

        if (!label) {
          throw new Error(
            `Question ${index + 1} needs a label.`
          );
        }

        const type =
          question.type ??
          "short";

        if (
          !VALID_QUESTION_TYPES.has(
            type
          )
        ) {
          throw new Error(
            `Question ${index + 1} has an invalid type.`
          );
        }

        const options =
          cleanStringArray(
            question.options
          );

        if (
          (
            type ===
              "single_select" ||
            type ===
              "multi_select"
          ) &&
          options.length <
            2
        ) {
          throw new Error(
            `Question ${index + 1} needs at least two options.`
          );
        }

        return {
          id:
            question.id ??
            randomUUID(),

          formId,
          guildId,

          label,

          description:
            cleanText(
              question.description,
              500
            ),

          type,

          required:
            question.required ??
            true,

          options,

          position:
            index,
        };
      }
    );

  await db
    .delete(
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
    );

  if (
    normalized.length
  ) {
    await db
      .insert(
        applicationQuestions
      )
      .values(
        normalized
      );
  }

  return normalized;
}

function answerPresent(
  value:
    | string
    | string[]
    | boolean
    | null
    | undefined
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return true;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim().length >
      0
    );
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value.length >
      0
    );
  }

  return false;
}

function validateAnswer(
  question:
    typeof applicationQuestions.$inferSelect,
  value:
    | string
    | string[]
    | boolean
    | null
    | undefined
) {
  if (
    question.required &&
    !answerPresent(
      value
    )
  ) {
    throw new Error(
      `"${question.label}" is required.`
    );
  }

  if (
    !answerPresent(
      value
    )
  ) {
    return null;
  }

  if (
    question.type ===
    "yes_no"
  ) {
    if (
      typeof value !==
      "boolean"
    ) {
      throw new Error(
        `"${question.label}" must be yes or no.`
      );
    }

    return value;
  }

  if (
    question.type ===
    "multi_select"
  ) {
    if (
      !Array.isArray(
        value
      )
    ) {
      throw new Error(
        `"${question.label}" requires multiple-choice answers.`
      );
    }

    const values =
      cleanStringArray(
        value,
        20,
        100
      );

    const allowed =
      new Set(
        question.options ??
        []
      );

    if (
      values.some(
        (item) =>
          !allowed.has(
            item
          )
      )
    ) {
      throw new Error(
        `"${question.label}" contains an invalid option.`
      );
    }

    return values;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      `"${question.label}" requires a text answer.`
    );
  }

  const cleaned =
    value.trim();

  if (
    question.type ===
    "single_select"
  ) {
    if (
      !(
        question.options ??
        []
      ).includes(
        cleaned
      )
    ) {
      throw new Error(
        `"${question.label}" contains an invalid option.`
      );
    }

    return cleaned;
  }

  const max =
    question.type ===
      "long"
      ? 4000
      : 500;

  return cleaned.slice(
    0,
    max
  );
}

export async function submitApplication(
  guildId: string,
  formId: string,
  input: SubmitInput
) {
  const result =
    await getPublicApplicationForm(
      guildId,
      formId
    );

  const applicantUserId =
    cleanText(
      input.applicantUserId,
      40
    );

  const applicantUsername =
    cleanText(
      input.applicantUsername,
      100
    );

  if (
    !applicantUserId ||
    !applicantUsername
  ) {
    throw new Error(
      "Discord sign-in is required to submit an application."
    );
  }

  const existing =
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
            applicationSubmissions.formId,
            formId
          ),
          eq(
            applicationSubmissions.applicantUserId,
            applicantUserId
          )
        )
      );

  const activeExisting =
    existing.filter(
      (submission) =>
        submission.status !==
          "withdrawn"
    );

  if (
    activeExisting.length >=
    result.form
      .maxApplicationsPerUser
  ) {
    throw new Error(
      "You have reached the application limit for this form."
    );
  }

  const answerMap =
    new Map(
      (
        input.answers ??
        []
      ).map(
        (answer) => [
          answer.questionId,
          answer.value,
        ]
      )
    );

  const validated =
    result.questions.map(
      (question) => ({
        question,

        value:
          validateAnswer(
            question,
            answerMap.get(
              question.id
            )
          ),
      })
    );

  const submissionId =
    randomUUID();

  const [submission] =
    await db
      .insert(
        applicationSubmissions
      )
      .values({
        id:
          submissionId,

        guildId,
        formId,

        applicantUserId,
        applicantUsername,

        applicantAvatar:
          cleanText(
            input.applicantAvatar,
            500
          ),

        status:
          "pending",

        updatedAt:
          new Date(),
      })
      .returning();

  const answerRows =
    validated
      .filter(
        (entry) =>
          entry.value !==
          null
      )
      .map(
        (entry) => ({
          id:
            randomUUID(),

          submissionId,

          questionId:
            entry.question.id,

          guildId,

          value:
            entry.value,
        })
      );

  if (
    answerRows.length
  ) {
    await db
      .insert(
        applicationAnswers
      )
      .values(
        answerRows
      );
  }

  await recordApplicationSubmissionCreated(
    guildId,
    formId,
    submission.id,
    applicantUserId,
    applicantUsername
  );

  return submission;
}

export async function listApplicationSubmissions(
  guildId: string,
  formId?: string
) {
  const rows =
    await db
      .select()
      .from(
        applicationSubmissions
      )
      .where(
        formId
          ? and(
              eq(
                applicationSubmissions.guildId,
                guildId
              ),
              eq(
                applicationSubmissions.formId,
                formId
              )
            )
          : eq(
              applicationSubmissions.guildId,
              guildId
            )
      )
      .orderBy(
        desc(
          applicationSubmissions.submittedAt
        )
      );

  return rows;
}

export async function getApplicationSubmission(
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
      "Application submission not found."
    );
  }

  const [
    formData,
    answers,
    reviews,
  ] =
    await Promise.all([
      getApplicationForm(
        guildId,
        submission.formId
      ),

      db
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
        ),

      db
        .select()
        .from(
          applicationReviews
        )
        .where(
          and(
            eq(
              applicationReviews.guildId,
              guildId
            ),
            eq(
              applicationReviews.submissionId,
              submissionId
            )
          )
        )
        .orderBy(
          desc(
            applicationReviews.createdAt
          )
        ),
    ]);

  const answerMap =
    new Map(
      answers.map(
        (answer) => [
          answer.questionId,
          answer.value,
        ]
      )
    );

  return {
    submission,

    form:
      formData.form,

    answers:
      formData.questions.map(
        (question) => ({
          question,

          value:
            answerMap.get(
              question.id
            ) ??
            null,
        })
      ),

    reviews,
  };
}

export async function reviewApplicationSubmission(
  guildId: string,
  submissionId: string,
  input: ReviewInput
) {
  const current =
    await getApplicationSubmission(
      guildId,
      submissionId
    );

  const status =
    cleanText(
      input.status,
      30
    );

  if (
    !status ||
    !VALID_SUBMISSION_STATUSES.has(
      status
    )
  ) {
    throw new Error(
      "Invalid application status."
    );
  }

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

  const note =
    cleanText(
      input.note,
      2000
    );

  const reviewedAt =
    new Date();

  const [submission] =
    await db
      .update(
        applicationSubmissions
      )
      .set({
        status,

        reviewerUserId,
        reviewerUsername,

        reviewerNotes:
          note,

        reviewedAt,

        updatedAt:
          reviewedAt,
      })
      .where(
        eq(
          applicationSubmissions.id,
          current.submission.id
        )
      )
      .returning();

  await db
    .insert(
      applicationReviews
    )
    .values({
      id:
        randomUUID(),

      submissionId,
      guildId,

      action:
        status,

      reviewerUserId,
      reviewerUsername,

      note,
    });

  await recordApplicationStatusChange(
    guildId,
    submissionId,
    current.submission.status,
    status,
    reviewerUserId,
    reviewerUsername,
    note
  );

  return submission;
}
