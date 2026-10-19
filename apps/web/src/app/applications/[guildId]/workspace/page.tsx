"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ApplicationForm = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  reviewChannelId?: string | null;
  acceptedRoleId?: string | null;
};

type Submission = {
  id: string;
  formId: string;
  workflowStageId?: string | null;
  applicantUserId: string;
  applicantUsername?: string | null;
  status: string;
  createdAt?: string;
  submittedAt?: string;
  applicationCode?: string | null;
};

type WorkflowStage = {
  id: string;
  guildId: string;
  formId: string;
  name: string;
  slug: string;
  position: number;
  stageType:
    | "submitted"
    | "review"
    | "interview"
    | "decision"
    | "custom";
  terminal: boolean;
};

type SubmissionAnswer = {
  question: {
    id: string;
    label: string;
    description?: string | null;
  };
  value:
    | string
    | string[]
    | boolean
    | null;
};

type SubmissionReview = {
  id: string;
  action: string;
  reviewerUserId?: string | null;
  reviewerUsername?: string | null;
  note?: string | null;
  createdAt?: string;
};

type SubmissionDetail = {
  submission: Submission;
  form: ApplicationForm;
  answers: SubmissionAnswer[];
  reviews: SubmissionReview[];
};

type AdvancedSubmissionDetail = {
  code?: string | null;

  assignments?: Array<{
    id: string;
    reviewerUserId?: string | null;
    reviewerUsername?: string | null;
  }>;

  interviews?: Array<{
    id: string;
    scheduledAt?: string | null;
    status?: string | null;
  }>;

  scoring?: unknown;

  history?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    reviewerUsername?: string | null;
    note?: string | null;
    createdAt?: string;
  }>;

  audits?: Array<{
    id: string;
    action?: string | null;
    actorUsername?: string | null;
    createdAt?: string;
  }>;

  reviewerBrief?: {
    answeredQuestions?: number;
    totalQuestions?: number;
    completionPercent?: number;
    totalTextCharacters?: number;
    findings?: string[];
    summary?: string;
  } | null;
};

type WorkspaceData = {
  forms: ApplicationForm[];
  submissions: Submission[];
};

type Section =
  | "overview"
  | "forms"
  | "reviews"
  | "interviews"
  | "applicants"
  | "automations"
  | "analytics"
  | "settings";

const navigation: Array<{
  id: Section;
  label: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Command center",
  },
  {
    id: "forms",
    label: "Forms",
    description: "Application builder",
  },
  {
    id: "reviews",
    label: "Review Center",
    description: "Review queue",
  },
  {
    id: "interviews",
    label: "Interviews",
    description: "Interview pipeline",
  },
  {
    id: "applicants",
    label: "Applicants",
    description: "Applicant profiles",
  },
  {
    id: "automations",
    label: "Automations",
    description: "Workflow engine",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Performance insights",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Workspace controls",
  },
];

function formatDate(
  value?: string
) {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function statusClass(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
    case "accepted":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "denied":
    case "rejected":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "interview":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    case "open":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";

    case "archived":
      return "border-zinc-400/20 bg-zinc-400/10 text-zinc-400";

    default:
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
}

export default function ApplicationsWorkspace({
  params,
}: {
  params: Promise<{
    guildId: string;
  }>;
}) {
  const [
    guildId,
    setGuildId,
  ] =
    useState("");

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<Section>(
      "overview"
    );

  const [
    data,
    setData,
  ] =
    useState<WorkspaceData>({
      forms: [],
      submissions: [],
    });

  const [
    workflowStagesByForm,
    setWorkflowStagesByForm,
  ] =
    useState<Record<
      string,
      WorkflowStage[]
    >>({});

  const [
    reviewFormId,
    setReviewFormId,
  ] =
    useState<string>(
      "all"
    );

  const [
    selectedSubmissionId,
    setSelectedSubmissionId,
  ] =
    useState<string | null>(
      null
    );

  const [
    submissionDetail,
    setSubmissionDetail,
  ] =
    useState<SubmissionDetail | null>(
      null
    );

  const [
    advancedSubmissionDetail,
    setAdvancedSubmissionDetail,
  ] =
    useState<AdvancedSubmissionDetail | null>(
      null
    );

  const [
    submissionDetailLoading,
    setSubmissionDetailLoading,
  ] =
    useState(false);

  const [
    submissionActionLoading,
    setSubmissionActionLoading,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    void params.then(
      ({ guildId }) =>
        setGuildId(
          guildId
        )
    );
  }, [params]);

  useEffect(() => {
    if (!guildId) {
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response =
          await fetch(
            `/api/applications/manage/${guildId}`,
            {
              cache:
                "no-store",
            }
          );

        const payload =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            payload.error ||
            "Unable to load Applications."
          );
        }

        setData({
          forms:
            payload.forms ??
            [],
          submissions:
            payload.submissions ??
            [],
        });

        const forms: ApplicationForm[] =
          payload.forms ??
          [];

        const workflowEntries =
          await Promise.all(
            forms.map(
              async (form) => {
                try {
                  const workflowResponse =
                    await fetch(
                      `/api/applications/manage/${guildId}?workflowFormId=${encodeURIComponent(form.id)}`,
                      {
                        cache:
                          "no-store",
                      }
                    );

                  if (
                    !workflowResponse.ok
                  ) {
                    return [
                      form.id,
                      [],
                    ] as const;
                  }

                  const workflowData =
                    await workflowResponse.json();

                  return [
                    form.id,
                    workflowData.stages ??
                      [],
                  ] as const;
                } catch {
                  return [
                    form.id,
                    [],
                  ] as const;
                }
              }
            )
          );

        setWorkflowStagesByForm(
          Object.fromEntries(
            workflowEntries
          )
        );
      } catch (
        loadError
      ) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Applications."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [guildId]);

  async function openSubmission(
    submissionId: string
  ) {
    setSelectedSubmissionId(
      submissionId
    );

    setSubmissionDetail(
      null
    );

    setAdvancedSubmissionDetail(
      null
    );

    setSubmissionDetailLoading(
      true
    );

    setError(
      null
    );

    try {
      const [
        detailResponse,
        advancedResponse,
      ] =
        await Promise.all([
          fetch(
            `/api/applications/manage/${guildId}?submissionId=${encodeURIComponent(submissionId)}`,
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            `/api/applications/manage/${guildId}?advancedSubmissionId=${encodeURIComponent(submissionId)}`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

      const [
        detailData,
        advancedData,
      ] =
        await Promise.all([
          detailResponse.json(),
          advancedResponse.json(),
        ]);

      if (
        !detailResponse.ok
      ) {
        throw new Error(
          detailData.error ||
          "Unable to load application."
        );
      }

      setSubmissionDetail(
        detailData
      );

      if (
        advancedResponse.ok
      ) {
        setAdvancedSubmissionDetail(
          advancedData
        );
      }
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load application."
      );

      setSelectedSubmissionId(
        null
      );
    } finally {
      setSubmissionDetailLoading(
        false
      );
    }
  }

  function closeSubmission() {
    setSelectedSubmissionId(
      null
    );

    setSubmissionDetail(
      null
    );

    setAdvancedSubmissionDetail(
      null
    );
  }

  async function moveSubmissionToStage(
    stageId: string
  ) {
    const detail =
      submissionDetail;

    if (
      !detail ||
      !stageId
    ) {
      return;
    }

    setSubmissionActionLoading(
      true
    );

    setError(
      null
    );

    try {
      const response =
        await fetch(
          `/api/applications/manage/${guildId}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "submission-review",

                submissionId:
                  detail.submission.id,

                workflowStageId:
                  stageId,

                note:
                  null,
              }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
          "Unable to move application."
        );
      }

      const updated =
        result.submission as
          Submission;

      setData(
        (current) => ({
          ...current,

          submissions:
            current.submissions.map(
              (submission) =>
                submission.id ===
                updated.id
                  ? {
                      ...submission,
                      ...updated,
                    }
                  : submission
            ),
        })
      );

      setSubmissionDetail(
        (current) =>
          current
            ? {
                ...current,

                submission: {
                  ...current.submission,
                  ...updated,
                },
              }
            : current
      );

      await openSubmission(
        updated.id
      );
    } catch (
      moveError
    ) {
      setError(
        moveError instanceof Error
          ? moveError.message
          : "Unable to move application."
      );
    } finally {
      setSubmissionActionLoading(
        false
      );
    }
  }

  const metrics =
    useMemo(() => {
      const pending =
        data.submissions.filter(
          (submission) =>
            [
              "pending",
              "submitted",
              "review",
            ].includes(
              submission.status?.toLowerCase()
            )
        ).length;

      const interviews =
        data.submissions.filter(
          (submission) =>
            submission.status?.toLowerCase() ===
            "interview"
        ).length;

      const accepted =
        data.submissions.filter(
          (submission) =>
            submission.status?.toLowerCase() ===
            "accepted"
        ).length;

      const decided =
        data.submissions.filter(
          (submission) =>
            [
              "accepted",
              "denied",
              "rejected",
            ].includes(
              submission.status?.toLowerCase()
            )
        );

      const acceptanceRate =
        decided.length
          ? Math.round(
              (accepted /
                decided.length) *
                100
            )
          : 0;

      return {
        pending,
        interviews,
        accepted,
        acceptanceRate,
      };
    }, [data]);

  const activeForms =
    data.forms.filter(
      (form) =>
        form.status ===
        "open"
    );

  const recentSubmissions =
    [...data.submissions]
      .sort((a, b) => {
        const aDate =
          new Date(
            a.submittedAt ??
            a.createdAt ??
            0
          ).getTime();

        const bDate =
          new Date(
            b.submittedAt ??
            b.createdAt ??
            0
          ).getTime();

        const reviewForms =
    reviewFormId ===
      "all"
      ? data.forms
      : data.forms.filter(
          (form) =>
            form.id ===
            reviewFormId
        );

  const reviewSubmissions =
    reviewFormId ===
      "all"
      ? data.submissions
      : data.submissions.filter(
          (submission) =>
            submission.formId ===
            reviewFormId
        );

  function submissionStage(
    submission: Submission
  ) {
    const stages =
      workflowStagesByForm[
        submission.formId
      ] ??
      [];

    if (
      submission.workflowStageId
    ) {
      const stage =
        stages.find(
          (candidate) =>
            candidate.id ===
            submission.workflowStageId
        );

      if (stage) {
        return stage;
      }
    }

    const status =
      submission.status
        .toLowerCase();

    if (
      status ===
      "interview"
    ) {
      return (
        stages.find(
          (stage) =>
            stage.stageType ===
            "interview"
        ) ??
        null
      );
    }

    if (
      status ===
        "accepted" ||
      status ===
        "denied"
    ) {
      return (
        stages.find(
          (stage) => {
            const identity =
              `${stage.slug} ${stage.name}`
                .toLowerCase();

            return status ===
              "accepted"
              ? identity.includes(
                  "accept"
                )
              : identity.includes(
                  "deny"
                ) ||
                  identity.includes(
                    "reject"
                  );
          }
        ) ??
        null
      );
    }

    return (
      stages[0] ??
      null
    );
  }

  return (
          bDate - aDate
        );
      })
      .slice(0, 6);

  const formMap =
    new Map(
      data.forms.map(
        (form) => [
          form.id,
          form,
        ]
      )
    );

  const reviewForms: ApplicationForm[] =
    reviewFormId ===
      "all"
      ? data.forms
      : data.forms.filter(
          (form) =>
            form.id ===
            reviewFormId
        );

  const reviewSubmissions: Submission[] =
    reviewFormId ===
      "all"
      ? data.submissions
      : data.submissions.filter(
          (submission) =>
            submission.formId ===
            reviewFormId
        );

  function submissionStage(
    submission: Submission
  ): WorkflowStage | null {
    const stages =
      workflowStagesByForm[
        submission.formId
      ] ??
      [];

    if (
      submission.workflowStageId
    ) {
      const stage =
        stages.find(
          (candidate) =>
            candidate.id ===
            submission.workflowStageId
        );

      if (stage) {
        return stage;
      }
    }

    const status =
      submission.status
        .toLowerCase();

    if (
      status ===
      "interview"
    ) {
      return (
        stages.find(
          (stage) =>
            stage.stageType ===
            "interview"
        ) ??
        null
      );
    }

    if (
      status ===
        "accepted" ||
      status ===
        "denied"
    ) {
      return (
        stages.find(
          (stage) => {
            const identity =
              `${stage.slug} ${stage.name}`
                .toLowerCase();

            if (
              status ===
              "accepted"
            ) {
              return identity.includes(
                "accept"
              );
            }

            return (
              identity.includes(
                "deny"
              ) ||
              identity.includes(
                "reject"
              )
            );
          }
        ) ??
        null
      );
    }

    return (
      stages[0] ??
      null
    );
  }

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[-220px] h-[520px] w-[520px] rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute right-[-120px] top-[15%] h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-[140px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/[0.06] bg-[#090a0e]/90 px-4 py-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="px-3">
            <div className="text-lg font-semibold tracking-tight">
              UtilityX
            </div>

            <div className="mt-1 text-xs text-zinc-600">
              Applications Workspace
            </div>
          </div>

          <div className="mt-8 space-y-1">
            {navigation.map(
              (item) => {
                const active =
                  activeSection ===
                  item.id;

                return (
                  <button
                    key={
                      item.id
                    }
                    onClick={() =>
                      setActiveSection(
                        item.id
                      )
                    }
                    className={[
                      "group w-full rounded-xl px-3 py-2.5 text-left transition",
                      active
                        ? "border border-white/[0.08] bg-white/[0.06]"
                        : "border border-transparent hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div
                      className={
                        active
                          ? "text-sm font-medium text-white"
                          : "text-sm font-medium text-zinc-400 group-hover:text-zinc-200"
                      }
                    >
                      {
                        item.label
                      }
                    </div>

                    <div className="mt-0.5 text-[11px] text-zinc-700">
                      {
                        item.description
                      }
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-auto rounded-2xl border border-violet-400/10 bg-violet-400/[0.04] p-4">
            <div className="text-xs font-semibold text-violet-200">
              Workspace 2.0
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Advanced workflows,
              automation and
              application management
              powered by UtilityX.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#07080b]/75 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-5 md:px-8 xl:px-10">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  Applications
                </p>

                <h1 className="mt-1 text-xl font-semibold tracking-tight">
                  {
                    navigation.find(
                      (item) =>
                        item.id ===
                        activeSection
                    )?.label
                  }
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/apply/${guildId}`}
                  target="_blank"
                  className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] md:block"
                >
                  View Portal
                </a>

                <button
                  onClick={() =>
                    setActiveSection(
                      "forms"
                    )
                  }
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  New Application
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 md:p-8 xl:p-10">
            {error ? (
              <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-5 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="grid min-h-[500px] place-items-center">
                <div className="text-sm text-zinc-600">
                  Loading Applications Workspace…
                </div>
              </div>
            ) : null}

            {!loading &&
            activeSection ===
              "overview" ? (
              <>
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Recruitment
                      command center
                    </p>

                    <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                      Everything happening
                      across your
                      application pipeline.
                    </h2>
                  </div>

                  <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3">
                    <div className="text-xs text-zinc-500">
                      System status
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Applications Online
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label:
                        "Pending Review",
                      value:
                        metrics.pending,
                      sub:
                        "Awaiting staff action",
                    },
                    {
                      label:
                        "Interviews",
                      value:
                        metrics.interviews,
                      sub:
                        "Currently in pipeline",
                    },
                    {
                      label:
                        "Accepted",
                      value:
                        metrics.accepted,
                      sub:
                        "Successful applicants",
                    },
                    {
                      label:
                        "Acceptance Rate",
                      value:
                        `${metrics.acceptanceRate}%`,
                      sub:
                        "Across decided applications",
                    },
                  ].map(
                    (metric) => (
                      <div
                        key={
                          metric.label
                        }
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-2xl shadow-black/10"
                      >
                        <div className="text-xs font-medium text-zinc-500">
                          {
                            metric.label
                          }
                        </div>

                        <div className="mt-4 text-3xl font-semibold tracking-tight">
                          {
                            metric.value
                          }
                        </div>

                        <div className="mt-2 text-xs text-zinc-700">
                          {
                            metric.sub
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
                      <div>
                        <h3 className="font-semibold">
                          Recent Applications
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                          Latest submissions across all forms
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setActiveSection(
                            "reviews"
                          )
                        }
                        className="text-xs font-medium text-zinc-500 hover:text-white"
                      >
                        Open Review Center
                      </button>
                    </div>

                    {recentSubmissions.length ? (
                      <div className="divide-y divide-white/[0.04]">
                        {recentSubmissions.map(
                          (
                            submission
                          ) => {
                            const form =
                              formMap.get(
                                submission.formId
                              );

                            return (
                              <div
                                key={
                                  submission.id
                                }
                                className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
                              >
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-sm font-semibold text-zinc-300">
                                  {(submission.applicantUsername ??
                                    "?")
                                    .slice(
                                      0,
                                      1
                                    )
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">
                                    {submission.applicantUsername ??
                                      submission.applicantUserId}
                                  </div>

                                  <div className="mt-1 truncate text-xs text-zinc-600">
                                    {form?.name ??
                                      "Application"}{" "}
                                    ·{" "}
                                    {submission.applicationCode ??
                                      submission.id.slice(
                                        0,
                                        8
                                      )}
                                  </div>
                                </div>

                                <div className="hidden text-xs text-zinc-700 md:block">
                                  {formatDate(
                                    submission.submittedAt ??
                                      submission.createdAt
                                  )}
                                </div>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${statusClass(
                                    submission.status
                                  )}`}
                                >
                                  {
                                    submission.status
                                  }
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="px-5 py-14 text-center">
                        <div className="text-sm font-medium text-zinc-400">
                          No applications yet
                        </div>

                        <div className="mt-2 text-xs text-zinc-700">
                          New submissions will appear here.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="border-b border-white/[0.05] px-5 py-4">
                        <h3 className="font-semibold">
                          Active Forms
                        </h3>

                        <p className="mt-1 text-xs text-zinc-600">
                          Currently accepting applications
                        </p>
                      </div>

                      <div className="space-y-2 p-3">
                        {activeForms.length ? (
                          activeForms
                            .slice(
                              0,
                              5
                            )
                            .map(
                              (
                                form
                              ) => (
                                <a
                                  key={
                                    form.id
                                  }
                                  href={`/applications/${guildId}/forms/${form.id}`}
                                  className="block w-full rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-white/[0.05] hover:bg-white/[0.03]"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {
                                          form.name
                                        }
                                      </div>

                                      <div className="mt-1 line-clamp-1 text-xs text-zinc-700">
                                        {form.description ??
                                          "No description"}
                                      </div>
                                    </div>

                                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                                  </div>
                                </a>
                              )
                            )
                        ) : (
                          <div className="px-3 py-8 text-center text-xs text-zinc-700">
                            No open forms
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-400/[0.06] to-sky-400/[0.02] p-5">
                      <div className="text-xs font-medium text-violet-300">
                        Workflow Engine
                      </div>

                      <h3 className="mt-3 text-lg font-semibold">
                        Build smarter hiring flows.
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Automate status changes,
                        Discord notifications,
                        reviewer assignments
                        and role actions.
                      </p>

                      <button
                        onClick={() =>
                          setActiveSection(
                            "automations"
                          )
                        }
                        className="mt-5 text-sm font-medium text-white"
                      >
                        Configure automations →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {!loading &&
            activeSection ===
              "forms" ? (
              <div>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Application Builder
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Forms
                    </h2>
                  </div>

                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {data.forms.map(
                    (form) => (
                      <div
                        key={
                          form.id
                        }
                        className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.1] hover:bg-white/[0.035]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">
                              {
                                form.name
                              }
                            </h3>

                            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">
                              {form.description ??
                                "No description configured."}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${statusClass(
                              form.status
                            )}`}
                          >
                            {
                              form.status
                            }
                          </span>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-4">
                          <div className="text-xs text-zinc-700">
                            {
                              data.submissions.filter(
                                (
                                  submission
                                ) =>
                                  submission.formId ===
                                  form.id
                              ).length
                            }{" "}
                            submissions
                          </div>

                          <a
                            href={`/applications/${guildId}/forms/${form.id}`}
                            className="text-xs font-medium text-zinc-400 transition group-hover:text-white"
                          >
                            Manage →
                          </a>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}

            {!loading &&
            activeSection ===
              "reviews" ? (
              <div>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">
                      Applications
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
                      Review Center
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                      Track every applicant through your configured review workflow.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={
                        reviewFormId
                      }
                      onChange={(event) =>
                        setReviewFormId(
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-white/[0.07] bg-[#090a0e] px-4 py-2.5 text-sm text-zinc-300"
                    >
                      <option value="all">
                        All Forms
                      </option>

                      {data.forms.map(
                        (form) => (
                          <option
                            key={
                              form.id
                            }
                            value={
                              form.id
                            }
                          >
                            {
                              form.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5 text-sm text-zinc-500">
                      {
                        reviewSubmissions.length
                      }{" "}
                      applications
                    </div>
                  </div>
                </div>

                {!data.forms.length ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/[0.07] px-6 py-16 text-center">
                    <div className="text-sm font-medium text-zinc-400">
                      No application forms yet
                    </div>

                    <p className="mt-2 text-xs text-zinc-700">
                      Create a form before using the Review Center.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 space-y-8">
                    {reviewForms.map(
                      (form) => {
                        const stages =
                          workflowStagesByForm[
                            form.id
                          ] ??
                          [];

                        const submissions =
                          reviewSubmissions.filter(
                            (
                              submission
                            ) =>
                              submission.formId ===
                              form.id
                          );

                        return (
                          <section
                            key={
                              form.id
                            }
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-zinc-200">
                                  {
                                    form.name
                                  }
                                </h3>

                                <p className="mt-1 text-xs text-zinc-600">
                                  {
                                    submissions.length
                                  }{" "}
                                  submissions ·{" "}
                                  {
                                    stages.length
                                  }{" "}
                                  workflow stages
                                </p>
                              </div>

                              <a
                                href={`/applications/${guildId}/forms/${form.id}`}
                                className="text-xs font-medium text-zinc-500 hover:text-white"
                              >
                                Edit Workflow →
                              </a>
                            </div>

                            {stages.length ? (
                              <div className="mt-6 overflow-x-auto pb-2">
                                <div
                                  className="grid min-w-max gap-4"
                                  style={{
                                    gridTemplateColumns:
                                      `repeat(${stages.length}, minmax(260px, 1fr))`,
                                  }}
                                >
                                  {stages.map(
                                    (
                                      stage,
                                      stageIndex
                                    ) => {
                                      const stageSubmissions =
                                        submissions.filter(
                                          (
                                            submission
                                          ) =>
                                            submissionStage(
                                              submission
                                            )?.id ===
                                            stage.id
                                        );

                                      return (
                                        <div
                                          key={
                                            stage.id
                                          }
                                          className="w-[280px] rounded-2xl border border-white/[0.06] bg-[#090a0e] p-3"
                                        >
                                          <div className="flex items-center justify-between gap-3 px-1 pb-3">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/[0.04] text-[10px] font-semibold text-zinc-600">
                                                  {stageIndex +
                                                    1}
                                                </span>

                                                <div className="text-sm font-medium text-zinc-300">
                                                  {
                                                    stage.name
                                                  }
                                                </div>
                                              </div>

                                              <div className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                                                {
                                                  stage.stageType
                                                }
                                                {stage.terminal
                                                  ? " · terminal"
                                                  : ""}
                                              </div>
                                            </div>

                                            <span className="rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-600">
                                              {
                                                stageSubmissions.length
                                              }
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {stageSubmissions.length ? (
                                              stageSubmissions.map(
                                                (
                                                  submission
                                                ) => (
                                                  <button
                                                    type="button"
                                                    key={
                                                      submission.id
                                                    }
                                                    onClick={() =>
                                                      void openSubmission(
                                                        submission.id
                                                      )
                                                    }
                                                    className="group block w-full rounded-xl border border-white/[0.055] bg-white/[0.02] p-3 text-left transition hover:border-white/[0.1] hover:bg-white/[0.035]"
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-xs font-semibold text-zinc-400">
                                                        {(submission.applicantUsername ??
                                                          "?")
                                                          .slice(
                                                            0,
                                                            1
                                                          )
                                                          .toUpperCase()}
                                                      </div>

                                                      <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium text-zinc-300">
                                                          {submission.applicantUsername ??
                                                            submission.applicantUserId}
                                                        </div>

                                                        <div className="mt-1 text-[11px] text-zinc-700">
                                                          {submission.applicationCode ??
                                                            submission.id.slice(
                                                              0,
                                                              8
                                                            )}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-3">
                                                      <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${statusClass(
                                                          submission.status
                                                        )}`}
                                                      >
                                                        {
                                                          submission.status
                                                        }
                                                      </span>

                                                      <span className="text-[10px] text-zinc-700">
                                                        {formatDate(
                                                          submission.submittedAt ??
                                                            submission.createdAt
                                                        )}
                                                      </span>
                                                    </div>
                                                  </button>
                                                )
                                              )
                                            ) : (
                                              <div className="rounded-xl border border-dashed border-white/[0.05] px-4 py-8 text-center text-[11px] text-zinc-800">
                                                No applicants
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-6 rounded-2xl border border-dashed border-white/[0.07] px-5 py-10 text-center">
                                <div className="text-sm font-medium text-zinc-400">
                                  No workflow configured
                                </div>

                                <p className="mt-2 text-xs text-zinc-700">
                                  Configure workflow stages before using the pipeline.
                                </p>

                                <a
                                  href={`/applications/${guildId}/forms/${form.id}`}
                                  className="mt-4 inline-block text-xs font-medium text-white"
                                >
                                  Configure Workflow →
                                </a>
                              </div>
                            )}
                          </section>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {!loading &&
            ![
              "overview",
              "forms",
              "reviews",
            ].includes(
              activeSection
            ) ? (
              <div className="grid min-h-[560px] place-items-center">
                <div className="max-w-lg text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-xl">
                    ✦
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold">
                    {
                      navigation.find(
                        (item) =>
                          item.id ===
                          activeSection
                      )?.label
                    }
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    This module is part of the new UtilityX Applications Workspace. We&apos;ll build this into a dedicated premium experience next.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
      {selectedSubmissionId ? (
        <>
          <button
            type="button"
            aria-label="Close applicant"
            onClick={
              closeSubmission
            }
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
          />

          <aside className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-[620px] overflow-y-auto border-l border-white/[0.07] bg-[#090a0e] shadow-2xl shadow-black/70">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#090a0e]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300/60">
                  Review Center
                </div>

                <h2 className="mt-1 text-lg font-semibold">
                  Applicant Review
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeSubmission
                }
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-500 transition hover:text-white"
              >
                ×
              </button>
            </div>

            {submissionDetailLoading ? (
              <div className="grid min-h-[70vh] place-items-center">
                <div className="text-sm text-zinc-600">
                  Loading application…
                </div>
              </div>
            ) : submissionDetail ? (
              <div className="space-y-6 p-6">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.05] text-sm font-semibold text-violet-300">
                      {(submissionDetail.submission.applicantUsername ??
                        "?")
                        .slice(
                          0,
                          1
                        )
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold">
                        {submissionDetail.submission.applicantUsername ??
                          submissionDetail.submission.applicantUserId}
                      </h3>

                      <div className="mt-1 text-xs text-zinc-600">
                        {
                          submissionDetail.form.name
                        }
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize ${statusClass(
                            submissionDetail.submission.status
                          )}`}
                        >
                          {
                            submissionDetail.submission.status
                          }
                        </span>

                        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-500">
                          {advancedSubmissionDetail?.code ??
                            submissionDetail.submission.applicationCode ??
                            submissionDetail.submission.id.slice(
                              0,
                              8
                            )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-zinc-500">
                    Workflow Stage
                  </div>

                  {(
                    workflowStagesByForm[
                      submissionDetail.submission.formId
                    ] ??
                    []
                  ).length ? (
                    <select
                      value={
                        submissionDetail.submission.workflowStageId ??
                        submissionStage(
                          submissionDetail.submission
                        )?.id ??
                        ""
                      }
                      disabled={
                        submissionActionLoading
                      }
                      onChange={(event) =>
                        void moveSubmissionToStage(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/[0.07] bg-[#07080b] px-4 py-3 text-sm text-zinc-300 disabled:opacity-50"
                    >
                      {(
                        workflowStagesByForm[
                          submissionDetail.submission.formId
                        ] ??
                        []
                      ).map(
                        (stage) => (
                          <option
                            key={
                              stage.id
                            }
                            value={
                              stage.id
                            }
                          >
                            {
                              stage.name
                            }
                            {stage.terminal
                              ? " · Final"
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.06] px-4 py-4 text-xs text-zinc-700">
                      This form does not have workflow stages configured.
                    </div>
                  )}
                </div>

                {advancedSubmissionDetail?.reviewerBrief ? (
                  <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.035] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-violet-300/70">
                        Reviewer Brief
                      </div>

                      <div className="text-xs text-zinc-600">
                        {
                          advancedSubmissionDetail.reviewerBrief.completionPercent ??
                          0
                        }
                        % complete
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {advancedSubmissionDetail.reviewerBrief.summary ??
                        "No reviewer summary available."}
                    </p>

                    {advancedSubmissionDetail.reviewerBrief.findings?.length ? (
                      <div className="mt-4 space-y-2">
                        {advancedSubmissionDetail.reviewerBrief.findings.map(
                          (
                            finding,
                            index
                          ) => (
                            <div
                              key={
                                `${finding}-${index}`
                              }
                              className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-xs text-zinc-500"
                            >
                              {
                                finding
                              }
                            </div>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Application Answers
                    </h3>

                    <span className="text-xs text-zinc-700">
                      {
                        submissionDetail.answers.length
                      }{" "}
                      responses
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {submissionDetail.answers.map(
                      (
                        answer,
                        index
                      ) => {
                        const value =
                          Array.isArray(
                            answer.value
                          )
                            ? answer.value.join(
                                ", "
                              )
                            : typeof answer.value ===
                                "boolean"
                              ? answer.value
                                ? "Yes"
                                : "No"
                              : answer.value ??
                                "No response";

                        return (
                          <div
                            key={
                              answer.question.id
                            }
                            className="rounded-2xl border border-white/[0.055] bg-white/[0.018] p-4"
                          >
                            <div className="flex gap-3">
                              <div className="text-xs text-zinc-800">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-zinc-300">
                                  {
                                    answer.question.label
                                  }
                                </div>

                                <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-500">
                                  {
                                    String(
                                      value
                                    )
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">
                    Review History
                  </h3>

                  <div className="mt-3 space-y-2">
                    {submissionDetail.reviews.length ? (
                      submissionDetail.reviews.map(
                        (
                          review
                        ) => (
                          <div
                            key={
                              review.id
                            }
                            className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-medium capitalize text-zinc-400">
                                {
                                  review.action
                                }
                              </div>

                              <div className="text-[10px] text-zinc-700">
                                {formatDate(
                                  review.createdAt
                                )}
                              </div>
                            </div>

                            <div className="mt-1 text-xs text-zinc-700">
                              {review.reviewerUsername
                                ? `by ${review.reviewerUsername}`
                                : "Reviewer action"}
                            </div>

                            {review.note ? (
                              <p className="mt-3 text-xs leading-5 text-zinc-500">
                                {
                                  review.note
                                }
                              </p>
                            ) : null}
                          </div>
                        )
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/[0.05] px-4 py-8 text-center text-xs text-zinc-700">
                        No review actions yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
                  <div className="text-xs text-zinc-700">
                    Submitted
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    {formatDate(
                      submissionDetail.submission.submittedAt ??
                        submissionDetail.submission.createdAt
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}

    </main>
  );
}
